import { ImapConfigModel } from '../database/models/ImapConfigModel'

class DeleteImapConfig {
  async execute(tenantId: string, name: string): Promise<boolean> {
    const result = await ImapConfigModel.deleteOne({ tenantId, name })
    return result.deletedCount > 0
  }
}

export const deleteImapConfig = new DeleteImapConfig()
