import Session from './db/models/Session.js'

export async function getState(userId) {
  const session = await Session.findOne({ userId: String(userId) })
  return session?.data ?? {}
}

export async function setState(userId, data) {
  const current = await getState(userId)
  await Session.findOneAndUpdate(
    { userId: String(userId) },
    { data: { ...current, ...data }, updatedAt: new Date() },
    { upsert: true }
  )
}

export async function clearState(userId) {
  await Session.deleteOne({ userId: String(userId) })
}
