import RE2 from 're2'

class ValidateRegexPattern {
  execute(pattern: string): boolean {
    try {
      new RE2(pattern)
      return true
    } catch {
      return false
    }
  }
}

export const validateRegexPattern = new ValidateRegexPattern()
