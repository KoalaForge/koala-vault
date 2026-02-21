import { z } from 'zod'

const emailSchema = z.string().email().max(254).toLowerCase().trim()

class ValidateEmail {
  execute(input: string): string | null {
    const result = emailSchema.safeParse(input)
    return result.success ? result.data : null
  }
}

export const validateEmail = new ValidateEmail()
