import { validateUrls, publicRedirects } from "../docs/helpcenter/lib/urls.mjs";
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { validateStructure, orderedPages, pageStatus } from '../docs/helpcenter/lib/structure.mjs';

const json = async file => JSON.parse(await readFile(file, 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function writeChanged(file, value) {
  const text = typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`;
  try { if (await readFile(file, 'utf8') === text) return; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, text);
}
const isId = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
function flatten(value, prefix, into) {
  if (value && typeof value === 'object' && !Array.isArray(value) && !prefix.endsWith('searchSynonyms')) {
    for (const [key, child] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key) || key.includes('.')) throw new Error(`Invalid translation key: ${key}`);
      flatten(child, prefix ? `${prefix}.${key}` : key, into);
    }
  } else into[prefix] = value;
}
function unflatten(entries) {
  const output = {};
  for (const [key, value] of Object.entries(entries)) {
    const keys = key.split('.'); let cursor = output;
    for (const part of keys.slice(0, -1)) cursor = cursor[part] ??= {};
    cursor[keys.at(-1)] = value;
  }
  return output;
}
export async function sourceModel(root) {
  const config = await json(path.join(root, 'locales.json'));
  const rawStructure = await json(path.join(root, 'structure.json'));
  if (![1,2].includes(rawStructure.schemaVersion)) throw new Error("Unsupported structure schema version");
  validateStructure(rawStructure.groups, rawStructure.articles);
  const visibleArticles = orderedPages(rawStructure.groups, rawStructure.articles).filter(p => pageStatus(p) === 'published').map(({depth,...page}) => page);
  const structure = {...rawStructure, groups: rawStructure.groups.filter(g=>visibleArticles.some(p=>p.group===g.id)), articles:visibleArticles};
  if (!isId(config.sourceLocale) || config.locales[config.sourceLocale]?.status !== 'published') throw new Error('Source locale must be registered and published');
  const source = path.join(root, 'locales', config.sourceLocale);
  for (const [kind, entries] of Object.entries(structure)) {
    if (!Array.isArray(entries)) continue;
    const ids = entries.map(entry => entry.id);
    if (ids.some(id => !isId(id)) || new Set(ids).size !== ids.length) throw new Error(`Invalid or duplicate ${kind} IDs`);
  }
  if (structure.updates.some(update => update.category !== "product" || !update.sourceUpdateId)) throw new Error("Only sourced product news belong in the updates archive");
  const metadata = await json(path.join(source, 'metadata.json'));
  metadata.articles = Object.fromEntries(Object.entries(metadata.articles).filter(([id])=>structure.articles.some(p=>p.id===id)));
  metadata.groups = Object.fromEntries(Object.entries(metadata.groups).filter(([id])=>structure.groups.some(g=>g.id===id)));
  const messages = await json(path.join(source, 'messages.json'));
  const units = {}; flatten(metadata, 'metadata', units); flatten(messages, 'messages', units);
  for (const article of structure.articles) {
    if (!isId(article.id)) throw new Error(`Invalid article ID: ${article.id}`);
    units[`articleBody.${article.id}`] = await readFile(path.join(source, 'articles', `${article.id}.md`), 'utf8');
  }
  const manifest = await json(path.join(root, 'release-archive/manifest.json'));
  const records = new Map(manifest.updates.map(record => [record.id, record]));
  const required = new Set(manifest.releases.flatMap(id => [id, ...records.get(id).adoptedSources]));
  for (const id of required) {
    const record = records.get(id);
    if (!isId(id) || record.rawFile !== `raw/${id}-${record.bodySha256}.md`) throw new Error('Invalid release source path');
    const text = await readFile(path.join(root, 'release-archive', record.rawFile), 'utf8');
    if (createHash('sha256').update(text).digest('hex') !== record.bodySha256) throw new Error(`Changed release source: ${id}`);
    units[`releaseBody.${id}`] = text;
  }
  return { config, structure, units };
}
export async function localeStatus(root, locale, model) {
  model ??= await sourceModel(root);
  if (!isId(locale) || !model.config.locales[locale]) throw new Error(`Unregistered locale: ${locale}`);
  if (locale === model.config.sourceLocale) return { values: model.units, missing: [], outdated: [], unknown: [] };
  const directory = path.join(root, 'locales', locale);
  const values = {}; flatten(await json(path.join(directory, 'metadata.json')), 'metadata', values); flatten(await json(path.join(directory, 'messages.json')), 'messages', values);
  const state = await json(path.join(directory, 'translation-state.json'));
  for (const key of Object.keys(model.units)) {
    if (!/^(articleBody|releaseBody)\./.test(key)) continue;
    const [type, id] = key.split('.');
    try { values[key] = await readFile(path.join(directory, type === 'articleBody' ? 'articles' : 'release-texts', `${id}.md`), 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const missing = [], outdated = [];
  for (const [key, source] of Object.entries(model.units)) {
    const translated = values[key];
    if (translated == null || (typeof translated === 'string' && !translated.trim())) missing.push(key);
    else if (state.sourceHashes?.[key] !== hash(source)) outdated.push(key);
  }
  return { values, missing, outdated, unknown: Object.keys(values).filter(key => !(key in model.units)) };
}
const sections = markdown => [...markdown.matchAll(/^<!-- section: ([a-z0-9-]+) -->\n## /gm)].map(match => match[1]);
function tokens(markdown) { return [...markdown.matchAll(/\{\{[^}]+\}\}/g)].map(match => match[0]).sort(); }
export function resolveLinks(markdown, articles, prefix) {
  if (/\]\(\s*<?\/help(?:[\/#?\s>)]|$)/i.test(markdown) || /href\s*=\s*["']?\s*\/help(?:[\/#?\s"'>]|$)/i.test(markdown) || /^\s*\[[^\]\n]+\]:\s*<?\/help(?:[\/#?\s>]|$)/im.test(markdown)) throw new Error('Hard-coded help link: use a stable doc: reference');
  return markdown.replace(/\]\(doc:([^#)]+)(#[^)]*)?\)/g, (_, id, anchor = '') => {
    const target = articles.find(article => article.id === id);
    if (!target) throw new Error(`Unknown article reference: ${id}`);
    if (anchor && !sections(target.markdown).includes(anchor.slice(1))) throw new Error(`Unknown section: ${id}${anchor}`);
    return `](${prefix}/${target.slug}${anchor})`;
  });
}
export async function compileLocale(root, locale, { preview = false } = {}) {
  const model = await sourceModel(root);
  const status = await localeStatus(root, locale, model);
  if (status.unknown.length) throw new Error(`Unknown translation keys: ${status.unknown.join(', ')}`);
  if (!preview && (status.missing.length || status.outdated.length)) throw new Error(`Incomplete locale ${locale}: ${status.missing.length} missing, ${status.outdated.length} outdated`);
  const values = Object.fromEntries(Object.entries(model.units).map(([key, source]) => [key, status.missing.includes(key) ? source : status.values[key]]));
  for (const [key, source] of Object.entries(model.units)) {
    const translated = values[key];
    if (Array.isArray(source) ? !Array.isArray(translated) || translated.some(value => typeof value !== 'string') : typeof translated !== typeof source || translated === null) throw new Error(`Translation type mismatch: ${key}`);
    if (key === 'messages.searchSynonyms' && (Array.isArray(translated) || Object.values(translated).some(value => typeof value !== 'string'))) throw new Error('Search synonyms must be a string map');
  }
  const variables = text => [...text.matchAll(/(?<!\{)\{([a-zA-Z][a-zA-Z0-9_]*)\}(?!\})/g)].map(match => match[1]).sort();
  for (const [key, source] of Object.entries(model.units)) {
    if (typeof source === 'string' && JSON.stringify(tokens(source)) !== JSON.stringify(tokens(values[key]))) throw new Error(`Changed placeholder tokens: ${key}`);
    if (typeof source === 'string' && JSON.stringify(variables(source)) !== JSON.stringify(variables(values[key]))) throw new Error(`Changed message variables: ${key}`);
  }
  const localized = unflatten(values);
  const prefix = model.config.locales[locale].pathPrefix;
  if (!prefix || !/^\/help(?:\/[a-z0-9-]+)?$/.test(prefix)) throw new Error(`Invalid locale path: ${prefix}`);
  const groups = model.structure.groups.map(group => ({ ...group, ...localized.metadata.groups[group.id] }));
  const articles = model.structure.articles.map(article => ({ ...article, ...localized.metadata.articles[article.id], markdown: localized.articleBody[article.id] }));
  const redirects = model.structure.urlRedirects?.[locale] ?? [];
  const allMetadata = await json(path.join(root, 'locales', locale, 'metadata.json'));
  const rawStructure = await json(path.join(root, 'structure.json'));
  validateUrls([...articles, ...(locale === model.config.sourceLocale ? rawStructure.articles.filter(page => pageStatus(page) === 'draft').map(page => ({...page, slug: allMetadata.articles[page.id]?.slug})) : [])], redirects, [...Object.keys(model.config.locales), ...Object.values(model.config.locales).map(settings => settings.pathPrefix?.split("/")[2]).filter(Boolean)]);
  const redirectPaths = publicRedirects(articles, redirects, prefix);
  const slugs = new Set();
  for (const article of articles) {
    if (!isId(article.slug) || slugs.has(article.slug)) throw new Error(`Invalid or duplicate slug: ${article.slug}`);
    slugs.add(article.slug);
    if (!groups.some(group => group.id === article.group)) throw new Error(`Unknown group: ${article.group}`);
    const source = model.units[`articleBody.${article.id}`];
    if (JSON.stringify(sections(article.markdown)) !== JSON.stringify(sections(source))) throw new Error(`Changed section IDs/order: ${article.id}`);
    if (sections(article.markdown).length !== [...article.markdown.matchAll(/^## /gm)].length || new Set(sections(article.markdown)).size !== sections(article.markdown).length) throw new Error(`Missing or duplicate section marker: ${article.id}`);
    if (JSON.stringify(tokens(article.markdown)) !== JSON.stringify(tokens(source))) throw new Error(`Changed placeholder tokens: ${article.id}`);
    for (const step of article.steps) if (!articles.some(candidate => candidate.id === step)) throw new Error(`Unknown journey step: ${step}`);
  }
  const resolvedArticles = articles.map(article => ({ ...article, markdown: resolveLinks(article.markdown, articles, prefix), steps: article.steps.map(id => articles.find(candidate => candidate.id === id).slug) }));
  const updates = model.structure.updates.map(update => {
    const copy = localized.metadata.updates[update.id];
    return { ...update, ...copy, category: localized.messages.categories[update.category], changes: update.changes.map(change => ({
      ...copy.changes[change.id], id: change.id, links: change.links.map(link => {
        const target = articles.find(article => article.id === link.articleId);
        if (!target) throw new Error(`Unknown update link: ${link.articleId}`);
        return { slug: target.slug, label: copy.changes[change.id].linkLabels[link.articleId] };
      }),
    })) };
  });
  return { redirects: redirectPaths, locale, languageTag: model.config.locales[locale].languageTag, pathPrefix: prefix, catalog: { groups, articles: resolvedArticles.map(({ markdown, ...article }) => article) }, articles: resolvedArticles, updates, messages: localized.messages, releaseTexts: localized.releaseBody, status: { missing: status.missing, outdated: status.outdated, preview } };
}
export async function compilePublished(root) {
  const model = await sourceModel(root);
  const reports = {};
  const redirectPaths = {};
  for (const [locale, settings] of Object.entries(model.config.locales)) {
    const state = await localeStatus(root, locale, model);
    reports[locale] = { status: settings.status, missing: state.missing, outdated: state.outdated, unknown: state.unknown };
    if (settings.status !== 'published') continue;
    const bundle = await compileLocale(root, locale);
    Object.assign(redirectPaths, bundle.redirects);
    await writeChanged(path.join(root, 'generated', locale, 'bundle.json'), bundle);
    if (locale === model.config.sourceLocale) {
      await writeChanged(path.join(root, 'catalog.json'), bundle.catalog);
      await writeChanged(path.join(root, 'updates.json'), bundle.updates);
      await writeChanged(path.join(root, 'messages.json'), bundle.messages);
      for (const article of bundle.articles) await writeChanged(path.join(root, 'content', `${article.slug}.md`), article.markdown);
      const exported = new Set(bundle.articles.map(a=>`${a.slug}.md`));
      for (const file of await readdir(path.join(root,'content'))) if (file.endsWith('.md') && !exported.has(file)) await unlink(path.join(root,'content',file));
    }
  }
  await writeChanged(path.join(root, 'redirects.public.json'), redirectPaths);
  await writeChanged(path.join(root, 'translation-status.json'), reports);
  return reports;
}
export async function initializeLocale(root, locale, languageTag) {
  const model = await sourceModel(root);
  if (!isId(locale) || model.config.locales[locale]) throw new Error('Locale invalid or already exists');
  Intl.getCanonicalLocales(languageTag ?? locale);
  const directory = path.join(root, 'locales', locale);
  try { await readFile(path.join(directory, 'metadata.json')); throw new Error('Locale files already exist'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const values = Object.fromEntries(Object.keys(model.units).map(key => [key, null]));
  const blank = unflatten(values);
  await writeChanged(path.join(directory, 'metadata.json'), blank.metadata);
  await writeChanged(path.join(directory, 'messages.json'), blank.messages);
  for (const article of model.structure.articles) await writeChanged(path.join(directory, 'articles', `${article.id}.md`), '');
  for (const key of Object.keys(model.units).filter(key => key.startsWith('releaseBody.'))) await writeChanged(path.join(directory, 'release-texts', `${key.split('.')[1]}.md`), '');
  await writeChanged(path.join(directory, 'translation-state.json'), { sourceHashes: {} });
  model.config.locales[locale] = { status: 'draft', languageTag: languageTag ?? locale, pathPrefix: `/help/${locale}` };
  await writeChanged(path.join(root, 'locales.json'), model.config);
}
export async function acceptTranslations(root, locale) {
  const model = await sourceModel(root);
  if (locale === model.config.sourceLocale) throw new Error('Source language does not need approval hashes');
  const status = await localeStatus(root, locale, model);
  if (status.missing.length || status.unknown.length) throw new Error('Complete translation keys before marking reviewed');
  await compileLocale(root, locale, { preview: true });
  await writeChanged(path.join(root, 'locales', locale, 'translation-state.json'), { sourceHashes: Object.fromEntries(Object.entries(model.units).map(([key, source]) => [key, hash(source)])) });
}
