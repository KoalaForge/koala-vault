import type { Telegraf } from 'telegraf'
import type { BotContext } from '../types'
import { checkMasterPermission } from './middleware/CheckMasterPermission'
import { handleAddTenant } from '../handlers/master/HandleAddTenant'
import { handleListTenants } from '../handlers/master/HandleListTenants'
import { handleDeactivateTenant } from '../handlers/master/HandleDeactivateTenant'
import { handleAddCategory } from '../handlers/admin/HandleAddCategory'
import { handleListCategories } from '../handlers/admin/HandleListCategories'
import { handleDeleteCategory } from '../handlers/admin/HandleDeleteCategory'
import { handleAddSubject } from '../handlers/master/HandleAddSubject'
import { handleExtendTenant } from '../handlers/master/HandleExtendTenant'
import { handleEditCategory } from '../handlers/master/HandleEditCategory'

class RegisterMasterHandlers {
  execute(bot: Telegraf<BotContext>): void {
    const masterOnly = checkMasterPermission.execute()

    bot.command('addtenant', masterOnly, (ctx) => handleAddTenant.execute(ctx))
    bot.command('listtenant', masterOnly, (ctx) => handleListTenants.execute(ctx))
    bot.command('deactivatetenant', masterOnly, (ctx) => handleDeactivateTenant.execute(ctx))
    bot.command('addcategory', masterOnly, (ctx) => handleAddCategory.execute(ctx))
    bot.command('listcategories', masterOnly, (ctx) => handleListCategories.execute(ctx))
    bot.command('deletecategory', masterOnly, (ctx) => handleDeleteCategory.execute(ctx))
    bot.command('addsubject', masterOnly, (ctx) => handleAddSubject.execute(ctx))
    bot.command('extenttenant', masterOnly, (ctx) => handleExtendTenant.execute(ctx))
    bot.command('editcategory', masterOnly, (ctx) => handleEditCategory.execute(ctx))
  }
}

export const registerMasterHandlers = new RegisterMasterHandlers()
