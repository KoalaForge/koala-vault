import { ImapProviderDefaultModel } from '../database/models/ImapProviderDefaultModel'
import { ImapAddressOverrideModel } from '../database/models/ImapAddressOverrideModel'
import type { ImapProviderDefault, ImapAddressOverride } from '../types'
import { mapProviderDefaultDoc, mapAddressOverrideDoc } from './mappers'

interface ImapConfigsList {
  providerDefaults: ImapProviderDefault[]
  addressOverrides: ImapAddressOverride[]
}

class ListImapConfigs {
  async execute(tenantId: string): Promise<ImapConfigsList> {
    const [defaults, overrides] = await Promise.all([
      ImapProviderDefaultModel.find({ tenantId }).sort({ provider: 1 }).lean<any[]>(),
      ImapAddressOverrideModel.find({ tenantId }).sort({ emailAddress: 1 }).lean<any[]>(),
    ])

    return {
      providerDefaults: defaults.map(mapProviderDefaultDoc),
      addressOverrides: overrides.map(mapAddressOverrideDoc),
    }
  }
}

export const listImapConfigs = new ListImapConfigs()
