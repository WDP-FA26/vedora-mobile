export function isBlogVideoUrl(url: string) {
  return /\/video\/upload\//.test(url) || /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
}

/** Matches the backend: the first image line is the cover; videos never become covers. */
export function blogCoverFromContent(content: string): string {
  for (const [, url] of content.matchAll(/^!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)\s*$/gm)) {
    if (url.length <= 2048 && !isBlogVideoUrl(url)) return url;
  }
  return '';
}
