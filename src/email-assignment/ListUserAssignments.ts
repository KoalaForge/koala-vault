import { EmailAssignmentModel } from '../database/models/EmailAssignmentModel'
import type { EmailAssignment } from '../types'
import { mapEmailAssignmentDoc } from './mappers'

class ListUserAssignments {
  async execute(tenantId: string, telegramUserId: string): Promise<EmailAssignment[]> {
    const now = new Date()
    const docs = await EmailAssignmentModel.find({
      tenantId,
      telegramUserId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ emailAddress: 1 })
      .lean<any[]>()

    return docs.map(mapEmailAssignmentDoc)
  }
}

export const listUserAssignments = new ListUserAssignments()
