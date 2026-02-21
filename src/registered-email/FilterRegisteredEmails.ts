import { RegisteredEmailModel } from '../database/models/RegisteredEmailModel'
import { EmailAssignmentModel } from '../database/models/EmailAssignmentModel'
import type { SessionEmailEntry } from '../types'

interface FilterResult {
  allowed: SessionEmailEntry[]
  rejected: string[]
}

class FilterRegisteredEmails {
  async execute(tenantId: string, telegramUserId: string, emailAddresses: string[]): Promise<FilterResult> {
    const lowerAddresses = emailAddresses.map(e => e.toLowerCase())
    const now = new Date()

    // Check if user has active assignments
    const assignments = await EmailAssignmentModel.find({
      tenantId,
      telegramUserId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .select('emailAddress provider')
      .lean<any[]>()

    const sourceMap = assignments.length > 0
      ? new Map<string, string>(assignments.map((a: any) => [a.emailAddress as string, a.provider as string]))
      : await this.buildGlobalMap(tenantId, lowerAddresses)

    const allowed: SessionEmailEntry[] = lowerAddresses
      .filter(e => sourceMap.has(e))
      .map(e => ({ emailAddress: e, provider: sourceMap.get(e) ?? 'gmail' }))

    const rejected = emailAddresses.filter(e => !sourceMap.has(e.toLowerCase()))

    return { allowed, rejected }
  }

  private async buildGlobalMap(tenantId: string, lowerAddresses: string[]): Promise<Map<string, string>> {
    const docs = await RegisteredEmailModel.find({
      tenantId,
      emailAddress: { $in: lowerAddresses },
    })
      .select('emailAddress provider')
      .lean<any[]>()

    return new Map(docs.map((d: any) => [d.emailAddress as string, d.provider as string]))
  }
}

export const filterRegisteredEmails = new FilterRegisteredEmails()
