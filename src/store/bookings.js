// In-memory storage for prototype. Replace with Google Sheets in production.
const bookings = new Map()

export function addBooking(chatId, booking) {
  if (!bookings.has(chatId)) bookings.set(chatId, [])
  bookings.get(chatId).push({ ...booking, id: Date.now(), createdAt: new Date().toISOString() })
}

export function getBookings(chatId) {
  return bookings.get(chatId) || []
}
