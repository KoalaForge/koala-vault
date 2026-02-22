import { SessionModel } from '../database/models/SessionModel'
import type { UserSession, EmailResult } from '../types'
import { mapSessionDoc } from './mappers'

interface UpdateResultsInput {
  tenantId: string
  telegramUserId: string
  emailAddress: string
  result: EmailResult
}

class UpdateSessionResults {
  async execute(input: UpdateResultsInput): Promise<UserSession | null> {
    // Use aggregation pipeline update so the email address is treated as a
    // literal map key — plain $set dot-notation splits on "." and breaks
    // addresses like "user@gmail.com" into nested paths.
    const doc = await SessionModel.findOneAndUpdate(
      {
        tenantId: input.tenantId,
        telegramUserId: input.telegramUserId,
        expiresAt: { $gt: new Date() },
      },
      [{ $set: { results: { $mergeObjects: ['$results', { [input.emailAddress]: input.result }] } } }],
      { new: true }
    ).lean<any>()

    return doc ? mapSessionDoc(doc) : null
  }
}

export const updateSessionResults = new UpdateSessionResults()
