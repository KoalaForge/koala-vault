import { RegisteredEmailModel } from '../database/models/RegisteredEmailModel'
import type { RegisteredEmail } from '../types'
import { mapRegisteredEmailDoc } from './mappers'

interface AddRegisteredEmailInput {
  tenantId: string
  emailAddress: string
  provider: string
  addedByTelegramId: string
}

class AddRegisteredEmail {
  async execute(input: AddRegisteredEmailInput): Promise<RegisteredEmail> {
    const doc = await RegisteredEmailModel.findOneAndUpdate(
      {
        tenantId: input.tenantId,
        emailAddress: input.emailAddress.toLowerCase(),
      },
      {
        $set: { provider: input.provider },
        $setOnInsert: {
          tenantId: input.tenantId,
          emailAddress: input.emailAddress.toLowerCase(),
          addedByTelegramId: input.addedByTelegramId,
        },
      },
      { upsert: true, new: true },
    ).lean<any>()

    return mapRegisteredEmailDoc(doc)
  }
}

export const addRegisteredEmail = new AddRegisteredEmail()
