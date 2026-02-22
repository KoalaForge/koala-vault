import type { ImapErrorReason } from '../types'

interface EmailResultLogParams {
  categoryName: string
  emailAddress: string
  username: string | null
  userId: string
  status: 'found' | 'not_found' | 'error'
  emailSubject: string | null
  emailTime?: Date | null
  errorReason?: ImapErrorReason | null
}

class BuildEmailResultLog {
  execute(params: EmailResultLogParams): string {
    const { categoryName, emailAddress, username, userId, status, emailSubject, emailTime, errorReason } = params
    const displayName = username ? `@${username}` : `ID:${userId}`

    if (status === 'found') {
      const time = emailTime ? this.formatTime(emailTime) : '-'
      return (
        `🔄 <b>Log Email</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 ${displayName}\n` +
        `📧 <code>${emailAddress}</code>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Action: ${categoryName}\n` +
        `📋 ${emailSubject ?? '-'}\n` +
        `⏰ ${time}`
      )
    }

    if (status === 'not_found') {
      return (
        `🔍 <b>Log Email</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 ${displayName}\n` +
        `📧 <code>${emailAddress}</code>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Action: ${categoryName}\n` +
        `❌ <i>Tidak ditemukan</i>`
      )
    }

    const reason = errorReason === 'auth_failed' ? 'Auth Failed' : 'Connection Error'
    return (
      `⚠️ <b>Log Email</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 ${displayName}\n` +
      `📧 <code>${emailAddress}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Category: ${categoryName}\n` +
      `🔴 <i>${reason}</i>`
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
