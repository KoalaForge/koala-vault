import { AccessRequestModel } from '../database/models/AccessRequestModel'
import type { AccessRequest } from '../types'
import { mapAccessRequestDoc } from './mappers'

class GetPendingRequests {
  async execute(tenantId: string): Promise<AccessRequest[]> {
    const docs = await AccessRequestModel.find({ tenantId, status: 'pending' })
      .sort({ createdAt: 1 })
      .lean<any[]>()
    return docs.map(mapAccessRequestDoc)
  }
}

export const getPendingRequests = new GetPendingRequests()
