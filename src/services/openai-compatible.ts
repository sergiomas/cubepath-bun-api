import type { ChatCompletionInput, ChatTextStream } from "./chat.types";

interface OpenAICompatibleStreamingChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

interface CreateOpenAICompatibleChatStreamInput {
  providerName: "cerebras" | "groq";
  apiKey: string | undefined;
  endpoint: string;
  request: ChatCompletionInput;
}

function parseSsePayload(
  providerName: string,
  payload: string,
): { done: boolean; content: string | null } {
  if (payload === "[DONE]") {
    return { done: true, content: null };
  }

  try {
    const parsedChunk = JSON.parse(payload) as OpenAICompatibleStreamingChunk;
    const content = parsedChunk.choices?.[0]?.delta?.content;

    if (typeof content === "string" && content.length > 0) {
      return { done: false, content };
    }

    return { done: false, content: null };
  } catch (error) {
    console.warn(`[${providerName}] No se pudo parsear chunk SSE`, {
      error,
      payload,
    });

    return { done: false, content: null };
  }
}

async function* parseSseStream(
  providerName: string,
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let networkChunkCount = 0;
  let textChunkCount = 0;
  let doneSignalReceived = false;

  try {
    while (!doneSignalReceived) {
      const { done, value } = await reader.read();

      if (done) {
        buffer += decoder.decode();
        break;
      }

      networkChunkCount += 1;
      buffer += decoder.decode(value, { stream: true });

      let lineBreakIndex = buffer.indexOf("\n");

      while (lineBreakIndex !== -1) {
        const rawLine = buffer.slice(0, lineBreakIndex);
        buffer = buffer.slice(lineBreakIndex + 1);

        const line = rawLine.trim();

        if (!line || !line.startsWith("data:")) {
          lineBreakIndex = buffer.indexOf("\n");
          continue;
        }

        const payload = line.slice(5).trim();

        if (!payload) {
          lineBreakIndex = buffer.indexOf("\n");
          continue;
        }

        const parsed = parseSsePayload(providerName, payload);

        if (parsed.done) {
          doneSignalReceived = true;
          console.log(`[${providerName}] Recibido marcador [DONE]`);
          break;
        }

        if (parsed.content) {
          textChunkCount += 1;
          yield parsed.content;
        }

        lineBreakIndex = buffer.indexOf("\n");
      }
    }

    const pendingLine = buffer.trim();

    if (!doneSignalReceived && pendingLine && pendingLine.startsWith("data:")) {
      const payload = pendingLine.slice(5).trim();
      const parsed = parseSsePayload(providerName, payload);

      if (!parsed.done && parsed.content) {
        textChunkCount += 1;
        yield parsed.content;
      }
    }

    console.log(`[${providerName}] Parsing SSE finalizado`, {
      networkChunkCount,
      textChunkCount,
      doneSignalReceived,
    });
  } finally {
    reader.releaseLock();
  }
}

export async function createOpenAICompatibleChatStream(
  input: CreateOpenAICompatibleChatStreamInput,
): Promise<ChatTextStream> {
  console.log(`[${input.providerName}] Preparando peticion OpenAI-compatible`, {
    endpoint: input.endpoint,
    model: input.request.model,
    messageLength: input.request.message.length,
  });

  if (!input.apiKey) {
    throw new Error(`[${input.providerName}] Falta API key en el entorno.`);
  }

  const response = await fetch(input.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.request.model,
      messages: [
        {
          role: "user",
          content: input.request.message,
        },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `[${input.providerName}] Error HTTP ${response.status}: ${errorText}`,
    );
  }

  if (!response.body) {
    throw new Error(
      `[${input.providerName}] El proveedor no devolvio body en streaming.`,
    );
  }

  console.log(`[${input.providerName}] Stream HTTP recibido correctamente`);

  return parseSseStream(input.providerName, response.body);
}
