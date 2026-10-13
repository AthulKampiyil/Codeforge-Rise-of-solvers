/** Explicit opt-in on development, loopback previews, or the hosted game. No saved unlock flag. */
export function developerToolsEnabled(development: boolean, hostname: string, search: string) {
  const local = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);
  const hosted = hostname === 'coc.teozeng.dev';
  return (development || local || hosted) && new URLSearchParams(search).get('devtools') === '1';
}
