import { getClient } from '../db/index.js'

// ── Ukrainian ──────────────────────────────────────────────────────────────
const ua = {
  // days & months for date formatting
  days: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  months: ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'],

  // start
  welcome: (name, service) =>
    `👋 Вітаємо в *${service}*, ${name}!\n\nМи знаходимось в Одесі та раді допомогти з обслуговуванням вашого авто 🚗\n\nОберіть потрібний розділ:`,
  menu: '🏠 *Головне меню*',
  help:
    '❓ *Допомога*\n\n📋 *Записатись* — запис на послугу крок за кроком\n💰 *Прайс* — ціни на всі послуги\n📍 *Адреса* — де ми знаходимось\n🕐 *Години роботи* — коли ми працюємо\n📞 *Контакт* — зв\'язатись з нами\n📝 *Мої записи* — ваші активні записи\n\nЩоб повернутись до меню — /menu',
  langSelect: '🌐 Оберіть мову / Выберите язык:',
  langSet: '✅ Мову встановлено: Українська 🇺🇦',
  useMenu: 'Скористайтесь кнопками меню або надішліть /start 👇',

  // booking
  selectService: '🔧 *Оберіть послугу:*',
  selectMaster: (service) => `✅ *${service}*\n\n👨‍🔧 *Оберіть майстра:*`,
  selectDate: (master) => `✅ *Майстер: ${master}*\n\n📅 *Оберіть дату:*`,
  noSlots: (date, master) => `😔 *На ${date} у майстра ${master} немає вільних місць.*\n\nОберіть іншу дату:`,
  selectTime: (date) => `✅ *Дата: ${date}*\n\n🕐 *Оберіть час:*`,
  enterPhone: (time) => `✅ *Час: ${time}*\n\n📞 *Введіть ваш номер телефону:*\nНаприклад: +38 050 123 45 67`,
  phoneInvalid: '❌ Невірний формат номера.\n\nВведіть номер у форматі: *+380 XX XXX XX XX*',
  confirmBooking: (service, master, date, time, phone) =>
    `📋 *Підтвердження запису:*\n\n🔧 Послуга: ${service}\n👨‍🔧 Майстер: ${master}\n📅 Дата: ${date}\n🕐 Час: ${time}\n📞 Телефон: ${phone}\n\nВсе вірно?`,
  bookingConfirmed: (service, master, date, time, address) =>
    `🎉 *Запис підтверджено!*\n\n${service}\n👨‍🔧 ${master}\n📅 ${date} о ${time}\n\n📍 ${address}\n\nДо зустрічі! 🙌`,
  cancelled: '❌ Скасовано.',

  // info
  address: (addr, mapLink) => `📍 *Наша адреса:*\n\n${addr}\n\n[Відкрити на Google Maps](${mapLink})`,
  hours: (hours) => `🕐 *Години роботи:*\n\n${hours}\n\nСубота та неділя — вихідний`,
  contact: (phone, addr) => `📞 *Контакти:*\n\nТелефон: ${phone}\nАдреса: ${addr}\n\nПишіть нам прямо тут — ми відповімо! 💬`,

  // my bookings
  noBookings: '📝 *Мої записи*\n\nУ вас поки немає активних записів.\n\nЗапишіться на послугу прямо зараз! 🚗',
  yourBookings: '📝 *Ваші записи:*\n\n',
  cancelConfirm: '❓ *Підтвердіть скасування*\n\nВи впевнені що хочете скасувати цей запис?',
  cancelDone: '✅ *Запис скасовано*\n\nЯкщо бажаєте записатись знову — натисніть кнопку нижче.',

  // price
  priceList: '💰 *Прайс-лист*\n\nОберіть послугу для перегляду цін:',

  // buttons
  btnBook: '📋 Записатись',
  btnPrice: '💰 Прайс',
  btnAddress: '📍 Адреса',
  btnHours: '🕐 Години роботи',
  btnContact: '📞 Контакт',
  btnMyBookings: '📝 Мої записи',
  btnCancel: '❌ Скасувати',
  btnConfirm: '✅ Підтвердити',
  btnBack: '← Назад',
  btnMainMenu: '🏠 Головне меню',
  btnCancelYes: '✅ Так, скасувати',
  btnNewBooking: '📋 Новий запис',
  btnBackToPrice: '← Назад до прайсу',
  btnLang: '🌐 Мова',
}

