import type { ImapErrorReason } from '../types'

interface EmailResultLogParams {
  categoryName: string
  emailAddress: string
  username: string | null
  userId: string
  status: 'found' | 'not_found' | 'error'
  extractedContent?: string | null
  emailTime?: Date | null
  errorReason?: ImapErrorReason | null
}

class BuildEmailResultLog {
  execute(params: EmailResultLogParams): string {
    const { categoryName, emailAddress, username, userId, status, extractedContent, emailTime, errorReason } = params
    const displayName = username ? `@${username}` : `ID:${userId}`

    if (status === 'found') {
      const time = emailTime
        ? this.formatTime(emailTime)
        : '-'
      return (
        `🔄 Log ${categoryName}\n\n` +
        `👤 Username: ${displayName}\n` +
        `📧 Email: ${emailAddress}\n` +
        `📋 Subject: ${extractedContent ?? '-'}\n` +
        `⏰ Received Time: ${time}`
      )
    }

    if (status === 'not_found') {
      return (
        `🔍 Log Not Found - ${categoryName}\n\n` +
        `👤 Username: ${displayName}\n` +
        `📧 Email: ${emailAddress}`
      )
    }

    const reason = errorReason === 'auth_failed' ? 'Auth Failed' : 'Connection Error'
    return (
      `❌ Log Error - ${categoryName}\n\n` +
      `👤 Username: ${displayName}\n` +
      `📧 Email: ${emailAddress}\n` +
      `⚠️ Error: ${reason}`
    )
  }

  private formatTime(date: Date): string {
    const pad = (n: number): string => String(n).padStart(2, '0')
    const d = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    )
  }
}

export const buildEmailResultLog = new BuildEmailResultLog()
