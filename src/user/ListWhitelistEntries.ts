import { WhitelistModel } from '../database/models/WhitelistModel'
import type { WhitelistEntry } from '../types'
import { mapWhitelistDoc } from './mappers'

class ListWhitelistEntries {
  async execute(tenantId: string): Promise<WhitelistEntry[]> {
    const docs = await WhitelistModel.find({ tenantId }).sort({ createdAt: -1 }).lean<any[]>()
    return docs.map(mapWhitelistDoc)
  }
}

export const listWhitelistEntries = new ListWhitelistEntries()
