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
    const key = `results.${input.emailAddress}`

    const doc = await SessionModel.findOneAndUpdate(
      {
        tenantId: input.tenantId,
        telegramUserId: input.telegramUserId,
        expiresAt: { $gt: new Date() },
      },
      { $set: { [key]: input.result } },
      { new: true }
    ).lean<any>()

    return doc ? mapSessionDoc(doc) : null
  }
}

export const updateSessionResults = new UpdateSessionResults()
