import mongoose from 'mongoose'

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB connected')
  } catch (e) {
    console.error('❌ MongoDB connection error:', e.message)
    process.exit(1)
  }
}
