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

    // Non-master: compute effective current status for this tenant
    const isGlobalDefault = !!existing.isDefault
    const isExcluded = (existing.defaultExcludedTenants ?? []).includes(tenantId)
    const isInPerTenant = (existing.defaultForTenants ?? []).includes(tenantId)
    const currentlyDefault = isGlobalDefault ? !isExcluded : isInPerTenant

    let update: object
    if (isGlobalDefault) {
      // Toggle opt-out from global default
      update = currentlyDefault
        ? { $addToSet: { defaultExcludedTenants: tenantId } }
        : { $pull: { defaultExcludedTenants: tenantId } }
    } else {
      // Toggle per-tenant default
      update = currentlyDefault
        ? { $pull: { defaultForTenants: tenantId } }
        : { $addToSet: { defaultForTenants: tenantId } }
    }

    const updated = await CategoryModel.findByIdAndUpdate(categoryId, update, { new: true }).lean<any>()
    if (!updated) return null

    const updatedExcluded = (updated.defaultExcludedTenants ?? []).includes(tenantId)
    const updatedPerTenant = (updated.defaultForTenants ?? []).includes(tenantId)
    const isDefault = isGlobalDefault ? !updatedExcluded : updatedPerTenant
    return { category: mapCategoryDoc(updated), isDefault }
  }
}

export const setCategoryDefault = new SetCategoryDefault()
