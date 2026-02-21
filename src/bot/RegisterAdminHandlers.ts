import type { Telegraf } from 'telegraf'
import type { BotContext, Tenant } from '../types'
import { checkAdminPermission } from './middleware/CheckAdminPermission'
import { handleSetAddressImap } from '../handlers/admin/HandleSetAddressImap'
import { handleSetProviderImap } from '../handlers/admin/HandleSetProviderImap'
import { handleListImapConfigs } from '../handlers/admin/HandleListImapConfigs'
import { handleListUsers } from '../handlers/admin/HandleListUsers'
import { handleApproveUser } from '../handlers/admin/HandleApproveUser'
import { handleDenyUser } from '../handlers/admin/HandleDenyUser'
import { handleToggleWhitelist } from '../handlers/admin/HandleToggleWhitelist'
import { handleAddToWhitelist } from '../handlers/admin/HandleAddToWhitelist'
import { handleRemoveFromWhitelist } from '../handlers/admin/HandleRemoveFromWhitelist'
import { handleAddEmail } from '../handlers/admin/HandleAddEmail'
import { handleRemoveEmail } from '../handlers/admin/HandleRemoveEmail'
import { handleListEmails } from '../handlers/admin/HandleListEmails'
import { handleAssignEmail } from '../handlers/admin/HandleAssignEmail'
import { handleDeassignEmail } from '../handlers/admin/HandleDeassignEmail'
import { handleListAssigned } from '../handlers/admin/HandleListAssigned'
import { handleListCategories } from '../handlers/admin/HandleListCategories'
import { handleSetDefaultCategory } from '../handlers/admin/HandleSetDefaultCategory'
import { handleAssignCategory } from '../handlers/admin/HandleAssignCategory'
import { handleDeassignCategory } from '../handlers/admin/HandleDeassignCategory'
import { handleListCategoryAssign } from '../handlers/admin/HandleListCategoryAssign'
import { handleHelp } from '../handlers/admin/HandleHelp'
import { handlePanel } from '../handlers/panel/HandlePanel'
import { handlePanelHome } from '../handlers/panel/HandlePanelHome'
import { handlePanelSection } from '../handlers/panel/HandlePanelSection'

class RegisterAdminHandlers {
  execute(bot: Telegraf<BotContext>, _tenant: Tenant): void {
    const adminOnly = checkAdminPermission.execute()

    bot.command('help', adminOnly, (ctx) => handleHelp.execute(ctx))
    bot.command('panel', adminOnly, (ctx) => handlePanel.execute(ctx))
    bot.command('setimap', adminOnly, (ctx) => handleSetAddressImap.execute(ctx))
    bot.command('setprovider', adminOnly, (ctx) => handleSetProviderImap.execute(ctx))
    bot.command('listimap', adminOnly, (ctx) => handleListImapConfigs.execute(ctx))
    bot.command('users', adminOnly, (ctx) => handleListUsers.execute(ctx))
    bot.command('whitelist', adminOnly, (ctx) => handleAddToWhitelist.execute(ctx))
    bot.command('unwhitelist', adminOnly, (ctx) => handleRemoveFromWhitelist.execute(ctx))
    bot.command('togglewhitelist', adminOnly, (ctx) => handleToggleWhitelist.execute(ctx))
    bot.command('addemail', adminOnly, (ctx) => handleAddEmail.execute(ctx))
    bot.command('removemail', adminOnly, (ctx) => handleRemoveEmail.execute(ctx))
    bot.command('listemails', adminOnly, (ctx) => handleListEmails.execute(ctx))
    bot.command('assignemail', adminOnly, (ctx) => handleAssignEmail.execute(ctx))
    bot.command('deassignmail', adminOnly, (ctx) => handleDeassignEmail.execute(ctx))
    bot.command('listassigned', adminOnly, (ctx) => handleListAssigned.execute(ctx))
    bot.command('listcategories', adminOnly, (ctx) => handleListCategories.execute(ctx))
    bot.command('setdefaultcategory', adminOnly, (ctx) => handleSetDefaultCategory.execute(ctx))
    bot.command('assigncategory', adminOnly, (ctx) => handleAssignCategory.execute(ctx))
    bot.command('deassigncategory', adminOnly, (ctx) => handleDeassignCategory.execute(ctx))
    bot.command('listcategoryassign', adminOnly, (ctx) => handleListCategoryAssign.execute(ctx))
    bot.action('pn:home', adminOnly, (ctx) => handlePanelHome.execute(ctx))
    bot.action(/^pn:s:(.+)$/, adminOnly, (ctx) => handlePanelSection.execute(ctx))
    bot.action(/^approve:(.+)$/, adminOnly, (ctx) => handleApproveUser.execute(ctx))
    bot.action(/^deny:(.+)$/, adminOnly, (ctx) => handleDenyUser.execute(ctx))
  }
}

export const registerAdminHandlers = new RegisterAdminHandlers()
