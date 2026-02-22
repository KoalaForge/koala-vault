import RE2 from 're2'
import { logger } from '../logger'

interface ExtractResult {
  content: string | null
  emailDate: Date | null
}

interface EmailData {
  body: string
  html: string
  subject: string
  date: Date | null
}

class ExtractContentFromEmail {
  execute(emails: EmailData[], regexPatterns: string[]): ExtractResult {
    const sorted = [...emails].sort((a, b) =>
      (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)
    )

    for (const pattern of regexPatterns) {
      const regex = this.compileRegex(pattern)
      if (!regex) continue

      const result = sorted.reduce<ExtractResult | null>((found, email) => {
        if (found) return found
        return this.tryExtract(regex, email)
      }, null)

      if (result) return result
    }

    return { content: null, emailDate: null }
  }

  private compileRegex(pattern: string): RE2 | null {
    try {
      return new RE2(pattern, 'i')
    } catch (err) {
      logger.error({ err, pattern }, 'Invalid regex pattern')
      return null
    }
  }

  private tryExtract(regex: RE2, email: EmailData): ExtractResult | null {
    const bodyMatch = regex.exec(email.body)
    if (bodyMatch) {
      return { content: bodyMatch[1] ?? bodyMatch[0], emailDate: email.date }
    }

    const subjectMatch = regex.exec(email.subject)
    if (subjectMatch) {
      return { content: subjectMatch[1] ?? subjectMatch[0], emailDate: email.date }
    }

    const htmlMatch = regex.exec(email.html)
    if (htmlMatch) {
      return { content: htmlMatch[1] ?? htmlMatch[0], emailDate: email.date }
    }

    logger.info(
      { pattern: regex.toString(), subject: email.subject, bodySnippet: email.body.slice(0, 200) },
      'ExtractContent: pattern did not match text, subject, or html',
    )

    return null
  }
}

export const extractContentFromEmail = new ExtractContentFromEmail()
