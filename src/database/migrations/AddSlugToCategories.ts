import { connectDatabase } from '../connection'
import { CategoryModel } from '../models/CategoryModel'
import { generateSlug } from '../../utils/generateSlug'

async function migrate(): Promise<void> {
  await connectDatabase.execute()

  const categories = await CategoryModel.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
  }).lean<any[]>()

  console.log(`Found ${categories.length} categories without slug`)

  if (categories.length === 0) {
    console.log('✅ Nothing to migrate')
    process.exit(0)
  }

  // Pre-load existing slugs per tenant to handle uniqueness
  const usedSlugsPerTenant = new Map<string, Set<string>>()

  for (const cat of categories) {
    const tenantKey = String(cat.tenantId)

    if (!usedSlugsPerTenant.has(tenantKey)) {
      const existing = await CategoryModel.find({
        tenantId: cat.tenantId,
        slug: { $exists: true, $ne: '' },
      })
        .select('slug')
        .lean<{ slug: string }[]>()
      usedSlugsPerTenant.set(tenantKey, new Set(existing.map(e => e.slug)))
    }

    const used = usedSlugsPerTenant.get(tenantKey)!
    const base = generateSlug(cat.name)
    let slug = base
    let counter = 2
    while (used.has(slug)) {
      slug = `${base}-${counter++}`
    }
    used.add(slug)

    await CategoryModel.updateOne({ _id: cat._id }, { $set: { slug } })
    console.log(`  "${cat.name}" → ${slug}`)
  }

  console.log('✅ Migration complete')
  process.exit(0)
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
