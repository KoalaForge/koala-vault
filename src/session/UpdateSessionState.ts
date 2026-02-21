import { SessionModel } from '../database/models/SessionModel'
import type { UserSession, SessionState, SessionEmailEntry } from '../types'
import { mapSessionDoc } from './mappers'

interface UpdateStateInput {
  tenantId: string
  telegramUserId: string
  state: SessionState
  emailAddresses?: SessionEmailEntry[]
  selectedCategoryId?: string
}

class UpdateSessionState {
  async execute(input: UpdateStateInput): Promise<UserSession | null> {
    const update: Record<string, unknown> = { state: input.state }

    if (input.emailAddresses !== undefined) update.emailAddresses = input.emailAddresses
    if (input.selectedCategoryId !== undefined) update.selectedCategoryId = input.selectedCategoryId

    const doc = await SessionModel.findOneAndUpdate(
      {
        tenantId: input.tenantId,
        telegramUserId: input.telegramUserId,
        expiresAt: { $gt: new Date() },
      },
      { $set: update },
      { new: true }
    ).lean<any>()

    return doc ? mapSessionDoc(doc) : null
  }
}

export const updateSessionState = new UpdateSessionState()
