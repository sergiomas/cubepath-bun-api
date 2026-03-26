import { env } from "../config/env";
import type { ChatCompletionInput, ChatTextStream } from "./chat.types";
import { createOpenAICompatibleChatStream } from "./openai-compatible";

const GROQ_CHAT_COMPLETIONS_ENDPOINT =
  "https://api.groq.com/openai/v1/chat/completions";

export function createGroqChatStream(
  input: ChatCompletionInput,
): Promise<ChatTextStream> {
  return createOpenAICompatibleChatStream({
    providerName: "groq",
    apiKey: env.groqApiKey,
    endpoint: GROQ_CHAT_COMPLETIONS_ENDPOINT,
    request: input,
  });
}
