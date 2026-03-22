import { InlineKeyboard } from 'grammy'
import { AUTOSERVICE } from '../config.js'

export const MAIN_MENU = new InlineKeyboard()
  .text('📋 Записатись', 'menu_booking').text('💰 Прайс', 'menu_price').row()
  .text('📍 Адреса', 'menu_address').text('🕐 Години роботи', 'menu_hours').row()
  .text('📞 Контакт', 'menu_contact').text('📝 Мої записи', 'menu_my_bookings')

export default (bot) => {
  bot.command('start', async (ctx) => {
    const name = ctx.from.first_name || 'друже'
    await ctx.reply(
      `👋 Вітаємо в *${AUTOSERVICE.name}*, ${name}\\!\n\n` +
        `Ми знаходимось в Одесі та раді допомогти з обслуговуванням вашого авто 🚗\n\n` +
        `Оберіть потрібний розділ:`,
      { parse_mode: 'MarkdownV2', reply_markup: MAIN_MENU }
    )
  })

  bot.command('menu', async (ctx) => {
    await ctx.reply('🏠 *Головне меню*\n\nОберіть потрібний розділ:', {
      parse_mode: 'Markdown',
      reply_markup: MAIN_MENU,
    })
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      '❓ *Допомога*\n\n' +
        '📋 *Записатись* — запис на послугу крок за кроком\n' +
        '💰 *Прайс* — ціни на всі послуги\n' +
        '📍 *Адреса* — де ми знаходимось\n' +
        '🕐 *Години роботи* — коли ми працюємо\n' +
        '📞 *Контакт* — зв\'язатись з нами\n' +
        '📝 *Мої записи* — ваші активні записи\n\n' +
        'Щоб повернутись до меню — /menu',
      { parse_mode: 'Markdown', reply_markup: MAIN_MENU }
    )
  })

  bot.callbackQuery('menu_main', async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.editMessageText('🏠 *Головне меню*\n\nОберіть потрібний розділ:', {
      parse_mode: 'Markdown',
      reply_markup: MAIN_MENU,
    })
  })
}
