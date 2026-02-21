import type { Telegraf } from 'telegraf'
import type { BotContext, Tenant } from '../types'
import { injectTenantContext } from './middleware/InjectTenantContext'
import { checkTenantExpiry } from './middleware/CheckTenantExpiry'
import { checkWhitelistAccess } from './middleware/CheckWhitelistAccess'
import { startCommand } from '../handlers/StartCommand'
import { handleEmailInput } from '../handlers/HandleEmailInput'
import { handleCategorySelection } from '../handlers/HandleCategorySelection'
import { handleRetrySearch } from '../handlers/HandleRetrySearch'
import { handleMyEmails } from '../handlers/HandleMyEmails'

class RegisterUserHandlers {
  execute(bot: Telegraf<BotContext>, tenant: Tenant): void {
    bot.use(injectTenantContext.execute(tenant))
    bot.use(checkTenantExpiry.execute())
    bot.use(checkWhitelistAccess.execute())

    bot.command('start', (ctx) => startCommand.execute(ctx))
    bot.command('myemails', (ctx) => handleMyEmails.execute(ctx))
    bot.on('text', async (ctx, next) => {
      const text: string = String((ctx.message as any)?.text ?? '')
      if (text.startsWith('/')) return next()
      return handleEmailInput.execute(ctx)
    })
    bot.action(/^category:(.+)$/, (ctx) => handleCategorySelection.execute(ctx))
    bot.action(/^retry:(.+):(.+)$/, (ctx) => handleRetrySearch.execute(ctx))
  }
}

export const registerUserHandlers = new RegisterUserHandlers()
