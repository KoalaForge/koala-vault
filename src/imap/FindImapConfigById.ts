import { ImapConfigModel } from '../database/models/ImapConfigModel'
import type { NamedImapConfig } from '../types'
import { mapImapConfigDoc } from './mappers'

class FindImapConfigById {
  async execute(tenantId: string, id: string): Promise<NamedImapConfig | null> {
    const doc = await ImapConfigModel.findOne({ tenantId, _id: id }).lean<any>()
    return doc ? mapImapConfigDoc(doc) : null
  }
}

export const findImapConfigById = new FindImapConfigById()
