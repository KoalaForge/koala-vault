import { RegisteredEmailModel } from '../database/models/RegisteredEmailModel'
import type { RegisteredEmail } from '../types'
import { mapRegisteredEmailDoc } from './mappers'

class ListRegisteredEmails {
  async execute(tenantId: string): Promise<RegisteredEmail[]> {
    const docs = await RegisteredEmailModel.find({ tenantId })
      .sort({ emailAddress: 1 })
      .lean<any[]>()

    return docs.map(mapRegisteredEmailDoc)
  }
}

export const listRegisteredEmails = new ListRegisteredEmails()
