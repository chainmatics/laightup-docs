// Public product information only. Raw evidence stays in the internal archive.
export function publicReleaseMarkdown(markdown) {
  let hiddenLevel = 0;
  const lines = [];
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      if (hiddenLevel && level <= hiddenLevel) hiddenLevel = 0;
      if (/technische details|interne details|implementierungsdetails|tickets?|commits?|pull requests?/i.test(heading[2])) hiddenLevel = level;
    }
    if (!hiddenLevel) lines.push(line);
  }
  return lines.join('\n').split(/\n\s*\n/).filter(block =>
    !/\b[A-Z][A-Z0-9]{1,9}-\d+\b|\b(?:commits?|tickets?|pull requests?|release-pr)\b|(?:linear\.app|github\.com)|(?:Staging|Production)[- &]*(?:Release|Hotfix)|^\s*---\s*$/im.test(block)
  ).join('\n\n').replace(/<[^>]+>/g, '').trim();
}
