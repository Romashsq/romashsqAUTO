const userState = new Map()

export const getState = (userId) => userState.get(String(userId)) ?? {}
export const setState = (userId, data) =>
  userState.set(String(userId), { ...getState(userId), ...data })
export const clearState = (userId) => userState.delete(String(userId))
