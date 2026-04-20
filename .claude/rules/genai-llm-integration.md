---
description: GenAI/LLM integration rules — ALWAYS ACTIVE. Only use Vercel AI SDK (ai + @ai-sdk/openai) with OpenAI-compatible endpoint. Never use @anthropic-ai/sdk, openai, @langchain/*, or any other LLM client directly.
---

# GenAI / LLM Integration

All generative AI features must use the [Vercel AI SDK](https://ai-sdk.dev/) with the OpenAI-compatible provider.

- **Package**: `ai` (core) + `@ai-sdk/openai` (provider) + `@ai-sdk/react` (hooks)
- **Environment variables**: `OPENAI_BASE_URL` (endpoint URL) and `OPENAI_API_KEY` (API key). These are already configured in the deployment environment — do not hardcode values.
- **Provider setup**: Use `createOpenAI` from `@ai-sdk/openai` pointed at the compatible endpoint:
  ```ts
  import { createOpenAI } from "@ai-sdk/openai";

  const provider = createOpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  });
  ```
- **Streaming**: Prefer `streamText` / `streamObject` over `generateText` / `generateObject` for user-facing responses.
- **Server-side only**: All LLM calls must run in server components or route handlers (`src/app/api/...`). Never call LLM APIs from client components.
- **No other SDKs**: Do not use `openai`, `@anthropic-ai/sdk`, `@langchain/*`, or any other LLM client library directly. The AI SDK with the OpenAI-compatible provider is the only approved integration path.

## Forbidden packages — do not install or import

- `@anthropic-ai/sdk`
- `openai`
- `@langchain/*`
- `ai/react` (old import path — use `@ai-sdk/react` instead)

## Client-side hook API (Vercel AI SDK v4)

Use `useChat` from `@ai-sdk/react` with the transport pattern — the older `api`, `handleSubmit`, `input`, and `isLoading` options no longer exist:

```ts
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isTextUIPart } from "ai"

const transport = new DefaultChatTransport({ api: "/api/chat" })
const { messages, sendMessage, status } = useChat({ transport })

// Loading state — check status string, not isLoading boolean
const isLoading = status === "streaming" || status === "submitted"

// Sending a message
sendMessage({ text: "user input here" })

// Reading message content — messages use a parts[] array, not content string
const text = message.parts.filter(isTextUIPart).map((p) => p.text).join("")
```

## Server-side route (Vercel AI SDK v4)

```ts
import { streamText, convertToModelMessages } from "ai"

export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = streamText({
    model: provider("model-name"),
    // convertToModelMessages returns a Promise — always await it
    messages: await convertToModelMessages(messages),
  })
  return result.toUIMessageStreamResponse()
}
```
