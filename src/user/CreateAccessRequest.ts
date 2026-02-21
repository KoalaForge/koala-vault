import { AccessRequestModel } from '../database/models/AccessRequestModel'
import type { AccessRequest } from '../types'
import { mapAccessRequestDoc } from './mappers'

interface CreateAccessRequestInput {
  tenantId: string
  telegramUserId: string
  telegramUsername: string | null
  telegramFirstName: string | null
}

class CreateAccessRequest {
  async execute(input: CreateAccessRequestInput): Promise<AccessRequest | null> {
    const existing = await AccessRequestModel.findOne({
      tenantId: input.tenantId,
      telegramUserId: input.telegramUserId,
      status: 'pending',
    })

    if (existing) return null

    const doc = await AccessRequestModel.create({
      tenantId: input.tenantId,
      telegramUserId: input.telegramUserId,
      telegramUsername: input.telegramUsername ?? undefined,
      telegramFirstName: input.telegramFirstName ?? undefined,
    })

    return mapAccessRequestDoc(doc as any)
  }
}

export const createAccessRequest = new CreateAccessRequest()
