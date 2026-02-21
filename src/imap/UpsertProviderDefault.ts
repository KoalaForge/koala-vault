import { ImapProviderDefaultModel } from '../database/models/ImapProviderDefaultModel'
import type { ImapProvider, ImapProviderDefault } from '../types'
import { mapProviderDefaultDoc } from './mappers'
import { encrypt } from '../encryption/Encrypt'

interface UpsertProviderDefaultInput {
  tenantId: string
  provider: ImapProvider
  imapHost: string
  imapPort: number
  useSsl: boolean
  username: string
  password: string
}

class UpsertProviderDefault {
  async execute(input: UpsertProviderDefaultInput): Promise<ImapProviderDefault> {
    const passwordEncrypted = encrypt.execute(input.password)

    const doc = await ImapProviderDefaultModel.findOneAndUpdate(
      { tenantId: input.tenantId, provider: input.provider },
      {
        $set: {
          imapHost: input.imapHost,
          imapPort: input.imapPort,
          useSsl: input.useSsl,
          username: input.username,
          passwordEncrypted,
        },
      },
      { upsert: true, new: true }
    ).lean<any>()

    return mapProviderDefaultDoc(doc)
  }
}

export const upsertProviderDefault = new UpsertProviderDefault()
