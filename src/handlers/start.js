import { InlineKeyboard, Keyboard } from 'grammy'
import { AUTOSERVICE } from '../config.js'
import { t, getLang, setLangCache } from '../i18n/index.js'
import { updateClientLang } from '../db/index.js'

export function buildReplyKeyboard(lang = 'uk') {
  return new Keyboard()
    .text(t(lang, 'btnBook')).text(t(lang, 'btnPrice')).row()
    .text(t(lang, 'btnAddress')).text(t(lang, 'btnHours')).row()
    .text(t(lang, 'btnContact')).text(t(lang, 'btnMyBookings')).row()
    .text(t(lang, 'btnLang'))
    .resized()
    .persistent()
}

// Export UA keyboard as default for backward-compat (index.js imports it)
export const REPLY_KEYBOARD = buildReplyKeyboard('uk')

export const MAIN_MENU = new InlineKeyboard()
  .text('📋 Записатись', 'menu_booking').text('💰 Прайс', 'menu_price').row()
  .text('📍 Адреса', 'menu_address').text('🕐 Години роботи', 'menu_hours').row()
  .text('📞 Контакт', 'menu_contact').text('📝 Мої записи', 'menu_my_bookings')

export default (bot) => {
  bot.command('start', async (ctx) => {
    const lang = await getLang(ctx.from.id)
    const name = ctx.from.first_name || 'друже'
    await ctx.reply(
      t(lang, 'welcome', name, AUTOSERVICE.name),
      { parse_mode: 'Markdown', reply_markup: buildReplyKeyboard(lang) }
    )
  })

  bot.command('menu', async (ctx) => {
    const lang = await getLang(ctx.from.id)
    await ctx.reply(t(lang, 'menu'), {
      parse_mode: 'Markdown',
      reply_markup: buildReplyKeyboard(lang),
    })
  })

  bot.command('help', async (ctx) => {
    const lang = await getLang(ctx.from.id)
    await ctx.reply(t(lang, 'help'), {
      parse_mode: 'Markdown',
      reply_markup: MAIN_MENU,
    })
  })

  // ── Language selection ─────────────────────────────────────────────────
  const showLangPicker = async (ctx) => {
    const lang = await getLang(ctx.from.id)
    const opts = {
      reply_markup: new InlineKeyboard()
        .text('🇺🇦 Українська', 'lang_uk')
        .text('🇷🇺 Русский', 'lang_ru'),
    }
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(t(lang, 'langSelect'), opts)
    } else {
      await ctx.reply(t(lang, 'langSelect'), opts)
    }
  }

  bot.command('lang', showLangPicker)
  bot.hears(['🌐 Мова', '🌐 Язык'], showLangPicker)

  bot.callbackQuery('lang_uk', async (ctx) => {
    await ctx.answerCallbackQuery()
    await updateClientLang(ctx.from.id, 'uk')
    setLangCache(ctx.from.id, 'uk')
    await ctx.editMessageText('✅ Мову встановлено: Українська 🇺🇦')
    await ctx.reply(t('uk', 'menu'), {
      parse_mode: 'Markdown',
      reply_markup: buildReplyKeyboard('uk'),
    })
  })

  bot.callbackQuery('lang_ru', async (ctx) => {
    await ctx.answerCallbackQuery()
    await updateClientLang(ctx.from.id, 'ru')
    setLangCache(ctx.from.id, 'ru')
    await ctx.editMessageText('✅ Язык установлен: Русский 🇷🇺')
    await ctx.reply(t('ru', 'menu'), {
      parse_mode: 'Markdown',
      reply_markup: buildReplyKeyboard('ru'),
    })
  })

  bot.callbackQuery('menu_main', async (ctx) => {
    await ctx.answerCallbackQuery()
    const lang = await getLang(ctx.from.id)
    await ctx.editMessageText(t(lang, 'menu') + '\n\nОберіть потрібний розділ через кнопки нижче 👇', {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard(),
    })
  })
}
