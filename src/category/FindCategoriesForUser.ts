import { CategoryModel } from '../database/models/CategoryModel'
import { CategoryAssignmentModel } from '../database/models/CategoryAssignmentModel'
import type { Category } from '../types'
import { mapCategoryDoc } from './mappers'

class FindCategoriesForUser {
  async execute(tenantId: string, telegramUserId: string): Promise<Category[]> {
    const baseQuery = { isActive: true, $or: [{ tenantId }, { isGlobal: true }] }

    const defaultFilter = { $or: [{ isDefault: true }, { defaultForTenants: tenantId }] }

    const [defaultDocs, assignments] = await Promise.all([
      CategoryModel.find({ ...baseQuery, ...defaultFilter })
        .sort({ displayOrder: 1, name: 1 })
        .lean<any[]>(),
      CategoryAssignmentModel.find({ tenantId, telegramUserId }).lean<any[]>(),
    ])

    if (assignments.length === 0) return defaultDocs.map(mapCategoryDoc)

    const defaultIds = new Set(defaultDocs.map(d => d._id.toString()))
    const extraCatIds = assignments
      .map(a => a.categoryId.toString())
      .filter(id => !defaultIds.has(id))

    if (extraCatIds.length === 0) return defaultDocs.map(mapCategoryDoc)

    const extraDocs = await CategoryModel.find({
      _id: { $in: extraCatIds },
      ...baseQuery,
    })
      .sort({ displayOrder: 1, name: 1 })
      .lean<any[]>()

    const combined = [...defaultDocs, ...extraDocs].sort((a, b) => {
      const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      return orderDiff !== 0 ? orderDiff : a.name.localeCompare(b.name)
    })

    return combined.map(mapCategoryDoc)
  }
}

export const findCategoriesForUser = new FindCategoriesForUser()
