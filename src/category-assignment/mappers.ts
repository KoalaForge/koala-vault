import type { ICategoryAssignment } from '../database/models/CategoryAssignmentModel'
import type { CategoryAssignment } from '../types'

export function mapCategoryAssignmentDoc(doc: ICategoryAssignment): CategoryAssignment {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    telegramUserId: doc.telegramUserId,
    categoryId: doc.categoryId.toString(),
    assignedByTelegramId: doc.assignedByTelegramId,
    createdAt: doc.createdAt,
  }
}
