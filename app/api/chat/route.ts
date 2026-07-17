// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// 允许流式响应持续较长时间
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o'), // 可以轻松换成其他模型
    messages,
  });

  return result.toDataStreamResponse();
}