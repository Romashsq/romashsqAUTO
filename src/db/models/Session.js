import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  data: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now, expires: 86400 }, // auto-delete after 24h
})

export default mongoose.model('Session', sessionSchema)
