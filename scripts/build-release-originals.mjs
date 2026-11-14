import { readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { publicReleaseMarkdown } from '../docs/helpcenter/lib/public-release.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const source = path.join(root, 'docs/helpcenter');
const archive = path.join(source, 'release-archive');
const out = path.join(root, 'apps/client/public/helpcenter/release-originals');
const manifest = JSON.parse(await readFile(path.join(archive, 'manifest.json'), 'utf8'));
const updates = JSON.parse(await readFile(path.join(source, 'updates.json'), 'utf8'));
if (!manifest.complete || !manifest.adoptionReviewComplete) throw new Error('Incomplete release source review');
const records = new Map(manifest.updates.map(record => [record.id, record]));
const products = updates.filter(update => update.category === 'Produkt');
const ids = products.map(update => update.sourceUpdateId);
if (new Set(ids).size !== ids.length || ids.length !== manifest.releases.length || manifest.releases.some(id => !ids.includes(id)))
  throw new Error('Product entries do not match Production source IDs');
const generated = [];
async function writeIfChanged(file, data) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  try { if ((await readFile(file)).equals(bytes)) return; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await writeFile(file, bytes);
}
async function original(id) {
  const record = records.get(id);
  if (!record || record.rawFile !== `raw/${record.id}-${record.bodySha256}.md`) throw new Error(`Invalid release path: ${id}`);
  const data = await readFile(path.join(archive, record.rawFile));
  if (createHash('sha256').update(data).digest('hex') !== record.bodySha256) throw new Error(`Changed original: ${id}`);
  return { id, title: record.title, url: record.url, bodySha256: record.bodySha256, rawFile: record.rawFile, markdown: data.toString('utf8') };
}
for (const update of products) {
  const record = records.get(update.sourceUpdateId);
  if (record.kind !== 'production' || record.releaseDate !== update.date) throw new Error(`Invalid publication: ${update.id}`);
  generated.push({ entryId: update.id, original: await original(record.id), adoptedSources: await Promise.all(record.adoptedSources.map(original)) });
}
await writeIfChanged(path.join(source, 'releases.json'), `${JSON.stringify(generated, null, 2)}\n`);
console.log(`Verified and exported ${generated.length} Production originals and ${generated.reduce((n, r) => n + r.adoptedSources.length, 0)} adopted sources.`);

// Never copy internal ticket data or raw sources into public assets or client imports.
await rm(out, { recursive: true, force: true });
const publicReleases = generated.map(release => ({
  entryId: release.entryId,
  original: { id: `${release.entryId}-release`, markdown: publicReleaseMarkdown(release.original.markdown) },
  adoptedSources: release.adoptedSources.map((item, index) => ({ id: `${release.entryId}-additional-${index + 1}`, markdown: publicReleaseMarkdown(item.markdown) }))
}));
await writeIfChanged(path.join(source, 'releases.public.json'), `${JSON.stringify(publicReleases, null, 2)}\n`);
