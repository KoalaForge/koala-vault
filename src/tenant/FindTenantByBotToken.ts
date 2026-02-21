import { TenantModel } from '../database/models/TenantModel'
import type { Tenant } from '../types'
import { mapTenantDoc } from './mappers'

class FindTenantByBotToken {
  async execute(botToken: string): Promise<Tenant | null> {
    const doc = await TenantModel.findOne({ botToken, isActive: true }).lean<any>()
    return doc ? mapTenantDoc(doc) : null
  }
}

export const findTenantByBotToken = new FindTenantByBotToken()
