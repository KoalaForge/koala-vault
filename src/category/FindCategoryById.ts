import { CategoryModel } from '../database/models/CategoryModel'
import type { Category } from '../types'
import { mapCategoryDoc } from './mappers'

class FindCategoryById {
  async execute(tenantId: string, categoryId: string): Promise<Category | null> {
    const doc = await CategoryModel.findOne({
      _id: categoryId,
      isActive: true,
      $or: [{ tenantId }, { isGlobal: true }],
    }).lean<any>()
    return doc ? mapCategoryDoc(doc) : null
  }
}

export const findCategoryById = new FindCategoryById()
