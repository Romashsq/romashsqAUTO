import { InlineKeyboard } from 'grammy'
import SERVICES from '../data/services.js'
import { t, getLang } from '../i18n/index.js'

const buildPriceKb = (lang) => {
  const kb = new InlineKeyboard()
  SERVICES.forEach((s) => kb.text(s.name, `price_${s.id}`).row())
  kb.text(t(lang, 'btnMainMenu'), 'menu_main')
  return kb
}

export default (bot) => {
  const showPrice = async (ctx) => {
    const lang = await getLang(ctx.from?.id || ctx.chat?.id)
    const opts = {
      parse_mode: 'Markdown',
      reply_markup: buildPriceKb(lang),
    }
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(t(lang, 'priceList'), opts)
    } else {
      await ctx.reply(t(lang, 'priceList'), opts)
    }
  }

  bot.callbackQuery('menu_price', showPrice)
  bot.hears('💰 Прайс', showPrice)

  SERVICES.forEach((service) => {
    bot.callbackQuery(`price_${service.id}`, async (ctx) => {
      await ctx.answerCallbackQuery()
      const lang = await getLang(ctx.from.id)
      let text = `${service.name}\n_${service.description}_\n\n`
      service.prices.forEach((p) => {
        text += `• ${p.name}: *${p.price}*\n`
      })
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text(t(lang, 'btnBook'), 'menu_booking').row()
          .text(t(lang, 'btnBackToPrice'), 'menu_price').row()
          .text(t(lang, 'btnMainMenu'), 'menu_main'),
      })
    })
  })
}
