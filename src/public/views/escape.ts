export function escapeHtml(text: unknown): string {
 if (typeof text !== 'string') return String(text ?? '');
 return text.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
 }[c]!));
}
