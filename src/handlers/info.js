import { InlineKeyboard } from 'grammy'
import { AUTOSERVICE } from '../config.js'
import { t, getLang } from '../i18n/index.js'

export default (bot) => {
  const showAddress = async (ctx) => {
    const lang = await getLang(ctx.from?.id || ctx.chat?.id)
    const text = t(lang, 'address', AUTOSERVICE.address, AUTOSERVICE.mapLink)
    const back = new InlineKeyboard().text(t(lang, 'btnMainMenu'), 'menu_main')
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: back })
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: back })
    }
  }

  const showHours = async (ctx) => {
    const lang = await getLang(ctx.from?.id || ctx.chat?.id)
    const text = t(lang, 'hours', AUTOSERVICE.hours)
    const back = new InlineKeyboard().text(t(lang, 'btnMainMenu'), 'menu_main')
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: back })
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: back })
    }
  }

  const showContact = async (ctx) => {
    const lang = await getLang(ctx.from?.id || ctx.chat?.id)
    const text = t(lang, 'contact', AUTOSERVICE.phone, AUTOSERVICE.address)
    const back = new InlineKeyboard().text(t(lang, 'btnMainMenu'), 'menu_main')
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: back })
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: back })
    }
  }

  bot.callbackQuery('menu_address', showAddress)
  bot.hears(['📍 Адреса', '📍 Адрес'], showAddress)

  bot.callbackQuery('menu_hours', showHours)
  bot.hears(['🕐 Години роботи', '🕐 Часы работы'], showHours)

  bot.callbackQuery('menu_contact', showContact)
  bot.hears('📞 Контакт', showContact)
}
