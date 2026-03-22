import 'dotenv/config'
import { Bot } from 'grammy'
import { createServer } from 'node:http'
import { webhookCallback } from 'grammy'
import { BOT_TOKEN, WEBHOOK_URL, PORT } from './config.js'
import { initSheets } from './services/sheets.js'
import { connectDB } from './db/connection.js'
import { startReminders } from './services/reminders.js'
import registerStart from './handlers/start.js'
import registerBooking, { handlePhoneInput } from './handlers/booking.js'
import registerPrice from './handlers/price.js'
import registerInfo from './handlers/info.js'
import registerMyBookings from './handlers/myBookings.js'
import registerAdmin, { handleAdminText } from './handlers/admin.js'

if (!BOT_TOKEN) throw new Error('BOT_TOKEN is not set in .env')

const bot = new Bot(BOT_TOKEN)

// ── Register handlers ──────────────────────────────────────────────────────
registerStart(bot)
registerBooking(bot)
registerPrice(bot)
registerInfo(bot)
registerMyBookings(bot)
registerAdmin(bot)

// ── Text message handler ───────────────────────────────────────────────────
bot.on('message:text', async (ctx) => {
  // Delegate to booking phone step if active
  if (await handleAdminText(ctx, bot)) return
  if (await handlePhoneInput(ctx)) return

  await ctx.reply('Скористайтесь кнопками меню або надішліть /start 👇')
})

// ── Error handler ──────────────────────────────────────────────────────────
bot.catch((err) => {
  console.error('Bot error:', err.message)
})

// ── Setup: commands + Menu button ─────────────────────────────────────────
async function setup() {
  await connectDB()
  await initSheets()

  await bot.api.setMyCommands([
    { command: 'start', description: 'Головне меню' },
    { command: 'menu', description: 'Показати меню' },
    { command: 'help', description: 'Допомога' },
  ])

  // Shows the "Menu" button in the Telegram command bar
  await bot.api.setChatMenuButton({ menu_button: { type: 'commands' } })

  console.log('✅ Commands and Menu button registered')

  startReminders(bot)
}

// ── Launch ─────────────────────────────────────────────────────────────────
console.log('Starting bot...')
console.log('WEBHOOK_URL:', WEBHOOK_URL || 'not set → polling mode')
console.log('PORT:', PORT)

if (WEBHOOK_URL) {
  // Production: webhook mode (Render)
  const handleUpdate = webhookCallback(bot, 'http')
  const server = createServer(async (req, res) => {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('OK')
      return
    }
    await handleUpdate(req, res)
  })

  server.listen(PORT, () => console.log(`✅ Webhook server on port ${PORT}`))
  await setup()
  try {
    await bot.api.setWebhook(WEBHOOK_URL)
    console.log('✅ Webhook set:', WEBHOOK_URL)
  } catch (e) {
    console.error('❌ setWebhook failed:', e.message)
  }
} else {
  // Development or Render without webhook — start HTTP health server + polling
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('OK')
  })
  server.listen(PORT, () => console.log(`✅ Health server on port ${PORT}`))
  await setup()
  await bot.start({ onStart: () => console.log('✅ Bot polling started') })
}
