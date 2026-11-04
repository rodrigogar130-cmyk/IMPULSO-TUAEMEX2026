/**
 * Resolves a site-owned path from the directory that contains the current
 * document. This keeps dynamic assets portable between Live Server, a custom
 * domain root, and a GitHub Pages project site.
 */
export function siteUrl(path) {
  return new URL(String(path).replace(/^\/+/, ''), new URL('./', document.baseURI)).href;
}
