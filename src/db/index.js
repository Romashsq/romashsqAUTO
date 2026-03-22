import Client from './models/Client.js'
import Booking from './models/Booking.js'
import History from './models/History.js'
import Notification from './models/Notification.js'

// ── Clients ────────────────────────────────────────────────────────────────
export async function upsertClient({ telegramId, name, username, phone, car, carYear }) {
  await Client.findOneAndUpdate(
    { telegramId: String(telegramId) },
    {
      $set: { name, username: username || '', lastVisit: new Date() },
      $setOnInsert: { phone: phone || '', car: car || '', carYear: carYear || '', createdAt: new Date() },
      $inc: { totalVisits: 1 },
    },
    { upsert: true }
  )
}

export async function getClient(telegramId) {
  return Client.findOne({ telegramId: String(telegramId) })
}

export async function getAllClients() {
  return Client.find().sort({ createdAt: -1 })
}

export async function updateClientCar(telegramId, car, carYear = '') {
  await Client.findOneAndUpdate({ telegramId: String(telegramId) }, { car, carYear })
}

// ── Bookings ───────────────────────────────────────────────────────────────
export async function addBooking(data) {
  const booking = new Booking({ ...data, telegramId: String(data.telegramId) })
  return booking.save()
}

export async function getClientBookings(telegramId) {
  return Booking.find({
    telegramId: String(telegramId),
    status: { $nin: ['скасовано', 'завершено'] },
  }).sort({ date: 1, time: 1 })
}

export async function getTodayBookings() {
  const today = new Date().toISOString().split('T')[0]
  return Booking.find({ date: today, status: { $ne: 'скасовано' } }).sort({ time: 1 })
}

export async function getTomorrowBookings() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  return Booking.find({ date: tomorrowStr, status: 'підтверджено' })
}

export async function getBookingsByMasterAndDate(master, date) {
  return Booking.find({ master, date, status: { $nin: ['скасовано'] } })
}

export async function updateBookingStatus(bookingId, status) {
  return Booking.findByIdAndUpdate(bookingId, { status, updatedAt: new Date() })
}

export async function getBookingById(bookingId) {
  return Booking.findById(bookingId)
}

// ── History ────────────────────────────────────────────────────────────────
export async function addHistory(data) {
  const entry = new History({ ...data, telegramId: String(data.telegramId) })
  return entry.save()
}

export async function getClientsForReminder() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  // Find latest history entry per client
  const result = await History.aggregate([
    { $sort: { completedAt: -1 } },
    { $group: { _id: '$telegramId', lastVisit: { $first: '$completedAt' } } },
    { $match: { lastVisit: { $lt: sixMonthsAgo } } },
  ])
  return result.map((r) => r._id)
}

// ── Notifications ──────────────────────────────────────────────────────────
export async function wasNotificationSent(telegramId, type) {
  return !!(await Notification.findOne({ telegramId: String(telegramId), type }))
}

export async function markNotificationSent(telegramId, type) {
  await Notification.findOneAndUpdate(
    { telegramId: String(telegramId), type },
    { sentAt: new Date() },
    { upsert: true }
  )
}

// ── Stats ──────────────────────────────────────────────────────────────────
export async function getStats() {
  const [clients, totalBookings, completed, cancelled, todayBookings] = await Promise.all([
    Client.countDocuments(),
    Booking.countDocuments(),
    History.countDocuments(),
    Booking.countDocuments({ status: 'скасовано' }),
    getTodayBookings(),
  ])
  return { clients, totalBookings, completed, cancelled, today: todayBookings.length }
}
