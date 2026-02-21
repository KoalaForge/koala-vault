import { WhitelistModel } from '../database/models/WhitelistModel'
import type { WhitelistEntry } from '../types'
import { mapWhitelistDoc } from './mappers'

class FindWhitelistEntry {
  async execute(tenantId: string, telegramUserId: string): Promise<WhitelistEntry | null> {
    const doc = await WhitelistModel.findOne({ tenantId, telegramUserId }).lean<any>()
    return doc ? mapWhitelistDoc(doc) : null
  }
}

export const findWhitelistEntry = new FindWhitelistEntry()
