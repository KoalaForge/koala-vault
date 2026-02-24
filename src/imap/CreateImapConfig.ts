import { ImapConfigModel } from '../database/models/ImapConfigModel'
import type { NamedImapConfig } from '../types'
import { mapImapConfigDoc } from './mappers'
import { encrypt } from '../encryption/Encrypt'

interface CreateImapConfigInput {
  tenantId: string
  name: string
  imapHost: string
  imapPort: number
  useSsl: boolean
  username: string
  password: string
}

class CreateImapConfig {
  async execute(input: CreateImapConfigInput): Promise<NamedImapConfig> {
    const passwordEncrypted = encrypt.execute(input.password)

    const doc = await ImapConfigModel.findOneAndUpdate(
      { tenantId: input.tenantId, name: input.name },
      {
        $set: {
          imapHost: input.imapHost,
          imapPort: input.imapPort,
          useSsl: input.useSsl,
          username: input.username,
          passwordEncrypted,
        },
        $setOnInsert: { isDefault: false },
      },
      { upsert: true, new: true }
    ).lean<any>()

    return mapImapConfigDoc(doc)
  }
}

export const createImapConfig = new CreateImapConfig()
