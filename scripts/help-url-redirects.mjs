import { readFile } from 'node:fs/promises';
import path from 'node:path';
export function resolveRedirect(requestUrl, redirects) {
  const url = new URL(requestUrl, 'http://localhost');
  const pathname = url.pathname.replace(/\/$/, '');
  const markdown = pathname.match(/^\/helpcenter\/markdown\/([a-z0-9-]+)\.md$/);
  const key = markdown ? `/help/${markdown[1]}` : pathname;
  const target = Object.hasOwn(redirects, key) ? redirects[key] : undefined;
  if (typeof target !== 'string' || !/^\/help\/(?:[a-z0-9-]+\/)?[a-z0-9-]+$/.test(target)) return null;
  return (markdown ? `/helpcenter/markdown/${target.split('/').at(-1)}.md` : target) + url.search;
}
export function helpUrlRedirectPlugin(root) {
  const configure = (server, file) => {
    server.middlewares.use(async (req, res, next) => {
      if (!['GET', 'HEAD'].includes(req.method) || !/^\/help(?:\/|center\/markdown\/)/.test(req.url ?? '')) return next();
      try {
        const redirects = JSON.parse(await readFile(file, 'utf8'));
        const target = resolveRedirect(req.url, redirects);
        if (!target) return next();
        res.writeHead(308, {Location: target, 'Cache-Control': 'no-cache'}); res.end();
      } catch (error) { next(error); }
    });
  };
  return {name: 'help-url-redirects', configureServer: server => configure(server, path.join(root, 'docs/helpcenter/redirects.public.json')), configurePreviewServer: server => configure(server, path.resolve(server.config.root, server.config.build.outDir, 'helpcenter/redirects.json'))};
}
