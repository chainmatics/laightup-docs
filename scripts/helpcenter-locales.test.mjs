import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileLocale, initializeLocale, localeStatus, acceptTranslations, resolveLinks } from './helpcenter-locales.mjs';
const actual = fileURLToPath(new URL('../docs/helpcenter', import.meta.url));
const json = async file => JSON.parse(await readFile(file, 'utf8'));
async function fixture(run) {
  const root = await mkdtemp(path.join(tmpdir(), 'laightup-locale-'));
  try {
    for (const name of ['locales', 'structure.json', 'locales.json', 'release-archive']) await cp(path.join(actual, name), path.join(root, name), { recursive: true });
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}
async function translatedFixture(root) {
  await initializeLocale(root, 'en', 'en-GB');
  await cp(path.join(root, 'locales/de/metadata.json'), path.join(root, 'locales/en/metadata.json'));
  await cp(path.join(root, 'locales/de/messages.json'), path.join(root, 'locales/en/messages.json'));
  await cp(path.join(root, 'locales/de/articles'), path.join(root, 'locales/en/articles'), { recursive: true });
  const source = await compileLocale(root, 'de');
  for (const [id, text] of Object.entries(source.releaseTexts)) await writeFile(path.join(root, 'locales/en/release-texts', `${id}.md`), text);
  const file = path.join(root, 'locales/en/metadata.json');
  const metadata = await json(file); metadata.articles.schnellstart.slug = 'first-content'; metadata.articles.schnellstart.title = 'Your first content';
  await writeFile(file, JSON.stringify(metadata));
  await acceptTranslations(root, 'en');
}

test('German compilation keeps existing article URLs and resolves stable references', () => fixture(async root => {
  const bundle = await compileLocale(root, 'de');
  assert.equal(bundle.articles.length, 39);
  assert.equal(bundle.updates.length, 13);
  const guide = bundle.articles.find(article => article.id === 'bibliothek');
  assert.match(guide.markdown, /\]\(\/help\/playlist-erstellen\)/);
  assert.doesNotMatch(guide.markdown, /\]\(doc:/);
  assert.match(guide.markdown, /<!-- section: dateien-und-designs-unterscheiden -->/);
}));
test('new locales start as incomplete drafts and cannot be published accidentally', () => fixture(async root => {
  await initializeLocale(root, 'fr', 'fr-FR');
  const status = await localeStatus(root, 'fr');
  assert.ok(status.missing.length > 100);
  await assert.rejects(compileLocale(root, 'fr'), /Incomplete locale/);
  const preview = await compileLocale(root, 'fr', { preview: true });
  assert.ok(preview.status.missing.length > 100);
  assert.equal(preview.status.preview, true);
}));
test('localized slugs resolve by stable article IDs and retain section anchors', () => fixture(async root => {
  await translatedFixture(root);
  const bundle = await compileLocale(root, 'en');
  assert.equal(bundle.articles.find(article => article.id === 'schnellstart').slug, 'first-content');
  assert.ok(bundle.articles.some(article => article.markdown.includes('/help/en/')));
  assert.equal(bundle.articles.find(article => article.id === 'bibliothek').steps.length, 0);
}));
test('only translations whose source unit changed become outdated', () => fixture(async root => {
  await translatedFixture(root);
  const file = path.join(root, 'locales/de/metadata.json');
  const metadata = await json(file); metadata.articles.bibliothek.description += ' Neue Quelle.';
  await writeFile(file, JSON.stringify(metadata));
  const status = await localeStatus(root, 'en');
  assert.deepEqual(status.outdated, ['metadata.articles.bibliothek.description']);
  await assert.rejects(compileLocale(root, 'en'), /outdated/);
}));
test('placeholder variables and stable section markers survive translation', () => fixture(async root => {
  await translatedFixture(root);
  const file = path.join(root, 'locales/en/articles/parameter-platzhalter.md');
  const text = await readFile(file, 'utf8');
  await writeFile(file, text.replace('{{system.location.city}}', '{{system.location.stadt}}'));
  await assert.rejects(acceptTranslations(root, 'en'), /Changed placeholder/);
  await writeFile(file, text.replace('<!-- section:', '<!-- kapitel:'));
  await assert.rejects(acceptTranslations(root, 'en'), /section/);
}));
test('invalid cross-references fail before content is published', () => fixture(async root => {
  const file = path.join(root, 'locales/de/articles/bibliothek.md');
  await writeFile(file, (await readFile(file, 'utf8')) + '\n[Kaputt](doc:unbekannt)\n');
  await assert.rejects(compileLocale(root, 'de'), /Unknown article reference/);
}));
test('localized interface messages retain interpolation variables', () => fixture(async root => {
  await translatedFixture(root);
  const file = path.join(root, 'locales/en/messages.json');
  const messages = await json(file); messages.updates.latest = 'Latest update';
  await writeFile(file, JSON.stringify(messages));
  await assert.rejects(acceptTranslations(root, 'en'), /Changed message variables/);
}));
test('copied German URLs cannot bypass locale-aware references', () => fixture(async root => {
  await translatedFixture(root);
  const file = path.join(root, 'locales/en/articles/bibliothek.md');
  const text = await readFile(file, 'utf8');
  await writeFile(file, text.replace('(doc:playlist-erstellen)', '(/help/playlist-erstellen)'));
  await assert.rejects(acceptTranslations(root, 'en'), /Hard-coded help link/);
}));
test('product variables are protected in translated release details too', () => fixture(async root => {
  const manifest = await json(path.join(root, 'release-archive/manifest.json'));
  const record = manifest.updates.find(entry => entry.kind === 'production');
  const { createHash } = await import('node:crypto');
  const original = (await readFile(path.join(root, 'release-archive', record.rawFile), 'utf8')) + '\nBeispiel {{angebot.preis}}\n';
  record.bodySha256 = createHash('sha256').update(original).digest('hex');
  record.rawFile = `raw/${record.id}-${record.bodySha256}.md`;
  await writeFile(path.join(root, 'release-archive', record.rawFile), original);
  await writeFile(path.join(root, 'release-archive/manifest.json'), JSON.stringify(manifest));
  await translatedFixture(root);
  const file = path.join(root, 'locales/en/release-texts', `${record.id}.md`);
  await writeFile(file, (await readFile(file, 'utf8')).replace('{{angebot.preis}}', '{{offer.price}}'));
  await assert.rejects(acceptTranslations(root, 'en'), /Changed placeholder tokens/);
}));

test('hard-coded help links cannot hide in Markdown whitespace, brackets or HTML', () => {
  for (const markdown of ['[Playlist]( /help/playlist-erstellen )', '[Playlist](</help/playlist-erstellen>)', '<a href = "/help/playlist-erstellen">Playlist</a>', '[Playlist][ref]\n\n[ref]: </help/playlist-erstellen>'])
    assert.throws(() => resolveLinks(markdown, [], '/help/en'), /Hard-coded help link/);
});
test('the updates archive rejects helpcenter news at its source', () => fixture(async root => {
  const file = path.join(root, 'structure.json');
  const structure = await json(file);
  structure.updates.push({id: 'helpcenter-announcement', date: '2026-11-01', category: 'helpcenter', changes: []});
  await writeFile(file, JSON.stringify(structure));
  await assert.rejects(compileLocale(root, 'de'), /Only sourced product news/);
}));
