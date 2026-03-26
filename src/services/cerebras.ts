import { env } from "../config/env";
import type { ChatCompletionInput, ChatTextStream } from "./chat.types";
import { createOpenAICompatibleChatStream } from "./openai-compatible";

const CEREBRAS_CHAT_COMPLETIONS_ENDPOINT =
  "https://api.cerebras.ai/v1/chat/completions";

export function createCerebrasChatStream(
  input: ChatCompletionInput,
): Promise<ChatTextStream> {
  return createOpenAICompatibleChatStream({
    providerName: "cerebras",
    apiKey: env.cerebrasApiKey,
    endpoint: CEREBRAS_CHAT_COMPLETIONS_ENDPOINT,
    request: input,
  });
}
