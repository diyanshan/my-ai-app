'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';

type QuickPrompt = {
  label: string;
  prompt: string;
};

const quickPrompts: QuickPrompt[] = [
  { label: '写需求文档', prompt: '帮我写一份前端页面改版的需求文档。' },
  { label: '整理思路', prompt: '请帮我把这个功能的实现思路整理成步骤。' },
  { label: '代码评审', prompt: '请帮我检查这段代码可能存在的问题。' },
];

export default function ChatPage() {
  const [draft, setDraft] = useState('');
  const [submitError, setSubmitError] = useState('');
  const chat = useChat({
    transport: useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || chat.status === 'streaming' || chat.status === 'submitted') {
      return;
    }

    setDraft('');
    setSubmitError('');
    try {
      await chat.sendMessage({ text: message });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '发送失败，请检查后端配置。');
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (chat.status === 'streaming' || chat.status === 'submitted') {
      return;
    }

    setDraft('');
    setSubmitError('');
    try {
      await chat.sendMessage({ text: prompt });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '发送失败，请检查后端配置。');
    }
  };

  const isBusy = chat.status === 'streaming' || chat.status === 'submitted';

  const renderMessageText = (message: (typeof chat.messages)[number]) =>
    message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('') || '（无文本内容）';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_40%),linear-gradient(180deg,#081120_0%,#020617_100%)] px-4 py-10 text-slate-100">
      <div className="flex w-full max-w-5xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl md:p-8">
        <header className="flex flex-col gap-3 border-b border-white/10 pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300/80">AI 助手</p>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">欢迎来到智能聊天工作台</h1>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            你可以直接输入问题，也可以先点一个快捷提示。当前页面已接入 `/api/chat`，可直接向后端流式获取回答。
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="flex min-h-[520px] flex-col rounded-2xl border border-white/10 bg-slate-950/60">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-slate-300">
              <span>对话区</span>
              <span className={isBusy ? 'text-amber-300' : 'text-emerald-300'}>
                {isBusy ? '正在生成中...' : '准备就绪'}
              </span>
            </div>

            {submitError ? (
              <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {submitError}
              </div>
            ) : null}

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
              {chat.messages.length === 0 ? (
                <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 text-center text-sm text-slate-400">
                  还没有消息，先试试下面的快捷问题，或者直接输入你的需求。
                </div>
              ) : (
                chat.messages.map(message => (
                  <div
                    key={message.id}
                    className={[
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg',
                        message.role === 'user'
                          ? 'bg-sky-500 text-white'
                          : 'bg-white/10 text-slate-100 ring-1 ring-white/10',
                      ].join(' ')}
                    >
                      <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/70">
                        {message.role === 'user' ? '你' : '助手'}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{renderMessageText(message)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
              <label className="mb-2 block text-sm text-slate-300" htmlFor="chat-input">
                输入你的问题
              </label>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  id="chat-input"
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  placeholder="例如：帮我把这个页面改成更适合移动端的版本"
                  className="min-h-12 flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-4 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-sky-400/60"
                />
                <button
                  type="submit"
                  disabled={isBusy || draft.trim().length === 0}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-500 px-5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBusy ? '发送中...' : '发送'}
                </button>
              </div>
            </form>
          </div>

          <aside className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div>
              <h2 className="text-lg font-semibold text-white">快捷提示</h2>
              <p className="mt-1 text-sm text-slate-400">点击即可快速发起一轮对话。</p>
            </div>

            <div className="flex flex-col gap-3">
              {quickPrompts.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleQuickPrompt(item.prompt)}
                  disabled={isBusy}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-left transition hover:border-sky-400/50 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-400">{item.prompt}</div>
                </button>
              ))}
            </div>

            <div className="mt-auto rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm leading-6 text-sky-100">
              <p className="font-medium text-sky-200">使用说明</p>
              <p className="mt-2 text-slate-300">
                当前组件使用 `useChat` 直接连接 `app/api/chat/route.ts`，适合后续继续扩展历史记录、身份认证和会话管理。
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
