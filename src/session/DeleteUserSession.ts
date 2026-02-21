import { SessionModel } from '../database/models/SessionModel'

class DeleteUserSession {
  async execute(tenantId: string, telegramUserId: string): Promise<void> {
    await SessionModel.deleteOne({ tenantId, telegramUserId })
  }
}

export const deleteUserSession = new DeleteUserSession()
