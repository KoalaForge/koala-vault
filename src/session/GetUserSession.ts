import { SessionModel } from '../database/models/SessionModel'
import type { UserSession } from '../types'
import { mapSessionDoc } from './mappers'

class GetUserSession {
  async execute(tenantId: string, telegramUserId: string): Promise<UserSession | null> {
    const doc = await SessionModel.findOne({
      tenantId,
      telegramUserId,
      expiresAt: { $gt: new Date() },
    }).lean<any>()
    return doc ? mapSessionDoc(doc) : null
  }
}

export const getSessionByUser = new GetUserSession()
