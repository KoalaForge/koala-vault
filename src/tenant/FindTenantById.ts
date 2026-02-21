import { TenantModel } from '../database/models/TenantModel'
import type { Tenant } from '../types'
import { mapTenantDoc } from './mappers'

class FindTenantById {
  async execute(id: string): Promise<Tenant | null> {
    const doc = await TenantModel.findById(id).lean<any>()
    return doc ? mapTenantDoc(doc) : null
  }
}

export const findTenantById = new FindTenantById()
