// app/api/chat/route.ts
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// 允许流式响应持续较长时间
export const maxDuration = 60;

const apiKey = process.env.YUNWU_API_KEY ?? process.env.OPENAI_API_KEY;

const openai = createOpenAI({
  apiKey: apiKey ?? '',
  baseURL: process.env.OPENAI_BASE_URL ?? 'https://yunwu.ai/v1',
  headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
});

const modelId = process.env.OPENAI_MODEL ?? 'gpt-4o';

function getErrorMessage(error: unknown) {
  if (error == null) return 'unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return JSON.stringify(error);
}

function normalizeMessages(messages: Array<{ role: string; content?: unknown; parts?: unknown }>) {
  console.log('messages: ', messages);
  return messages
    .map(message => {
      const text =
        typeof message.content === 'string'
          ? message.content
          : Array.isArray(message.parts)
            ? message.parts
                .map(part => {
                  if (typeof part === 'object' && part !== null && 'text' in part) {
                    const textPart = part as { text?: unknown };
                    return typeof textPart.text === 'string' ? textPart.text : '';
                  }
                  return '';
                })
                .join('')
            : '';

      if (!text) return null;

      if (message.role === 'system' || message.role === 'user' || message.role === 'assistant') {
        return { role: message.role, content: text } as const;
      }

      return null;
    })
    .filter((message): message is { role: 'system' | 'user' | 'assistant'; content: string } =>
      message != null,
    );
}

export async function POST(req: Request) {
  if (!apiKey) {
    return Response.json(
      {
        error: '缺少 API Key，请在 .env.local 中配置 YUNWU_API_KEY 或 OPENAI_API_KEY。',
      },
      { status: 500 },
    );
  }

  const body = await req.json();
  const messages = normalizeMessages(body.messages ?? []);
  console.log('messages1212: ', messages);

  if (messages.length === 0) {
    return Response.json(
      {
        error: '消息为空或格式不正确，请检查前端发送内容。',
      },
      { status: 400 },
    );
  }

  try {
    const result = await streamText({
      model: openai.chat(modelId),
      messages,
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse({
      onError: getErrorMessage,
    });
  } catch (error) {
    console.error('chat route error:', error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '聊天接口调用失败，请检查模型名或第三方服务配置。',
      },
      { status: 500 },
    );
  }
}
