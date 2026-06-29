import OpenAI from 'openai'
import { getApiKey, getApiBaseUrl, getModel } from './config'

let client: OpenAI | null = null

function resolveModel(): string {
  return getModel() || 'gpt-4o-mini'
}

function getClient(): OpenAI {
  if (!client) {
    const apiKey = getApiKey()
    if (!apiKey) {
      throw new Error('请在设置中配置 API Key')
    }

    const baseURL = getApiBaseUrl() || undefined

    client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {})
    })
  }
  return client
}

export function resetClient(): void {
  client = null
}

export async function generateTitle(content: string): Promise<string> {
  const openai = getClient()

  const response = await openai.chat.completions.create({
    model: resolveModel(),
    messages: [
      {
        role: 'system',
        content:
          '你是一个笔记助手。根据笔记内容生成一个简洁的标题（不超过20个字）。只返回标题本身，不要多余的解释。'
      },
      {
        role: 'user',
        content: content.slice(0, 2000)
      }
    ],
    max_tokens: 50,
    temperature: 0.3
  })

  return response.choices[0]?.message?.content?.trim() || '未命名笔记'
}

export async function analyzeNote(content: string): Promise<{
  title: string
  category: string
  summary: string
}> {
  const openai = getClient()

  const response = await openai.chat.completions.create({
    model: resolveModel(),
    messages: [
      {
        role: 'system',
        content:
          '你是一个笔记整理助手。分析笔记内容，返回JSON格式的结果。\n' +
          '1. title: 简洁的标题（不超过20个字）\n' +
          '2. category: 从以下分类中选择一个最合适的：工作、技术、学习、生活、灵感、其他\n' +
          '3. summary: 一句话概括核心内容（不超过50个字）\n' +
          '只返回JSON，不要多余的解释。格式：{"title":"...","category":"...","summary":"..."}'
      },
      {
        role: 'user',
        content: content.slice(0, 3000)
      }
    ],
    max_tokens: 200,
    temperature: 0.3
  })

  const text = response.choices[0]?.message?.content?.trim() || ''

  try {
    const parsed = JSON.parse(text)
    return {
      title: parsed.title || '未命名笔记',
      category: ['工作', '技术', '学习', '生活', '灵感', '其他'].includes(parsed.category)
        ? parsed.category
        : '其他',
      summary: parsed.summary || ''
    }
  } catch {
    return { title: '未命名笔记', category: '其他', summary: '' }
  }
}

export async function summarizeContent(content: string): Promise<string> {
  const openai = getClient()

  const response = await openai.chat.completions.create({
    model: resolveModel(),
    messages: [
      {
        role: 'system',
        content: '你是一个笔记助手。请用1-2句话概括以下笔记内容，保持核心信息。'
      },
      {
        role: 'user',
        content: content.slice(0, 4000)
      }
    ],
    max_tokens: 150,
    temperature: 0.3
  })

  return response.choices[0]?.message?.content?.trim() || ''
}
