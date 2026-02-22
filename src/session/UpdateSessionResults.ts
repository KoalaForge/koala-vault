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
    // $setField treats the email address as a literal key (not a dot-path),
    // which correctly handles addresses like "user@gmail.com".
    // $literal prevents the result object from being interpreted as an expression.
    const doc = await SessionModel.findOneAndUpdate(
      {
        tenantId: input.tenantId,
        telegramUserId: input.telegramUserId,
        expiresAt: { $gt: new Date() },
      },
      [{
        $set: {
          results: {
            $setField: {
              field: input.emailAddress,
              input: '$results',
              value: { $literal: input.result },
            },
          },
        },
      }],
      { new: true }
    ).lean<any>()

    return doc ? mapSessionDoc(doc) : null
  }
}

export const updateSessionResults = new UpdateSessionResults()
