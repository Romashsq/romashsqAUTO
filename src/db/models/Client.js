import mongoose from 'mongoose'

const clientSchema = new mongoose.Schema({
  telegramId:   { type: String, required: true, unique: true },
  name:         { type: String, default: '' },
  username:     { type: String, default: '' },
  phone:        { type: String, default: '' },
  car:          { type: String, default: '' },
  carYear:      { type: String, default: '' },
  lang:         { type: String, default: 'uk' },
  totalVisits:  { type: Number, default: 0 },
  lastVisit:    { type: Date, default: null },
  createdAt:    { type: Date, default: Date.now },
})

export default mongoose.model('Client', clientSchema)
