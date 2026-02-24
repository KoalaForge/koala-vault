import { ImapConfigModel } from '../database/models/ImapConfigModel'
import type { NamedImapConfig } from '../types'
import { mapImapConfigDoc } from './mappers'

class ListNamedImapConfigs {
  async execute(tenantId: string): Promise<NamedImapConfig[]> {
    const docs = await ImapConfigModel.find({ tenantId }).sort({ name: 1 }).lean<any[]>()
    return docs.map(mapImapConfigDoc)
  }
}

export const listNamedImapConfigs = new ListNamedImapConfigs()
