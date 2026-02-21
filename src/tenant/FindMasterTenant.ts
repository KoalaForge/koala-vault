import { TenantModel } from '../database/models/TenantModel'
import type { Tenant } from '../types'
import { mapTenantDoc } from './mappers'

class FindMasterTenant {
  async execute(): Promise<Tenant | null> {
    const doc = await TenantModel.findOne({ isMaster: true, isActive: true }).lean<any>()
    return doc ? mapTenantDoc(doc) : null
  }
}

export const findMasterTenant = new FindMasterTenant()
