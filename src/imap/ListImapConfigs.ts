import { ImapProviderDefaultModel } from '../database/models/ImapProviderDefaultModel'
import { ImapAddressOverrideModel } from '../database/models/ImapAddressOverrideModel'
import { ImapConfigModel } from '../database/models/ImapConfigModel'
import type { ImapProviderDefault, ImapAddressOverride, NamedImapConfig } from '../types'
import { mapProviderDefaultDoc, mapAddressOverrideDoc, mapImapConfigDoc } from './mappers'

interface ImapConfigsList {
  namedConfigs: NamedImapConfig[]
  providerDefaults: ImapProviderDefault[]
  addressOverrides: ImapAddressOverride[]
}

class ListImapConfigs {
  async execute(tenantId: string): Promise<ImapConfigsList> {
    const [named, defaults, overrides] = await Promise.all([
      ImapConfigModel.find({ tenantId }).sort({ name: 1 }).lean<any[]>(),
      ImapProviderDefaultModel.find({ tenantId }).sort({ provider: 1 }).lean<any[]>(),
      ImapAddressOverrideModel.find({ tenantId }).sort({ emailAddress: 1 }).lean<any[]>(),
    ])

    return {
      namedConfigs: named.map(mapImapConfigDoc),
      providerDefaults: defaults.map(mapProviderDefaultDoc),
      addressOverrides: overrides.map(mapAddressOverrideDoc),
    }
  }
}

export const listImapConfigs = new ListImapConfigs()