// ── Russian ────────────────────────────────────────────────────────────────
const ru = {
  days: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  months: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],

  welcome: (name, service) =>
    `👋 Добро пожаловать в *${service}*, ${name}!\n\nМы находимся в Одессе и рады помочь с обслуживанием вашего авто 🚗\n\nВыберите нужный раздел:`,
  menu: '🏠 *Главное меню*',
  help:
    '❓ *Помощь*\n\n📋 *Записаться* — запись на услугу шаг за шагом\n💰 *Прайс* — цены на все услуги\n📍 *Адрес* — где мы находимся\n🕐 *Часы работы* — когда мы работаем\n📞 *Контакт* — связаться с нами\n📝 *Мои записи* — ваши активные записи\n\nЧтобы вернуться в меню — /menu',
  langSelect: '🌐 Оберіть мову / Выберите язык:',
  langSet: '✅ Язык установлен: Русский 🇷🇺',
  useMenu: 'Воспользуйтесь кнопками меню или отправьте /start 👇',

  selectService: '🔧 *Выберите услугу:*',
  selectMaster: (service) => `✅ *${service}*\n\n👨‍🔧 *Выберите мастера:*`,
  selectDate: (master) => `✅ *Мастер: ${master}*\n\n📅 *Выберите дату:*`,
  noSlots: (date, master) => `😔 *На ${date} у мастера ${master} нет свободных мест.*\n\nВыберите другую дату:`,
  selectTime: (date) => `✅ *Дата: ${date}*\n\n🕐 *Выберите время:*`,
  enterPhone: (time) => `✅ *Время: ${time}*\n\n📞 *Введите ваш номер телефона:*\nНапример: +38 050 123 45 67`,
  phoneInvalid: '❌ Неверный формат номера.\n\nВведите номер в формате: *+380 XX XXX XX XX*',
  confirmBooking: (service, master, date, time, phone) =>
    `📋 *Подтверждение записи:*\n\n🔧 Услуга: ${service}\n👨‍🔧 Мастер: ${master}\n📅 Дата: ${date}\n🕐 Время: ${time}\n📞 Телефон: ${phone}\n\nВсё верно?`,
  bookingConfirmed: (service, master, date, time, address) =>
    `🎉 *Запись подтверждена!*\n\n${service}\n👨‍🔧 ${master}\n📅 ${date} в ${time}\n\n📍 ${address}\n\nДо встречи! 🙌`,
  cancelled: '❌ Отменено.',

  address: (addr, mapLink) => `📍 *Наш адрес:*\n\n${addr}\n\n[Открыть в Google Maps](${mapLink})`,
  hours: (hours) => `🕐 *Часы работы:*\n\n${hours}\n\nСуббота и воскресенье — выходной`,
  contact: (phone, addr) => `📞 *Контакты:*\n\nТелефон: ${phone}\nАдрес: ${addr}\n\nПишите нам прямо здесь — мы ответим! 💬`,

  noBookings: '📝 *Мои записи*\n\nУ вас пока нет активных записей.\n\nЗапишитесь на услугу прямо сейчас! 🚗',
  yourBookings: '📝 *Ваши записи:*\n\n',
  cancelConfirm: '❓ *Подтвердите отмену*\n\nВы уверены, что хотите отменить эту запись?',
  cancelDone: '✅ *Запись отменена*\n\nЕсли хотите записаться снова — нажмите кнопку ниже.',

  priceList: '💰 *Прайс-лист*\n\nВыберите услугу для просмотра цен:',

  btnBook: '📋 Записаться',
  btnPrice: '💰 Прайс',
  btnAddress: '📍 Адрес',
  btnHours: '🕐 Часы работы',
  btnContact: '📞 Контакт',
  btnMyBookings: '📝 Мои записи',
  btnCancel: '❌ Отменить',
  btnConfirm: '✅ Подтвердить',
  btnBack: '← Назад',
  btnMainMenu: '🏠 Главное меню',
  btnCancelYes: '✅ Да, отменить',
  btnNewBooking: '📋 Новая запись',
  btnBackToPrice: '← Назад к прайсу',
  btnLang: '🌐 Язык',
}

const translations = { uk: ua, ru }

/** Translate a key for the given lang. Supports both string and function values. */
export function t(lang, key, ...args) {
  const strings = translations[lang] || translations.uk
  const val = strings[key] ?? translations.uk[key]
  return typeof val === 'function' ? val(...args) : (val ?? key)
}

/** Format a date object to localised short string, e.g. "Пн, 24 бер" */
export function formatDate(date, lang = 'uk') {
  const strings = translations[lang] || translations.uk
  return `${strings.days[date.getDay()]}, ${date.getDate()} ${strings.months[date.getMonth()]}`
}

/** Format a YYYY-MM-DD string to localised short string */
export function formatDateStr(dateStr, lang = 'uk') {
  const [y, m, d] = dateStr.split('-')
  return formatDate(new Date(Number(y), Number(m) - 1, Number(d)), lang)
}

// ── Lang cache (avoids DB hit on every message) ────────────────────────────
const langCache = new Map()

export async function getLang(userId) {
  const id = String(userId)
  if (langCache.has(id)) return langCache.get(id)
  const client = await getClient(id)
  const lang = client?.lang || 'uk'
  langCache.set(id, lang)
  return lang
}

export function setLangCache(userId, lang) {
  langCache.set(String(userId), lang)
}
