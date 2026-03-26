export type ChatProviderName = "openrouter" | "cerebras" | "groq";

export interface ChatCompletionInput {
  message: string;
  model: string;
}

export type ChatTextStream = AsyncIterable<string>;

export interface RoundRobinChatInput {
  message: string;
  requestedModel?: string;
}

export interface RoutedChatStream {
  provider: ChatProviderName;
  model: string;
  stream: ChatTextStream;
}
