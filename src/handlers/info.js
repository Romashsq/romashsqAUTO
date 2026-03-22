import { InlineKeyboard } from 'grammy'
import { AUTOSERVICE } from '../config.js'

const BACK = new InlineKeyboard().text('🏠 Головне меню', 'menu_main')

export default (bot) => {
  bot.callbackQuery('menu_address', async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      `📍 *Наша адреса:*\n\n${AUTOSERVICE.address}\n\n[Відкрити на Google Maps](${AUTOSERVICE.mapLink})`,
      { parse_mode: 'Markdown', reply_markup: BACK }
    )
  })

  bot.callbackQuery('menu_hours', async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      `🕐 *Години роботи:*\n\n${AUTOSERVICE.hours}\n\nСубота та неділя — вихідний`,
      { parse_mode: 'Markdown', reply_markup: BACK }
    )
  })

  bot.callbackQuery('menu_contact', async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      `📞 *Контакти:*\n\nТелефон: ${AUTOSERVICE.phone}\nАдреса: ${AUTOSERVICE.address}\n\nПишіть нам прямо тут — ми відповімо! 💬`,
      { parse_mode: 'Markdown', reply_markup: BACK }
    )
  })
}
