import { RegisteredEmailModel } from '../database/models/RegisteredEmailModel'

interface RemoveRegisteredEmailInput {
  tenantId: string
  emailAddress: string
}

class RemoveRegisteredEmail {
  async execute(input: RemoveRegisteredEmailInput): Promise<boolean> {
    const result = await RegisteredEmailModel.findOneAndDelete({
      tenantId: input.tenantId,
      emailAddress: input.emailAddress.toLowerCase(),
    })

    return result !== null
  }
}

export const removeRegisteredEmail = new RemoveRegisteredEmail()
