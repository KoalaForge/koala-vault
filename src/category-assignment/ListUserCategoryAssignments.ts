import { CategoryAssignmentModel } from '../database/models/CategoryAssignmentModel'
import type { CategoryAssignment } from '../types'
import { mapCategoryAssignmentDoc } from './mappers'

class ListUserCategoryAssignments {
  async execute(tenantId: string, telegramUserId: string): Promise<CategoryAssignment[]> {
    const docs = await CategoryAssignmentModel.find({ tenantId, telegramUserId })
      .sort({ createdAt: 1 })
      .lean<any[]>()

    return docs.map(mapCategoryAssignmentDoc)
  }
}

export const listUserCategoryAssignments = new ListUserCategoryAssignments()
