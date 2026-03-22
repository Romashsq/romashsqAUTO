import { InlineKeyboard } from 'grammy'
import { AUTOSERVICE } from '../config.js'

const BACK = new InlineKeyboard().text('🏠 Головне меню', 'menu_main')

export default (bot) => {
  const showAddress = async (ctx) => {
    const text = `📍 *Наша адреса:*\n\n${AUTOSERVICE.address}\n\n[Відкрити на Google Maps](${AUTOSERVICE.mapLink})`
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: BACK })
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: BACK })
    }
  }

  const showHours = async (ctx) => {
    const text = `🕐 *Години роботи:*\n\n${AUTOSERVICE.hours}\n\nСубота та неділя — вихідний`
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: BACK })
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: BACK })
    }
  }

  const showContact = async (ctx) => {
    const text = `📞 *Контакти:*\n\nТелефон: ${AUTOSERVICE.phone}\nАдреса: ${AUTOSERVICE.address}\n\nПишіть нам прямо тут — ми відповімо! 💬`
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: BACK })
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: BACK })
    }
  }

  bot.callbackQuery('menu_address', showAddress)
  bot.hears('📍 Адреса', showAddress)

  bot.callbackQuery('menu_hours', showHours)
  bot.hears('🕐 Години роботи', showHours)

  bot.callbackQuery('menu_contact', showContact)
  bot.hears('📞 Контакт', showContact)
}
