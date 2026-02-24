import { ImapConfigModel } from '../database/models/ImapConfigModel'
import type { NamedImapConfig } from '../types'
import { mapImapConfigDoc } from './mappers'

class FindImapConfigByName {
  async execute(tenantId: string, name: string): Promise<NamedImapConfig | null> {
    const doc = await ImapConfigModel.findOne({ tenantId, name }).lean<any>()
    return doc ? mapImapConfigDoc(doc) : null
  }
}

export const findImapConfigByName = new FindImapConfigByName()
