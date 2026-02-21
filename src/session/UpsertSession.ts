import { SessionModel } from '../database/models/SessionModel'
import type { UserSession } from '../types'
import { mapSessionDoc } from './mappers'

class UpsertSession {
  async execute(tenantId: string, telegramUserId: string): Promise<UserSession> {
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

    const doc = await SessionModel.findOneAndUpdate(
      { tenantId, telegramUserId },
      {
        $set: {
          state: 'AWAITING_EMAILS',
          emailAddresses: [],
          selectedCategoryId: undefined,
          results: {},
          expiresAt,
        },
      },
      { upsert: true, new: true }
    ).lean<any>()

    return mapSessionDoc(doc)
  }
}

export const upsertSession = new UpsertSession()
