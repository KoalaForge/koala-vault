import { ImapFlow } from 'imapflow'
import type { ImapConfig } from '../types'

export interface ImapTestResult {
  ok: boolean
  error?: string
}

class TestImapConnection {
  async execute(config: ImapConfig): Promise<ImapTestResult> {
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      logger: false,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    })

    try {
      await client.connect()
      await client.logout()
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false, error: message }
    }
  }
}

export const testImapConnection = new TestImapConnection()
