import { AccessRequestModel } from '../database/models/AccessRequestModel'
import type { AccessRequest } from '../types'
import { mapAccessRequestDoc } from './mappers'

interface ResolveInput {
  tenantId: string
  telegramUserId: string
  status: 'approved' | 'denied'
  resolvedByTelegramId: string
}

class ResolveAccessRequest {
  async execute(input: ResolveInput): Promise<AccessRequest | null> {
    const doc = await AccessRequestModel.findOneAndUpdate(
      { tenantId: input.tenantId, telegramUserId: input.telegramUserId, status: 'pending' },
      {
        $set: {
          status: input.status,
          resolvedAt: new Date(),
          resolvedByTelegramId: input.resolvedByTelegramId,
        },
      },
      { new: true }
    ).lean<any>()

    return doc ? mapAccessRequestDoc(doc) : null
  }
}

export const resolveAccessRequest = new ResolveAccessRequest()
