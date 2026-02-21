import { CategoryAssignmentModel } from '../database/models/CategoryAssignmentModel'
import { CategoryModel } from '../database/models/CategoryModel'
import type { CategoryAssignment } from '../types'
import { mapCategoryAssignmentDoc } from './mappers'

interface AssignCategoryInput {
  tenantId: string
  telegramUserIds: string[]
  categoryIds: string[]
  assignedByTelegramId: string
}

interface AssignCategoryResult {
  assigned: CategoryAssignment[]
  invalidCategoryIds: string[]
}

class AssignCategory {
  async execute(input: AssignCategoryInput): Promise<AssignCategoryResult> {
    const validCats = await CategoryModel.find({
      _id: { $in: input.categoryIds },
      isActive: true,
      $or: [{ tenantId: input.tenantId }, { isGlobal: true }],
    })
      .select('_id')
      .lean<{ _id: any }[]>()

    const validCatIds = new Set(validCats.map(c => c._id.toString()))
    const invalidCategoryIds = input.categoryIds.filter(id => !validCatIds.has(id))

    const assigned: CategoryAssignment[] = []

    for (const telegramUserId of input.telegramUserIds) {
      for (const categoryId of input.categoryIds) {
        if (!validCatIds.has(categoryId)) continue

        const doc = await CategoryAssignmentModel.findOneAndUpdate(
          { tenantId: input.tenantId, telegramUserId, categoryId },
          {
            $set: { assignedByTelegramId: input.assignedByTelegramId },
            $setOnInsert: {
              tenantId: input.tenantId,
              telegramUserId,
              categoryId,
            },
          },
          { upsert: true, new: true },
        ).lean<any>()

        if (doc) assigned.push(mapCategoryAssignmentDoc(doc))
      }
    }

    return { assigned, invalidCategoryIds }
  }
}

export const assignCategory = new AssignCategory()
