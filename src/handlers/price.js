import { InlineKeyboard } from 'grammy'
import SERVICES from '../data/services.js'

const buildPriceKb = () => {
  const kb = new InlineKeyboard()
  SERVICES.forEach((s) => kb.text(s.name, `price_${s.id}`).row())
  kb.text('🏠 Головне меню', 'menu_main')
  return kb
}

export default (bot) => {
  const showPrice = async (ctx) => {
    const opts = {
      parse_mode: 'Markdown',
      reply_markup: buildPriceKb(),
    }
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText('💰 *Прайс-лист*\n\nОберіть послугу для перегляду цін:', opts)
    } else {
      await ctx.reply('💰 *Прайс-лист*\n\nОберіть послугу для перегляду цін:', opts)
    }
  }

  bot.callbackQuery('menu_price', showPrice)
  bot.hears('💰 Прайс', showPrice)

  SERVICES.forEach((service) => {
    bot.callbackQuery(`price_${service.id}`, async (ctx) => {
      await ctx.answerCallbackQuery()
      let text = `${service.name}\n_${service.description}_\n\n`
      service.prices.forEach((p) => {
        text += `• ${p.name}: *${p.price}*\n`
      })
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📋 Записатись', 'menu_booking').row()
          .text('← Назад до прайсу', 'menu_price').row()
          .text('🏠 Головне меню', 'menu_main'),
      })
    })
  })
}
