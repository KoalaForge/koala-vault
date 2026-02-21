import { CategoryAssignmentModel } from '../database/models/CategoryAssignmentModel'

interface DeassignCategoryInput {
  tenantId: string
  telegramUserIds: string[]
  categoryIds: string[]
}

interface DeassignCategoryResult {
  removedCount: number
  notFoundCount: number
}

class DeassignCategory {
  async execute(input: DeassignCategoryInput): Promise<DeassignCategoryResult> {
    let removedCount = 0
    let notFoundCount = 0

    for (const telegramUserId of input.telegramUserIds) {
      for (const categoryId of input.categoryIds) {
        const result = await CategoryAssignmentModel.findOneAndDelete({
          tenantId: input.tenantId,
          telegramUserId,
          categoryId,
        })

        if (result) {
          removedCount++
        } else {
          notFoundCount++
        }
      }
    }

    return { removedCount, notFoundCount }
  }
}

export const deassignCategory = new DeassignCategory()
