import mongoose from 'mongoose'

const historySchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  service:    { type: String, required: true },
  master:     { type: String, required: true },
  date:       { type: String, required: true },
  mileage:    { type: String, default: '' },
  notes:      { type: String, default: '' },
  completedAt:{ type: Date, default: Date.now },
})

export default mongoose.model('History', historySchema)
