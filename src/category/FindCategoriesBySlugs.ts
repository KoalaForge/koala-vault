import { CategoryModel } from '../database/models/CategoryModel'
import type { Category } from '../types'
import { mapCategoryDoc } from './mappers'

class FindCategoriesBySlugs {
  async execute(tenantId: string, slugs: string[]): Promise<Category[]> {
    const docs = await CategoryModel.find({
      slug: { $in: slugs },
      isActive: true,
      $or: [{ tenantId }, { isGlobal: true }],
    }).lean<any[]>()
    return docs.map(mapCategoryDoc)
  }
}

export const findCategoriesBySlugs = new FindCategoriesBySlugs()
