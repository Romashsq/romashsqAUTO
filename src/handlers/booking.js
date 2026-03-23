import { InlineKeyboard } from 'grammy'
import SERVICES from '../data/services.js'
import { addBooking as addBookingDB, upsertClient, getBookingsByMasterAndDate } from '../db/index.js'
import { addBooking as addBookingSheets, upsertClient as upsertClientSheets } from '../services/sheets.js'
import { AUTOSERVICE } from '../config.js'
import { getState, setState, clearState } from '../state.js'
import { t, getLang, formatDate, formatDateStr } from '../i18n/index.js'

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

function buildServicesKb(lang) {
  const kb = new InlineKeyboard()
  SERVICES.forEach((s) => kb.text(s.name, `service_${s.id}`).row())
  kb.text(t(lang, 'btnCancel'), 'cancel')
  return kb
}

function buildMastersKb(service, lang) {
  const kb = new InlineKeyboard()
  service.masters.forEach((m) => kb.text(`👨‍🔧 ${m}`, `master_${m}`).row())
  kb.text(t(lang, 'btnCancel'), 'cancel')
  return kb
}

function buildDatesKb(lang) {
  const kb = new InlineKeyboard()
  getNext7WorkingDays().forEach((d) =>
    kb.text(formatDate(d, lang), `date_${d.toISOString().split('T')[0]}`).row()
  )
  kb.text(t(lang, 'btnCancel'), 'cancel')
  return kb
}

async function buildTimesKb(master, date, lang) {
  const booked = await getBookingsByMasterAndDate(master, date)
  const bookedTimes = new Set(booked.map((b) => b.time))
  const kb = new InlineKeyboard()
  const available = TIME_SLOTS.filter((t) => !bookedTimes.has(t))
  if (available.length === 0) return null
  for (let i = 0; i < available.length; i += 3) {
    available.slice(i, i + 3).forEach((slot) => kb.text(slot, `time_${slot}`))
    kb.row()
  }
  kb.text(t(lang, 'btnCancel'), 'cancel')
  return kb
}

// Called from the text message handler in index.js
export async function handlePhoneInput(ctx) {
  const userId = String(ctx.from.id)
  const s = await getState(userId)
  if (s.mode !== 'booking' || s.step !== 'phone') return false

  const lang = await getLang(userId)
  const phone = ctx.message.text.trim()
  const phoneClean = phone.replace(/[\s\-()+]/g, '')
  const isValid = /^(\+?380|0)\d{9}$/.test(phoneClean)

  if (!isValid) {
    await ctx.reply(t(lang, 'phoneInvalid'), {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text(t(lang, 'btnCancel'), 'cancel'),
    })
    return true
  }

  await setState(userId, { phone, step: 'confirm' })

  await ctx.reply(
    t(lang, 'confirmBooking', s.service.name, s.master, formatDateStr(s.date, lang), s.time, phone),
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text(t(lang, 'btnConfirm'), 'confirm')
        .text(t(lang, 'btnCancel'), 'cancel'),
    }
  )
  return true
}

