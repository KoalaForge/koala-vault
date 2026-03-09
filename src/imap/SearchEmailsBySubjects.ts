import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import type { ImapConfig } from '../types'
import { logger } from '../logger'
import { withImapRetry } from './withImapRetry'

interface FoundEmail {
  body: string
  html: string
  subject: string
  date: Date | null
}

class SearchEmailsBySubjects {
  async execute(
    imapConfig: ImapConfig,
    subjectKeywords: string[],
    toAddress: string,
  ): Promise<FoundEmail[]> {
    const label = `single:${imapConfig.host}:${toAddress}`
    return withImapRetry(label, () => this.connectAndSearch(imapConfig, subjectKeywords, toAddress))
  }

  private async connectAndSearch(
    imapConfig: ImapConfig,
    subjectKeywords: string[],
    toAddress: string,
  ): Promise<FoundEmail[]> {
    const client = new ImapFlow({
      host: imapConfig.host,
      port: imapConfig.port,
      secure: imapConfig.secure,
      auth: imapConfig.auth,
      logger: false,
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    })

    await client.connect()

    const lock = await client.getMailboxLock('INBOX')

    try {
      const messages = await this.searchAllSubjects(client, subjectKeywords, toAddress)
      const parsed = await Promise.all(messages.map(msg => this.parseMessage(msg)))
      return parsed.filter((m): m is FoundEmail => m !== null)
    } finally {
      lock.release()
      await client.logout()
    }
  }

  private async searchAllSubjects(
    client: ImapFlow,
    subjects: string[],
    toAddress: string,
  ): Promise<Buffer[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    logger.info({ subjects, toAddress, since }, 'IMAP: searching with criteria')

    const toUidSets: number[][] = []
    const fromUidSets: number[][] = []

    for (const subject of subjects) {
      const toUids = await client.search({ subject, since, to: toAddress })
        .then(r => r || [])
        .catch((err) => {
          logger.warn({ err, subject, toAddress }, 'IMAP: subject search (to) failed, skipping')
          return [] as number[]
        })
      const fromUids = await client.search({ subject, since, from: toAddress })
        .then(r => r || [])
        .catch((err) => {
          logger.warn({ err, subject, toAddress }, 'IMAP: subject search (from) failed, skipping')
          return [] as number[]
        })

      logger.info({ subject, toAddress, toUids, fromUids }, 'IMAP: search results by field')

      toUidSets.push(toUids)
      fromUidSets.push(fromUids)
    }

    const allToUids = toUidSets.flat()
    const allFromUids = fromUidSets.flat()
    const onlyFrom = allFromUids.filter(uid => !allToUids.includes(uid))
    const onlyTo = allToUids.filter(uid => !allFromUids.includes(uid))
    const both = allToUids.filter(uid => allFromUids.includes(uid))

    logger.info({ toAddress, onlyTo, onlyFrom, both }, 'IMAP: UID source breakdown')

    const allUids = [...new Set([...allToUids, ...allFromUids])]
    const recentUids = allUids.slice(-5)

    logger.info({ toAddress, totalUids: allUids.length, fetching: recentUids.length }, 'IMAP: UIDs found')

    if (recentUids.length === 0) return []

    const buffers: Buffer[] = []
    for await (const msg of client.fetch(recentUids, { source: true })) {
      if (msg.source) buffers.push(msg.source)
    }

    logger.info({ toAddress, messagesFetched: buffers.length }, 'IMAP: messages fetched')

    return buffers
  }

  private async parseMessage(source: Buffer): Promise<FoundEmail | null> {
    try {
      const parsed = await simpleParser(source)
      return {
        body: String(parsed.text || ''),
        html: String(parsed.html || ''),
        subject: String(parsed.subject || ''),
        date: parsed.date ?? null,
      }
    } catch {
      return null
    }
  }
}

export const searchEmailsBySubjects = new SearchEmailsBySubjects()
