import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  name:       { type: String, default: '' },
  phone:      { type: String, default: '' },
  service:    { type: String, required: true },
  master:     { type: String, required: true },
  date:       { type: String, required: true }, // YYYY-MM-DD
  time:       { type: String, required: true }, // HH:MM
  car:        { type: String, default: '' },
  status:     {
    type: String,
    enum: ['підтверджено', 'в роботі', 'готово', 'завершено', 'скасовано'],
    default: 'підтверджено',
  },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
})

export default mongoose.model('Booking', bookingSchema)
