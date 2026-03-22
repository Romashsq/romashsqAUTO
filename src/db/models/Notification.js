import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  type:       { type: String, required: true }, // e.g. 'reminder_6m_2026-03'
  sentAt:     { type: Date, default: Date.now },
})

// Unique per user+type to prevent duplicates
notificationSchema.index({ telegramId: 1, type: 1 }, { unique: true })

export default mongoose.model('Notification', notificationSchema)
