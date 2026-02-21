import { WhitelistModel } from '../database/models/WhitelistModel'
import type { WhitelistEntry, WhitelistStatus } from '../types'
import { mapWhitelistDoc } from './mappers'

interface UpsertWhitelistInput {
  tenantId: string
  telegramUserId: string
  telegramUsername: string | null
  status: WhitelistStatus
  approvedByTelegramId?: string
}

class UpsertWhitelistEntry {
  async execute(input: UpsertWhitelistInput): Promise<WhitelistEntry> {
    const update: Record<string, unknown> = {
      status: input.status,
      approvedByTelegramId: input.approvedByTelegramId ?? undefined,
    }

    if (input.telegramUsername) update.telegramUsername = input.telegramUsername
    if (input.status !== 'pending') update.resolvedAt = new Date()

    const doc = await WhitelistModel.findOneAndUpdate(
      { tenantId: input.tenantId, telegramUserId: input.telegramUserId },
      { $set: update },
      { upsert: true, new: true }
    ).lean<any>()

    return mapWhitelistDoc(doc)
  }
}

export const upsertWhitelistEntry = new UpsertWhitelistEntry()
