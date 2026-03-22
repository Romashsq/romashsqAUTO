import { InlineKeyboard } from 'grammy'
import { getClientBookings, updateBookingStatus } from '../db/index.js'

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const date = new Date(y, m - 1, d)
  const dayNames = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const monthNames = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру']
  return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`
}

export default (bot) => {
  bot.callbackQuery('menu_my_bookings', async (ctx) => {
    await ctx.answerCallbackQuery()
    const bookings = await getClientBookings(ctx.chat.id)

    if (bookings.length === 0) {
      await ctx.editMessageText(
        `📝 *Мої записи*\n\nУ вас поки немає активних записів.\n\nЗапишіться на послугу прямо зараз! 🚗`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('📋 Записатись', 'menu_booking').row()
            .text('🏠 Головне меню', 'menu_main'),
        }
      )
      return
    }

    let text = `📝 *Ваші записи:*\n\n`
    const kb = new InlineKeyboard()

    bookings.forEach((b, i) => {
      text += `*${i + 1}.* ${b.service}\n`
      text += `   👨‍🔧 ${b.master}\n`
      text += `   📅 ${formatDate(b.date)} о ${b.time}\n\n`
      kb.text(`❌ Скасувати запис ${i + 1}`, `cancel_booking:${b._id}`).row()
    })

    kb.text('📋 Новий запис', 'menu_booking').row()
    kb.text('🏠 Головне меню', 'menu_main')

    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: kb })
  })

  bot.callbackQuery(/^cancel_booking:/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const bookingId = ctx.callbackQuery.data.replace('cancel_booking:', '')
    await ctx.editMessageText(
      `❓ *Підтвердіть скасування*\n\nВи впевнені що хочете скасувати цей запис?`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('✅ Так, скасувати', `confirm_cancel:${bookingId}`)
          .text('← Назад', 'menu_my_bookings'),
      }
    )
  })

  bot.callbackQuery(/^confirm_cancel:/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const bookingId = ctx.callbackQuery.data.replace('confirm_cancel:', '')
    await updateBookingStatus(bookingId, 'скасовано')
    await ctx.editMessageText(
      `✅ *Запис скасовано*\n\nЯкщо бажаєте записатись знову — натисніть кнопку нижче.`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📋 Записатись', 'menu_booking').row()
          .text('🏠 Головне меню', 'menu_main'),
      }
    )
  })
}
