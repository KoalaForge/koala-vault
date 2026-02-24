import { ImapConfigModel } from '../database/models/ImapConfigModel'
import type { NamedImapConfig } from '../types'
import { mapImapConfigDoc } from './mappers'

class FindDefaultImapConfig {
  async execute(tenantId: string): Promise<NamedImapConfig | null> {
    const doc = await ImapConfigModel.findOne({ tenantId, isDefault: true }).lean<any>()
    return doc ? mapImapConfigDoc(doc) : null
  }
}

export const findDefaultImapConfig = new FindDefaultImapConfig()
