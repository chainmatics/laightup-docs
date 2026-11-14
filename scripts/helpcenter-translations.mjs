import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilePublished, compileLocale, initializeLocale, acceptTranslations, writeChanged } from './helpcenter-locales.mjs';
const root = fileURLToPath(new URL('../docs/helpcenter', import.meta.url));
const [command, locale, languageTag] = process.argv.slice(2);
try {
  if (command === 'init') await initializeLocale(root, locale, languageTag);
  else if (command === 'status') console.log(JSON.stringify(await compilePublished(root), null, 2));
  else if (command === 'review') await acceptTranslations(root, locale);
  else if (command === 'preview') await writeChanged(path.join(root, 'generated', locale, 'preview.json'), await compileLocale(root, locale, { preview: true }));
  else throw new Error('Usage: node scripts/helpcenter-translations.mjs init <locale> [languageTag] | status | review <locale> | preview <locale>');
} catch (error) { console.error(error.message); process.exitCode = 1; }
