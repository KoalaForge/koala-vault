import { ImapProviderDefaultModel } from '../database/models/ImapProviderDefaultModel'
import type { ImapProvider, ImapProviderDefault } from '../types'
import { mapProviderDefaultDoc } from './mappers'

class FindProviderDefault {
  async execute(tenantId: string, provider: ImapProvider): Promise<ImapProviderDefault | null> {
    const doc = await ImapProviderDefaultModel.findOne({ tenantId, provider }).lean<any>()
    return doc ? mapProviderDefaultDoc(doc) : null
  }
}

export const findProviderDefault = new FindProviderDefault()
