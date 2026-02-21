import type { IEmailAssignment } from '../database/models/EmailAssignmentModel'
import type { EmailAssignment } from '../types'

export function mapEmailAssignmentDoc(doc: IEmailAssignment): EmailAssignment {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    telegramUserId: doc.telegramUserId,
    emailAddress: doc.emailAddress,
    provider: doc.provider ?? 'gmail',
    expiresAt: doc.expiresAt ?? null,
    assignedByTelegramId: doc.assignedByTelegramId,
    createdAt: doc.createdAt,
  }
}
