import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { compilePublished } from './helpcenter-locales.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const source = path.join(root, 'docs/helpcenter');
const out = path.join(root, 'apps/client/public/helpcenter');
await compilePublished(source);
await mkdir(out, {recursive: true});
await writeFile(path.join(out, 'redirects.json'), await readFile(path.join(source, 'redirects.public.json')));
await import('./build-release-originals.mjs');
const catalog = JSON.parse(await readFile(path.join(source, 'catalog.json'), 'utf8'));
const updates = JSON.parse(await readFile(path.join(source, 'updates.json'), 'utf8'));
const updateIds = new Set();
let previousDate = '9999-12-31';
for (const update of updates) {
  if (updateIds.has(update.id)) throw new Error(`Duplicate update: ${update.id}`);
  updateIds.add(update.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(update.date) ||
      !Number.isFinite(Date.parse(update.date)) ||
      new Date(update.date).toISOString().slice(0, 10) !== update.date ||
      update.date > previousDate) throw new Error(`Invalid update date or order: ${update.id}`);
  previousDate = update.date;
  if (!update.title || !update.category || !update.description || !update.changes?.length)
    throw new Error(`Incomplete update: ${update.id}`);
  for (const change of update.changes) {
    if (!change.title || !change.description || !change.links?.length)
      throw new Error(`Incomplete change: ${update.id}`);
    for (const link of change.links)
      if (!link.label || !catalog.articles.some(a => a.slug === link.slug))
        throw new Error(`Broken update link: ${update.id} -> ${link.slug}`);
  }
}
await mkdir(path.join(out, 'markdown'), { recursive: true });
const exported = new Set(catalog.articles.map(a=>`${a.slug}.md`));
for (const file of await readdir(path.join(out,'markdown'))) if (file.endsWith('.md') && !exported.has(file)) await unlink(path.join(out,'markdown',file));
const seen = new Set();
let summary = '# Summary\n\n';
let llms = '# laightup Helpcenter\n\n> Anleitungen für die Digital-Signage-Plattform laightup. Sprache: Deutsch.\n\n';
for (const group of catalog.groups) {
  summary += `## ${group.title}\n\n`;
  llms += `## ${group.title}\n\n`;
  for (const article of catalog.articles.filter(a => a.group === group.id)) {
    if (seen.has(article.slug)) throw new Error(`Duplicate slug: ${article.slug}`);
    seen.add(article.slug);
    const markdown = await readFile(path.join(source, 'content', `${article.slug}.md`), 'utf8');
    for (const match of markdown.matchAll(/\]\(\/help\/([^#)]+)(?:#[^)]*)?\)/g)) {
      if (!catalog.articles.some(a => a.slug === match[1])) throw new Error(`Broken link: ${article.slug} -> ${match[1]}`);
    }
    await writeFile(path.join(out, 'markdown', `${article.slug}.md`), markdown);
    summary += `- [${article.title}](content/${article.slug}.md)\n`;
    llms += `- [${article.title}](/helpcenter/markdown/${article.slug}.md): ${article.description}\n`;
  }
  summary += '\n'; llms += '\n';
}
if (seen.size !== catalog.articles.length) throw new Error('Article without a valid group');
await writeFile(path.join(source, 'SUMMARY.md'), summary.trimEnd() + '\n');
await writeFile(path.join(out, 'llms.txt'), llms.trimEnd() + '\n');
await writeFile(path.join(out, 'llms-full.txt'), (await Promise.all(catalog.articles.map(a => readFile(path.join(source, 'content', `${a.slug}.md`), 'utf8')))).join('\n\n---\n\n'));
console.log(`Validated and exported ${seen.size} articles across ${catalog.groups.length} groups.`);
