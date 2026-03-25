import { OpenRouter } from "@openrouter/sdk";
import { env } from "../config/env";

export interface ChatCompletionInput {
  message: string;
  model: string;
}

function createClient(): OpenRouter {
  console.log("[openrouter] Creando cliente de OpenRouter...");

  if (!env.openRouterApiKey) {
    console.error("[openrouter] OPENROUTER_API_KEY no configurada");
    throw new Error("Falta OPENROUTER_API_KEY en el entorno.");
  }

  console.log("[openrouter] OPENROUTER_API_KEY detectada");

  return new OpenRouter({
    apiKey: env.openRouterApiKey,
  });
}

export async function createChatStream(input: ChatCompletionInput) {
  console.log("[openrouter] Iniciando sendChatMessage", {
    model: input.model,
    messageLength: input.message.length,
  });

  const openrouter = createClient();

  console.log("[openrouter] Enviando peticion streaming a OpenRouter...");

  const stream = await openrouter.chat.send({
    chatGenerationParams: {
      model: input.model,
      messages: [
        {
          role: "user",
          content: input.message,
        },
      ],
      stream: true,
    },
  });

  console.log("[openrouter] Stream recibido y listo para ser consumido");

  return stream;
}
