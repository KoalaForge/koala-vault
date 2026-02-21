class ValidateImapHost {
  private readonly PRIVATE_RANGES = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
    /^localhost$/i,
    /^0\.0\.0\.0$/,
  ]

  execute(host: string): boolean {
    const trimmed = host.trim().toLowerCase()
    return !this.PRIVATE_RANGES.some(pattern => pattern.test(trimmed))
  }
}

export const validateImapHost = new ValidateImapHost()