export default (bot) => {
  // ── Enter booking ──────────────────────────────────────────────────────
  const startBooking = async (ctx) => {
    const lang = await getLang(ctx.from.id)
    await setState(ctx.from.id, { mode: 'booking', step: 'service' })
    const opts = { parse_mode: 'Markdown', reply_markup: buildServicesKb(lang) }
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(t(lang, 'selectService'), opts)
    } else {
      await ctx.reply(t(lang, 'selectService'), opts)
    }
  }
  bot.callbackQuery('menu_booking', startBooking)
  bot.hears(['📋 Записатись', '📋 Записаться'], startBooking)

  // ── Service selected ───────────────────────────────────────────────────
  bot.callbackQuery(/^service_/, async (ctx) => {
    const userId = String(ctx.from.id)
    const s = await getState(userId)
    if (s.mode !== 'booking') return
    await ctx.answerCallbackQuery()
    const lang = await getLang(userId)

    const service = SERVICES.find((svc) => svc.id === ctx.callbackQuery.data.replace('service_', ''))
    if (!service) return

    await setState(userId, { service, step: 'master' })
    await ctx.editMessageText(t(lang, 'selectMaster', service.name), {
      parse_mode: 'Markdown',
      reply_markup: buildMastersKb(service, lang),
    })
  })

  // ── Master selected ────────────────────────────────────────────────────
  bot.callbackQuery(/^master_/, async (ctx) => {
    const userId = String(ctx.from.id)
    const s = await getState(userId)
    if (s.mode !== 'booking') return
    await ctx.answerCallbackQuery()
    const lang = await getLang(userId)

    const master = ctx.callbackQuery.data.replace('master_', '')
    await setState(userId, { master, step: 'date' })
    await ctx.editMessageText(t(lang, 'selectDate', master), {
      parse_mode: 'Markdown',
      reply_markup: buildDatesKb(lang),
    })
  })

  // ── Date selected ──────────────────────────────────────────────────────
  bot.callbackQuery(/^date_/, async (ctx) => {
    const userId = String(ctx.from.id)
    const s = await getState(userId)
    if (s.mode !== 'booking') return
    await ctx.answerCallbackQuery()
    const lang = await getLang(userId)

    const date = ctx.callbackQuery.data.replace('date_', '')
    await setState(userId, { date, step: 'time' })

    const kb = await buildTimesKb(s.master, date, lang)
    if (!kb) {
      await ctx.editMessageText(
        t(lang, 'noSlots', formatDateStr(date, lang), s.master),
        { parse_mode: 'Markdown', reply_markup: buildDatesKb(lang) }
      )
      return
    }

    await ctx.editMessageText(t(lang, 'selectTime', formatDateStr(date, lang)), {
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
    const lang = await getLang(userId)

    const time = ctx.callbackQuery.data.replace('time_', '')
    await setState(userId, { time, step: 'phone' })
    await ctx.editMessageText(t(lang, 'enterPhone', time), {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text(t(lang, 'btnCancel'), 'cancel'),
    })
  })

  // ── Confirm ────────────────────────────────────────────────────────────
  bot.callbackQuery('confirm', async (ctx) => {
    const userId = String(ctx.from.id)
    const s = await getState(userId)
    if (s.mode !== 'booking') return
    await ctx.answerCallbackQuery()
    const lang = await getLang(userId)

    const bookingData = {
      telegramId: ctx.chat.id,
      name: ctx.from.first_name,
      phone: s.phone,
      service: s.service.name,
      master: s.master,
      date: s.date,
      time: s.time,
    }
    await addBookingDB(bookingData)
    await upsertClient({
      telegramId: ctx.chat.id,
      name: ctx.from.first_name,
      username: ctx.from.username,
      phone: s.phone,
    })

    addBookingSheets(bookingData).catch((e) => console.warn('Sheets addBooking error:', e.message))
    upsertClientSheets({
      telegramId: ctx.chat.id,
      name: ctx.from.first_name,
      username: ctx.from.username,
      phone: s.phone,
    }).catch((e) => console.warn('Sheets upsertClient error:', e.message))

    await clearState(userId)
    await ctx.editMessageText(
      t(lang, 'bookingConfirmed', s.service.name, s.master, formatDateStr(s.date, lang), s.time, AUTOSERVICE.address),
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text(t(lang, 'btnMainMenu'), 'menu_main'),
      }
    )
  })

  // ── Cancel ─────────────────────────────────────────────────────────────
  bot.callbackQuery('cancel', async (ctx) => {
    await ctx.answerCallbackQuery()
    const lang = await getLang(ctx.from.id)
    await clearState(ctx.from.id)
    await ctx.editMessageText(t(lang, 'cancelled'), {
      reply_markup: new InlineKeyboard().text(t(lang, 'btnMainMenu'), 'menu_main'),
    })
  })
}
