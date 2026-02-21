import type { IRegisteredEmail } from '../database/models/RegisteredEmailModel'
import type { RegisteredEmail } from '../types'

export function mapRegisteredEmailDoc(doc: IRegisteredEmail): RegisteredEmail {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    emailAddress: doc.emailAddress,
    provider: doc.provider ?? 'gmail',
    addedByTelegramId: doc.addedByTelegramId,
    createdAt: doc.createdAt,
  }
}
