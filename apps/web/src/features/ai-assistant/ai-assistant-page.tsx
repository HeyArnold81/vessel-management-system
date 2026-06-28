'use client';

import { type FormEvent, useState } from 'react';

import type { AiAssistantMessage, AiAssistantResponse } from '@vms/shared';

import { ApiClientError } from '@/lib/api/http';

import { askAiAssistant } from './api';

type TranscriptItem =
  | { readonly id: string; readonly type: 'user'; readonly content: string }
  | { readonly id: string; readonly type: 'assistant'; readonly response: AiAssistantResponse };

const examplePrompts = [
  'Summarise the current operational picture.',
  'Which billing events need attention?',
  'Show movement and service exceptions.',
  'Why might ERP export be blocked?',
] as const;

export function AiAssistantPage() {
  const [question, setQuestion] = useState<string>(examplePrompts[0]);
  const [transcript, setTranscript] = useState<readonly TranscriptItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitQuestion(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setTranscript((current) => [
      ...current,
      { id: crypto.randomUUID(), type: 'user', content: trimmedQuestion },
    ]);

    try {
      const response = await askAiAssistant({
        question: trimmedQuestion,
        conversation: toConversation(transcript),
      });
      setTranscript((current) => [
        ...current,
        { id: crypto.randomUUID(), type: 'assistant', response },
      ]);
      setQuestion('');
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to get an assistant response.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="grid gap-4 border-b border-line pb-5 xl:grid-cols-[1fr_22rem] xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">Embedded AI</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">AI Operations Assistant</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
              Ask read-only questions about operations, services, billing readiness, and exception
              trends. Answers are grounded in source records and audited.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
            <p className="text-sm font-semibold text-ink">Safety controls</p>
            <ul className="mt-2 grid gap-1 text-sm text-steel">
              <li>Read-only responses</li>
              <li>Bounded source retrieval</li>
              <li>Audit metadata recorded</li>
              <li>Provider can swap to Azure OpenAI later</li>
            </ul>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <div className="grid min-h-[34rem] content-between gap-4 rounded-lg border border-line bg-panel p-5 shadow-panel">
            <div className="grid gap-4">
              {transcript.length === 0 ? (
                <div className="rounded-md border border-dashed border-line bg-surface p-6">
                  <p className="text-base font-semibold text-ink">
                    Start with an operational question.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-steel">
                    The assistant will cite matching records and explain any limits in the answer.
                  </p>
                </div>
              ) : null}

              {transcript.map((item) =>
                item.type === 'user' ? (
                  <UserBubble key={item.id} content={item.content} />
                ) : (
                  <AssistantBubble key={item.id} response={item.response} />
                ),
              )}
            </div>

            <form onSubmit={submitQuestion} className="grid gap-3 border-t border-line pt-4">
              <label className="grid gap-2 text-sm font-medium text-ink">
                <span>Question</span>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTranscript([])}
                  className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || question.trim().length < 3}
                  className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Thinking...' : 'Ask assistant'}
                </button>
              </div>
            </form>
          </div>

          <aside className="grid content-start gap-4">
            <section className="rounded-lg border border-line bg-panel p-4 shadow-panel">
              <h2 className="text-base font-semibold text-ink">Prompt examples</h2>
              <div className="mt-3 grid gap-2">
                {examplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setQuestion(prompt)}
                    className="rounded-md border border-line bg-surface px-3 py-2 text-left text-sm font-medium text-ink hover:border-harbor"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-panel p-4 shadow-panel">
              <h2 className="text-base font-semibold text-ink">MVP boundaries</h2>
              <p className="mt-2 text-sm leading-6 text-steel">
                The assistant can explain, summarise, and highlight records. It cannot approve,
                export, create, update, or delete operational data.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function UserBubble({ content }: Readonly<{ content: string }>) {
  return (
    <article className="ml-auto max-w-3xl rounded-lg bg-ink px-4 py-3 text-sm leading-6 text-white">
      {content}
    </article>
  );
}

function AssistantBubble({ response }: Readonly<{ response: AiAssistantResponse }>) {
  return (
    <article className="max-w-4xl rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-line bg-panel px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-steel">
          {response.intent.replaceAll('_', ' ')}
        </span>
        <span className="text-xs text-steel">
          {new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(response.generatedAt))}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink">{response.answer}</p>

      {response.sources.length > 0 ? (
        <div className="mt-4 grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-steel">Sources</p>
          <div className="flex flex-wrap gap-2">
            {response.sources.map((source) => (
              <a
                key={`${source.type}-${source.id}`}
                href={source.href}
                className="rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-ink hover:border-harbor"
              >
                {source.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-1 text-xs text-steel">
        {response.limitations.map((limitation) => (
          <p key={limitation}>{limitation}</p>
        ))}
      </div>
    </article>
  );
}

function toConversation(transcript: readonly TranscriptItem[]): readonly AiAssistantMessage[] {
  return transcript
    .slice(-6)
    .map((item) =>
      item.type === 'user'
        ? { role: 'user', content: item.content }
        : { role: 'assistant', content: item.response.answer },
    );
}
