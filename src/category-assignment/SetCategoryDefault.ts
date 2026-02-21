import { CategoryModel } from '../database/models/CategoryModel'
import type { Category } from '../types'
import { mapCategoryDoc } from '../category/mappers'

interface SetCategoryDefaultResult {
  category: Category
  isDefault: boolean
}

class SetCategoryDefault {
  async execute(tenantId: string, categoryId: string, isMaster: boolean): Promise<SetCategoryDefaultResult | null> {
    const existing = await CategoryModel.findOne({
      _id: categoryId,
      $or: [{ tenantId }, { isGlobal: true }],
    }).lean<any>()

    if (!existing) return null

    if (isMaster) {
      const newDefault = !existing.isDefault
      const updated = await CategoryModel.findByIdAndUpdate(
        categoryId,
        { $set: { isDefault: newDefault } },
        { new: true },
      ).lean<any>()
      if (!updated) return null
      return { category: mapCategoryDoc(updated), isDefault: newDefault }
    }

    const alreadyDefault = (existing.defaultForTenants ?? []).includes(tenantId)
    const update = alreadyDefault
      ? { $pull: { defaultForTenants: tenantId } }
      : { $addToSet: { defaultForTenants: tenantId } }

    const updated = await CategoryModel.findByIdAndUpdate(categoryId, update, { new: true }).lean<any>()
    if (!updated) return null

    const isDefault = (updated.defaultForTenants ?? []).includes(tenantId)
    return { category: mapCategoryDoc(updated), isDefault }
  }
}

export const setCategoryDefault = new SetCategoryDefault()
