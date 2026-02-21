/**
 * Escapes the three characters that break Telegram HTML parse_mode:
 *   & → &amp;   (must be first to avoid double-escaping)
 *   < → &lt;
 *   > → &gt;
 */
export function he(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
