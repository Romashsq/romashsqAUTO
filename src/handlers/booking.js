import { InlineKeyboard } from 'grammy'
import SERVICES from '../data/services.js'
import { addBooking as addBookingDB, upsertClient, getBookingsByMasterAndDate } from '../db/index.js'
import { AUTOSERVICE } from '../config.js'
import { getState, setState, clearState } from '../state.js'

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

function getNext7WorkingDays() {
  const days = []
  const date = new Date()
  while (days.length < 7) {
    date.setDate(date.getDate() + 1)
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) days.push(new Date(date))
  }
  return days
}

function formatDate(date) {
  const dayNames = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const monthNames = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру']
  return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`
}

function formatDateFull(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return formatDate(new Date(Number(y), Number(m) - 1, Number(d)))
}

function buildServicesKb() {
  const kb = new InlineKeyboard()
  SERVICES.forEach((s) => kb.text(s.name, `service_${s.id}`).row())
  kb.text('❌ Скасувати', 'cancel')
  return kb
}

function buildMastersKb(service) {
  const kb = new InlineKeyboard()
  service.masters.forEach((m) => kb.text(`👨‍🔧 ${m}`, `master_${m}`).row())
  kb.text('❌ Скасувати', 'cancel')
  return kb
}

function buildDatesKb() {
  const kb = new InlineKeyboard()
  getNext7WorkingDays().forEach((d) =>
    kb.text(formatDate(d), `date_${d.toISOString().split('T')[0]}`).row()
  )
  kb.text('❌ Скасувати', 'cancel')
  return kb
}

async function buildTimesKb(master, date) {
  // Get already booked slots for this master+date
  const booked = await getBookingsByMasterAndDate(master, date)
  const bookedTimes = new Set(booked.map((b) => b.time))

  const kb = new InlineKeyboard()
  const available = TIME_SLOTS.filter((t) => !bookedTimes.has(t))

  if (available.length === 0) return null

  for (let i = 0; i < available.length; i += 3) {
    available.slice(i, i + 3).forEach((t) => kb.text(t, `time_${t}`))
    kb.row()
  }
  kb.text('❌ Скасувати', 'cancel')
  return kb
}

// Called from the text message handler in index.js
export async function handlePhoneInput(ctx) {
  const userId = String(ctx.from.id)
  const s = await getState(userId)
  if (s.mode !== 'booking' || s.step !== 'phone') return false

  const phone = ctx.message.text.trim()

  const phoneClean = phone.replace(/[\s\-()+]/g, '')
  const isValid = /^(\+?380|0)\d{9}$/.test(phoneClean)
  if (!isValid) {
    await ctx.reply(
      '❌ Невірний формат номера.\n\nВведіть номер у форматі: *+380 XX XXX XX XX*',
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text('❌ Скасувати', 'cancel'),
      }
    )
    return true
  }

  await setState(userId, { phone, step: 'confirm' })

  const confirmText =
    `📋 *Підтвердження запису:*\n\n` +
    `🔧 Послуга: ${s.service.name}\n` +
    `👨‍🔧 Майстер: ${s.master}\n` +
    `📅 Дата: ${formatDateFull(s.date)}\n` +
    `🕐 Час: ${s.time}\n` +
    `📞 Телефон: ${phone}\n\n` +
    `Все вірно?`

  await ctx.reply(confirmText, {
    parse_mode: 'Markdown',
    reply_markup: new InlineKeyboard()
      .text('✅ Підтвердити', 'confirm')
      .text('❌ Скасувати', 'cancel'),
  })
  return true
}

export default (bot) => {
  // ── Enter booking ──────────────────────────────────────────────────────
  bot.callbackQuery('menu_booking', async (ctx) => {
    await ctx.answerCallbackQuery()
    await setState(ctx.from.id, { mode: 'booking', step: 'service' })
    await ctx.editMessageText('🔧 *Оберіть послугу:*', {
      parse_mode: 'Markdown',
      reply_markup: buildServicesKb(),
    })
  })

  // ── Service selected ───────────────────────────────────────────────────
  bot.callbackQuery(/^service_/, async (ctx) => {
    const userId = String(ctx.from.id)
    const s = await getState(userId)
    if (s.mode !== 'booking') return
    await ctx.answerCallbackQuery()

    const service = SERVICES.find((s) => s.id === ctx.callbackQuery.data.replace('service_', ''))
    if (!service) return

    await setState(userId, { service, step: 'master' })
    await ctx.editMessageText(`✅ *${service.name}*\n\n👨‍🔧 *Оберіть майстра:*`, {
      parse_mode: 'Markdown',
      reply_markup: buildMastersKb(service),
    })
  })

  // ── Master selected ────────────────────────────────────────────────────
  bot.callbackQuery(/^master_/, async (ctx) => {
    const userId = String(ctx.from.id)
    const s = await getState(userId)
    if (s.mode !== 'booking') return
    await ctx.answerCallbackQuery()

    const master = ctx.callbackQuery.data.replace('master_', '')
    await setState(userId, { master, step: 'date' })
    await ctx.editMessageText(`✅ *Майстер: ${master}*\n\n📅 *Оберіть дату:*`, {
      parse_mode: 'Markdown',
      reply_markup: buildDatesKb(),
    })
  })

  // ── Date selected ──────────────────────────────────────────────────────
  bot.callbackQuery(/^date_/, async (ctx) => {
    const userId = String(ctx.from.id)
    const s = await getState(userId)
    if (s.mode !== 'booking') return
    await ctx.answerCallbackQuery()

    const date = ctx.callbackQuery.data.replace('date_', '')
    await setState(userId, { date, step: 'time' })

    const kb = await buildTimesKb(s.master, date)
    if (!kb) {
      await ctx.editMessageText(
        `😔 *На ${formatDateFull(date)} у майстра ${s.master} немає вільних місць.*\n\nОберіть іншу дату:`,
        { parse_mode: 'Markdown', reply_markup: buildDatesKb() }
      )
      return
    }

    await ctx.editMessageText(`✅ *Дата: ${formatDateFull(date)}*\n\n🕐 *Оберіть час:*`, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    })
  })

  // ── Time selected ──────────────────────────────────────────────────────
  bot.callbackQuery(/^time_/, async (ctx) => {
    const userId = String(ctx.from.id)
    const s = await getState(userId)
    if (s.mode !== 'booking') return
    await ctx.answerCallbackQuery()

    const time = ctx.callbackQuery.data.replace('time_', '')
    await setState(userId, { time, step: 'phone' })
    await ctx.editMessageText(
      `✅ *Час: ${time}*\n\n📞 *Введіть ваш номер телефону:*\nНаприклад: +38 050 123 45 67`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text('❌ Скасувати', 'cancel'),
      }
    )
  })

  // ── Confirm ────────────────────────────────────────────────────────────
  bot.callbackQuery('confirm', async (ctx) => {
    const userId = String(ctx.from.id)
    const s = await getState(userId)
    if (s.mode !== 'booking') return
    await ctx.answerCallbackQuery()

    await addBookingDB({
      telegramId: ctx.chat.id,
      name: ctx.from.first_name,
      phone: s.phone,
      service: s.service.name,
      master: s.master,
      date: s.date,
      time: s.time,
    })
    await upsertClient({
      telegramId: ctx.chat.id,
      name: ctx.from.first_name,
      username: ctx.from.username,
      phone: s.phone,
    })
    await clearState(userId)

    await ctx.editMessageText(
      `🎉 *Запис підтверджено\\!*\n\n` +
        `${s.service.name}\n` +
        `👨‍🔧 ${s.master}\n` +
        `📅 ${formatDateFull(s.date)} о ${s.time}\n\n` +
        `📍 ${AUTOSERVICE.address}\n\nДо зустрічі\\! 🙌`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: new InlineKeyboard().text('🏠 Головне меню', 'menu_main'),
      }
    )
  })

  // ── Cancel ─────────────────────────────────────────────────────────────
  bot.callbackQuery('cancel', async (ctx) => {
    await ctx.answerCallbackQuery()
    await clearState(ctx.from.id)
    await ctx.editMessageText('❌ Скасовано.', {
      reply_markup: new InlineKeyboard().text('🏠 Головне меню', 'menu_main'),
    })
  })
}
