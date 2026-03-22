import { google } from 'googleapis'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SPREADSHEET_ID = process.env.SPREADSHEET_ID

// Auth — use env var in production, file in development
let credentials
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
} else {
  credentials = JSON.parse(
    readFileSync(resolve(__dirname, '../../google-credentials.json'), 'utf8')
  )
}
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })

// ── Helpers ────────────────────────────────────────────────────────────────
export async function getRows(sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  })
  return res.data.values || []
}

async function appendRow(sheetName, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

async function updateRow(sheetName, rowIndex, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

// ── Init: create sheets if missing, set headers ────────────────────────────
export async function initSheets() {
  const SHEET_HEADERS = {
    Клієнти:  ['telegram_id', 'імя', 'username', 'телефон', 'авто', 'рік_авто', 'реєстрація', 'останній_візит', 'кількість_візитів'],
    Записи:   ['id', 'telegram_id', 'імя', 'телефон', 'послуга', 'майстер', 'дата', 'час', 'статус', 'авто', 'створено'],
    Історія:  ['id', 'telegram_id', 'послуга', 'майстер', 'дата', 'пробіг', 'нотатки', 'завершено'],
    Розсилки: ['telegram_id', 'тип', 'дата_надсилання'],
  }

  // Get existing sheet names
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const existingNames = meta.data.sheets.map((s) => s.properties.title)

  // Create missing sheets
  const toCreate = Object.keys(SHEET_HEADERS).filter((name) => !existingNames.includes(name))
  if (toCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: toCreate.map((title) => ({ addSheet: { properties: { title } } })),
      },
    })
    console.log(`✅ Created sheets: ${toCreate.join(', ')}`)
  }

  // Set headers if sheet is empty
  for (const [name, header] of Object.entries(SHEET_HEADERS)) {
    const rows = await getRows(name)
    if (rows.length === 0) {
      await appendRow(name, header)
      console.log(`✅ Headers set for ${name}`)
    }
  }
}

// ── Клієнти ────────────────────────────────────────────────────────────────
export async function upsertClient({ telegramId, name, username, phone = '', car = '', carYear = '' }) {
  const rows = await getRows('Клієнти')
  const now = new Date().toISOString().split('T')[0]

  // Skip header row (index 0), search from row 2
  const idx = rows.findIndex((r, i) => i > 0 && r[0] === String(telegramId))

  if (idx === -1) {
    // New client
    await appendRow('Клієнти', [String(telegramId), name, username || '', phone, car, carYear, now, now, 1])
  } else {
    // Update last visit + visits count
    const row = rows[idx]
    const visits = (parseInt(row[8]) || 0) + 1
    await updateRow('Клієнти', idx + 1, [row[0], name, username || '', row[3] || phone, row[4] || car, row[5] || carYear, row[6], now, visits])
  }
}

export async function getAllClients() {
  const rows = await getRows('Клієнти')
  return rows.slice(1) // skip header
}

// ── Записи ─────────────────────────────────────────────────────────────────
export async function addBooking({ telegramId, name, phone, service, master, date, time, car = '' }) {
  const id = Date.now().toString()
  const now = new Date().toISOString().split('T')[0]
  await appendRow('Записи', [id, String(telegramId), name, phone, service, master, date, time, 'підтверджено', car, now])
  return id
}

export async function getClientBookings(telegramId) {
  const rows = await getRows('Записи')
  return rows.slice(1).filter((r) => r[1] === String(telegramId) && r[8] !== 'скасовано' && r[8] !== 'завершено')
}

export async function getTomorrowBookings() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  const rows = await getRows('Записи')
  return rows.slice(1).filter((r) => r[6] === tomorrowStr && r[8] === 'підтверджено')
}

export async function updateBookingStatus(bookingId, status) {
  const rows = await getRows('Записи')
  const idx = rows.findIndex((r, i) => i > 0 && r[0] === String(bookingId))
  if (idx === -1) return false
  const row = rows[idx]
  row[8] = status
  await updateRow('Записи', idx + 1, row)
  return true
}

// ── Історія ────────────────────────────────────────────────────────────────
export async function addHistory({ telegramId, service, master, date, mileage = '', notes = '' }) {
  const id = Date.now().toString()
  const now = new Date().toISOString().split('T')[0]
  await appendRow('Історія', [id, String(telegramId), service, master, date, mileage, notes, now])
}

export async function getClientsForReminder() {
  const rows = await getRows('Історія')
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  // Find latest visit per client
  const latestVisit = {}
  rows.slice(1).forEach((r) => {
    const tid = r[1]
    const date = new Date(r[7])
    if (!latestVisit[tid] || date > latestVisit[tid]) {
      latestVisit[tid] = date
    }
  })

  // Return clients who haven't visited in 6+ months
  return Object.entries(latestVisit)
    .filter(([, date]) => date < sixMonthsAgo)
    .map(([telegramId]) => telegramId)
}

// ── Розсилки ───────────────────────────────────────────────────────────────
export async function wasNotificationSent(telegramId, type) {
  const rows = await getRows('Розсилки')
  return rows.slice(1).some((r) => r[0] === String(telegramId) && r[1] === type)
}

export async function markNotificationSent(telegramId, type) {
  const now = new Date().toISOString().split('T')[0]
  await appendRow('Розсилки', [String(telegramId), type, now])
}
