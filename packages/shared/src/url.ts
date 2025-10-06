export function normalizeUrl(u: string) {
  try {
    const url = new URL(u);
    url.hash = '';
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','fbclid','gclid']
      .forEach(p=>url.searchParams.delete(p));
    return url.toString();
  } catch { return u; }
}
