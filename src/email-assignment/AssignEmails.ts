import { EmailAssignmentModel } from '../database/models/EmailAssignmentModel'
import { RegisteredEmailModel } from '../database/models/RegisteredEmailModel'
import type { EmailAssignment } from '../types'
import { mapEmailAssignmentDoc } from './mappers'

interface AssignEmailsInput {
  tenantId: string
  telegramUserId: string
  emailAddresses: string[]
  daysUntilExpiry: number | null
  assignedByTelegramId: string
}

interface AssignEmailsResult {
  assigned: EmailAssignment[]
  skipped: string[]
}

class AssignEmails {
  async execute(input: AssignEmailsInput): Promise<AssignEmailsResult> {
    const expiresAt = input.daysUntilExpiry
      ? new Date(Date.now() + input.daysUntilExpiry * 24 * 60 * 60 * 1000)
      : null

    const assigned: EmailAssignment[] = []
    const skipped: string[] = []

    for (const rawEmail of input.emailAddresses) {
      const emailAddress = rawEmail.toLowerCase()

      // Look up provider from global pool; default to gmail
      const poolDoc = await RegisteredEmailModel.findOne({
        tenantId: input.tenantId,
        emailAddress,
      })
        .select('provider')
        .lean<any>()

      const provider: string = poolDoc?.provider ?? 'gmail'

      const doc = await EmailAssignmentModel.findOneAndUpdate(
        { tenantId: input.tenantId, telegramUserId: input.telegramUserId, emailAddress },
        {
          $set: { provider, expiresAt, assignedByTelegramId: input.assignedByTelegramId },
          $setOnInsert: {
            tenantId: input.tenantId,
            telegramUserId: input.telegramUserId,
            emailAddress,
          },
        },
        { upsert: true, new: true },
      ).lean<any>()

      if (doc) {
        assigned.push(mapEmailAssignmentDoc(doc))
      } else {
        skipped.push(rawEmail)
      }
    }

    return { assigned, skipped }
  }
}

export const assignEmails = new AssignEmails()
