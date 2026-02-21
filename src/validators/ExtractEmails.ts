import { validateEmail } from './ValidateEmail'

const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const MAX_EMAILS_PER_SESSION = 20

class ExtractEmails {
  execute(text: string): string[] {
    const matches = text.match(EMAIL_PATTERN) ?? []
    const validated = matches
      .map(email => validateEmail.execute(email))
      .filter((email): email is string => email !== null)

    const unique = [...new Set(validated)]
    return unique.slice(0, MAX_EMAILS_PER_SESSION)
  }
}

export const extractEmails = new ExtractEmails()
