import { ImapConfigModel } from '../database/models/ImapConfigModel'
import type { NamedImapConfig } from '../types'
import { mapImapConfigDoc } from './mappers'

class SetDefaultImapConfig {
  async execute(tenantId: string, name: string): Promise<NamedImapConfig> {
    await ImapConfigModel.updateMany({ tenantId }, { $set: { isDefault: false } })

    const doc = await ImapConfigModel.findOneAndUpdate(
      { tenantId, name },
      { $set: { isDefault: true } },
      { new: true }
    ).lean<any>()

    if (!doc) throw new Error(`ImapConfig "${name}" not found`)

    return mapImapConfigDoc(doc)
  }
}

export const setDefaultImapConfig = new SetDefaultImapConfig()
