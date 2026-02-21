import { EmailAssignmentModel } from '../database/models/EmailAssignmentModel'

interface DeassignEmailInput {
  tenantId: string
  telegramUserId: string
  emailAddresses: string[]
}

interface DeassignResult {
  removed: string[]
  notFound: string[]
}

class DeassignEmail {
  async execute(input: DeassignEmailInput): Promise<DeassignResult> {
    const removed: string[] = []
    const notFound: string[] = []

    for (const rawEmail of input.emailAddresses) {
      const emailAddress = rawEmail.toLowerCase()
      const result = await EmailAssignmentModel.findOneAndDelete({
        tenantId: input.tenantId,
        telegramUserId: input.telegramUserId,
        emailAddress,
      })

      if (result) {
        removed.push(emailAddress)
      } else {
        notFound.push(emailAddress)
      }
    }

    return { removed, notFound }
  }
}

export const deassignEmail = new DeassignEmail()
