import RE2 from 're2'
import { logger } from '../logger'

interface ExtractResult {
  content: string | null
  emailDate: Date | null
}

interface EmailData {
  body: string
  subject: string
  date: Date | null
}

class ExtractContentFromEmail {
  execute(emails: EmailData[], regexPattern: string): ExtractResult {
    const regex = this.compileRegex(regexPattern)
    if (!regex) return { content: null, emailDate: null }

    const sorted = [...emails].sort((a, b) =>
      (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)
    )

    const result = sorted.reduce<ExtractResult | null>((found, email) => {
      if (found) return found
      return this.tryExtract(regex, email)
    }, null)

    return result ?? { content: null, emailDate: null }
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

    return null
  }
}

export const extractContentFromEmail = new ExtractContentFromEmail()
