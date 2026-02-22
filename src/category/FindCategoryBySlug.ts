import { CategoryModel } from '../database/models/CategoryModel'
import type { Category } from '../types'
import { mapCategoryDoc } from './mappers'

class FindCategoryBySlug {
  async execute(tenantId: string, slug: string): Promise<Category | null> {
    const doc = await CategoryModel.findOne({
      slug,
      isActive: true,
      $or: [{ tenantId }, { isGlobal: true }],
    }).lean<any>()
    return doc ? mapCategoryDoc(doc) : null
  }
}

export const findCategoryBySlug = new FindCategoryBySlug()
