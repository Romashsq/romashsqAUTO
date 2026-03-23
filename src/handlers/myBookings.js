import { InlineKeyboard } from 'grammy'
import { getClientBookings, updateBookingStatus } from '../db/index.js'
import { t, getLang, formatDateStr } from '../i18n/index.js'

async function showMyBookings(ctx) {
  if (ctx.callbackQuery) await ctx.answerCallbackQuery()
  const lang = await getLang(ctx.from?.id || ctx.chat?.id)
  const bookings = await getClientBookings(ctx.chat.id)

  if (bookings.length === 0) {
    const text = t(lang, 'noBookings')
    const opts = {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text(t(lang, 'btnBook'), 'menu_booking').row()
        .text(t(lang, 'btnMainMenu'), 'menu_main'),
    }
    if (ctx.callbackQuery) await ctx.editMessageText(text, opts)
    else await ctx.reply(text, opts)
    return
  }

  let text = t(lang, 'yourBookings')
  const kb = new InlineKeyboard()
  bookings.forEach((b, i) => {
    text += `*${i + 1}.* ${b.service}\n`
    text += `   👨‍🔧 ${b.master}\n`
    text += `   📅 ${formatDateStr(b.date, lang)} о ${b.time}\n\n`
    kb.text(`❌ ${i + 1}`, `cancel_booking:${b._id}`).row()
  })
  kb.text(t(lang, 'btnNewBooking'), 'menu_booking').row()
  kb.text(t(lang, 'btnMainMenu'), 'menu_main')

  const opts = { parse_mode: 'Markdown', reply_markup: kb }
  if (ctx.callbackQuery) await ctx.editMessageText(text, opts)
  else await ctx.reply(text, opts)
}

export default (bot) => {
  bot.callbackQuery('menu_my_bookings', showMyBookings)
  bot.hears(['📝 Мої записи', '📝 Мои записи'], showMyBookings)

  bot.callbackQuery(/^cancel_booking:/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const lang = await getLang(ctx.from.id)
    const bookingId = ctx.callbackQuery.data.replace('cancel_booking:', '')
    await ctx.editMessageText(t(lang, 'cancelConfirm'), {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text(t(lang, 'btnCancelYes'), `confirm_cancel:${bookingId}`)
        .text(t(lang, 'btnBack'), 'menu_my_bookings'),
    })
  })

  bot.callbackQuery(/^confirm_cancel:/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const lang = await getLang(ctx.from.id)
    const bookingId = ctx.callbackQuery.data.replace('confirm_cancel:', '')
    await updateBookingStatus(bookingId, 'скасовано')
    await ctx.editMessageText(t(lang, 'cancelDone'), {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text(t(lang, 'btnBook'), 'menu_booking').row()
        .text(t(lang, 'btnMainMenu'), 'menu_main'),
    })
  })
}
