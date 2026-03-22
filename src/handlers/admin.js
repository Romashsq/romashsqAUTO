import { InlineKeyboard } from 'grammy'
import { ADMIN_ID, AUTOSERVICE } from '../config.js'
import {
  getTodayBookings,
  getAllClients,
  updateBookingStatus,
  addHistory,
  getBookingById,
  getStats,
} from '../db/index.js'

function isAdmin(ctx) {
  return String(ctx.from.id) === String(ADMIN_ID)
}


const ADMIN_MENU = new InlineKeyboard()
  .text('📅 Сьогодні', 'adm_today').text('👥 Клієнти', 'adm_clients').row()
  .text('📊 Статистика', 'adm_stats').text('📢 Розсилка', 'adm_broadcast').row()

export default (bot) => {
  bot.command('admin', async (ctx) => {
    if (!isAdmin(ctx)) return
    await ctx.reply(
      `🔧 *Панель адміністратора*\n_${AUTOSERVICE.name}_`,
      { parse_mode: 'Markdown', reply_markup: ADMIN_MENU }
    )
  })

  // ── Today ──────────────────────────────────────────────────────────────
  bot.callbackQuery('adm_today', async (ctx) => {
    if (!isAdmin(ctx)) return
    await ctx.answerCallbackQuery()
    const bookings = await getTodayBookings()

    if (bookings.length === 0) {
      await ctx.editMessageText('📅 *Сьогодні записів немає*', {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text('← Назад', 'adm_menu'),
      })
      return
    }

    let text = `📅 *Записи на сьогодні (${bookings.length}):*\n\n`
    const kb = new InlineKeyboard()

    bookings.forEach((b, _i) => {
      const icon = { 'готово': '✅', 'в роботі': '🔧', 'підтверджено': '🕐' }[b.status] || '🕐'
      text += `${icon} *${b.time}* — ${b.service}\n`
      text += `   👤 ${b.name} (${b.phone})\n`
      text += `   👨‍🔧 ${b.master}\n\n`

      if (!['готово', 'скасовано', 'завершено'].includes(b.status)) {
        kb.text(`🔧 В роботі — ${b.name}`, `adm_inwork:${b._id}`).row()
        kb.text(`✅ Готово — ${b.name}`, `adm_ready:${b._id}:${b.telegramId}`).row()
      }
    })

    kb.text('🔄 Оновити', 'adm_today').row().text('← Назад', 'adm_menu')
    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: kb })
  })

  // ── In progress ────────────────────────────────────────────────────────
  bot.callbackQuery(/^adm_inwork:/, async (ctx) => {
    if (!isAdmin(ctx)) return
    const bookingId = ctx.callbackQuery.data.replace('adm_inwork:', '')
    await updateBookingStatus(bookingId, 'в роботі')
    await ctx.answerCallbackQuery('🔧 Статус: в роботі')
  })

  // ── Ready → notify client ──────────────────────────────────────────────
  bot.callbackQuery(/^adm_ready:/, async (ctx) => {
    if (!isAdmin(ctx)) return
    const [bookingId, clientId] = ctx.callbackQuery.data.replace('adm_ready:', '').split(':')

    await updateBookingStatus(bookingId, 'готово')

    const booking = await getBookingById(bookingId)
    if (booking) {
      await addHistory({
        telegramId: booking.telegramId,
        service: booking.service,
        master: booking.master,
        date: booking.date,
      })
    }

    try {
      await bot.api.sendMessage(
        clientId,
        `🎉 *Ваш автомобіль готовий\\!*\n\n` +
          `Можете забирати — чекаємо вас\\!\n\n` +
          `📍 ${AUTOSERVICE.address}`,
        { parse_mode: 'MarkdownV2' }
      )
    } catch (e) {
      console.error('Failed to notify client:', e.message)
    }

    await ctx.answerCallbackQuery('✅ Клієнта повідомлено')
  })

  // ── Clients ────────────────────────────────────────────────────────────
  bot.callbackQuery('adm_clients', async (ctx) => {
    if (!isAdmin(ctx)) return
    await ctx.answerCallbackQuery()
    const clients = await getAllClients()

    let text = `👥 *Клієнти (${clients.length}):*\n\n`
    clients.slice(0, 10).forEach((c) => {
      text += `👤 *${c.name}* ${c.username ? `(@${c.username})` : ''}\n`
      text += `   📞 ${c.phone || '—'}  🚗 ${c.car || '—'}\n`
      text += `   Візитів: ${c.totalVisits}\n\n`
    })
    if (clients.length > 10) text += `_...показано 10 з ${clients.length}_`

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text('← Назад', 'adm_menu'),
    })
  })

  // ── Stats ──────────────────────────────────────────────────────────────
  bot.callbackQuery('adm_stats', async (ctx) => {
    if (!isAdmin(ctx)) return
    await ctx.answerCallbackQuery()
    const s = await getStats()

    await ctx.editMessageText(
      `📊 *Статистика*\n\n` +
        `👥 Клієнтів: *${s.clients}*\n` +
        `📅 Записів сьогодні: *${s.today}*\n` +
        `📋 Всього записів: *${s.totalBookings}*\n` +
        `✅ Виконано: *${s.completed}*\n` +
        `❌ Скасовано: *${s.cancelled}*`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text('← Назад', 'adm_menu'),
      }
    )
  })

  // ── Broadcast ──────────────────────────────────────────────────────────
  bot.callbackQuery('adm_broadcast', async (ctx) => {
    if (!isAdmin(ctx)) return
    await ctx.answerCallbackQuery()
    const { setState } = await import('../state.js')
    setState(ctx.from.id, { adminMode: 'broadcast' })
    await ctx.editMessageText(
      `📢 *Розсилка*\n\nНадішліть текст повідомлення:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text('❌ Скасувати', 'adm_menu'),
      }
    )
  })

  // ── Back ───────────────────────────────────────────────────────────────
  bot.callbackQuery('adm_menu', async (ctx) => {
    if (!isAdmin(ctx)) return
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      `🔧 *Панель адміністратора*\n_${AUTOSERVICE.name}_`,
      { parse_mode: 'Markdown', reply_markup: ADMIN_MENU }
    )
  })
}

// ── Broadcast text handler ─────────────────────────────────────────────────
export async function handleAdminText(ctx, bot) {
  const { getState, setState } = await import('../state.js')
  const userId = String(ctx.from.id)
  if (userId !== String(ADMIN_ID) || getState(userId).adminMode !== 'broadcast') return false

  setState(userId, { adminMode: null })
  const text = ctx.message.text
  const clients = await getAllClients()
  let sent = 0

  await ctx.reply(`📢 Розсилка для ${clients.length} клієнтів...`)
  for (const c of clients) {
    try { await bot.api.sendMessage(c.telegramId, text); sent++ } catch {}
  }
  await ctx.reply(`✅ Надіслано: ${sent}/${clients.length}`)
  return true
}
