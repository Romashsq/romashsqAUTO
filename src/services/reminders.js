import cron from 'node-cron'
import { getTomorrowBookings, getClientsForReminder, getAllClients, wasNotificationSent, markNotificationSent } from '../db/index.js'
import { AUTOSERVICE } from '../config.js'

export function startReminders(bot) {
  // ── Щодня о 10:00 — нагадування про завтрашній запис ──────────────────
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Running tomorrow reminders...')
    try {
      const bookings = await getTomorrowBookings()
      for (const b of bookings) {
       try {
          await bot.api.sendMessage(
            b.telegramId,
            `🔔 *Нагадування про запис*\n\n` +
              `Завтра о *${b.time}* вас чекаємо на:\n` +
              `${b.service}\n` +
              `👨‍🔧 Майстер: ${b.master}\n\n` +
              `📍 ${AUTOSERVICE.address}\n\n` +
              `Якщо плани змінились — скасуйте запис у меню.`,
            { parse_mode: 'Markdown' }
          )
        } catch (e) {
          console.error(`Failed to notify ${b.telegramId}:`, e.message)
        }
      }
    } catch (e) {
      console.error('Tomorrow reminders error:', e.message)
    }
  }, { timezone: 'Europe/Kiev' })

  // ── Щомісяця 1-го о 12:00 — нагадування клієнтам які не були 6+ міс ──
  cron.schedule('0 12 1 * *', async () => {
    console.log('⏰ Running 6-month reminders...')
    try {
      const clientIds = await getClientsForReminder()
      const month = new Date().toISOString().slice(0, 7) // 2026-03
      for (const telegramId of clientIds) {
        const type = `reminder_6m_${month}`
        if (await wasNotificationSent(telegramId, type)) continue
        try {
          await bot.api.sendMessage(
            telegramId,
            `👋 Давно не бачились!\n\n` +
              `Минуло більше 6 місяців з вашого останнього візиту до *${AUTOSERVICE.name}*.\n\n` +
              `Час перевірити авто? Записуйтесь — і ваша машина буде як нова 🚗✨`,
            { parse_mode: 'Markdown' }
          )
          await markNotificationSent(telegramId, type)
        } catch (e) {
          console.error(`Failed to remind ${telegramId}:`, e.message)
        }
      }
    } catch (e) {
      console.error('6-month reminders error:', e.message)
    }
  }, { timezone: 'Europe/Kiev' })

  // ── 1 жовтня і 1 квітня — сезонна розсилка шиномонтаж ────────────────
  cron.schedule('0 11 1 10,4 *', async () => {
    const month = new Date().getMonth() + 1
    const isWinter = month === 10
    const type = isWinter ? 'tires_winter_2026' : 'tires_summer_2026'
    const msg = isWinter
      ? `❄️ *Сезон зимових шин!*\n\nНе забудьте замінити шини до перших морозів.\n\nЗапишіться на шиномонтаж прямо зараз — місця обмежені! 🛞`
      : `☀️ *Сезон літніх шин!*\n\nВесна прийшла — час міняти шини!\n\nЗапишіться на шиномонтаж 🛞`

    console.log(`⏰ Running seasonal tires broadcast (${type})...`)
    try {
      const clients = await getAllClients()
      for (const client of clients) {
        const telegramId = client.telegramId
        if (await wasNotificationSent(telegramId, type)) continue
        try {
          await bot.api.sendMessage(telegramId, msg, { parse_mode: 'Markdown' })
          await markNotificationSent(telegramId, type)
        } catch (e) {
          console.error(`Broadcast failed for ${telegramId}:`, e.message)
        }
      }
    } catch (e) {
      console.error('Seasonal broadcast error:', e.message)
    }
  }, { timezone: 'Europe/Kiev' })

  console.log('✅ Reminders scheduler started')
}
