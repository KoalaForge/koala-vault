import { CategoryModel } from '../database/models/CategoryModel'

class DeleteCategory {
  async execute(tenantId: string, categoryId: string): Promise<boolean> {
    const result = await CategoryModel.findOneAndUpdate(
      { _id: categoryId, tenantId },
      { $set: { isActive: false } }
    )
    return result !== null
  }
}

export const deleteCategory = new DeleteCategory()
