import { CategoryModel } from '../database/models/CategoryModel'
import type { Category } from '../types'
import { mapCategoryDoc } from './mappers'

class FindActiveCategories {
  async execute(tenantId: string): Promise<Category[]> {
    const docs = await CategoryModel.find({
      isActive: true,
      $or: [{ tenantId }, { isGlobal: true }],
    })
      .sort({ displayOrder: 1, name: 1 })
      .lean<any[]>()
    return docs.map(mapCategoryDoc)
  }
}

export const findActiveCategories = new FindActiveCategories()
