export function generateSlug(name: string): string {
  const slug = name
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'category'
}
