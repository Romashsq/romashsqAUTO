import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_API_KEY, AUTOSERVICE } from '../config.js'

const client = CLAUDE_API_KEY ? new Anthropic({ apiKey: CLAUDE_API_KEY }) : null

const SYSTEM_PROMPT = `Ти — асистент автосервісу "${AUTOSERVICE.name}" в Одесі.
Адреса: ${AUTOSERVICE.address}
Телефон: ${AUTOSERVICE.phone}
Години роботи: ${AUTOSERVICE.hours}, субота та неділя — вихідний.

Послуги: Механіка, Поліровка, Мийка, Тюнінг, Детейлінг, Шиномонтаж, Діагностика.

Відповідай коротко і по суті. Якщо клієнт хоче записатись — запропонуй скористатись кнопкою "📋 Записатись" в меню.
Відповідай тією ж мовою, якою написав клієнт (українська або російська).
Не вигадуй ціни і терміни — направляй до оператора або пропонуй зателефонувати.`

/**
 * Ask Claude a question on behalf of a user.
 * Returns the response text, or null if Claude is unavailable.
 */
export async function askClaude(userMessage) {
  if (!client) return null
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    return msg.content[0]?.text || null
  } catch (e) {
    console.error('Claude API error:', e.message)
    return null
  }
}
