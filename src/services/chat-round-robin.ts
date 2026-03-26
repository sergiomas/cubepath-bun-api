import { env } from "../config/env";
import { createCerebrasChatStream } from "./cerebras";
import { createGroqChatStream } from "./groq";
import { createOpenRouterChatStream } from "./openrouter";
import type {
  ChatCompletionInput,
  ChatProviderName,
  ChatTextStream,
  RoundRobinChatInput,
  RoutedChatStream,
} from "./chat.types";

interface ChatProviderConfig {
  name: ChatProviderName;
  isEnabled: () => boolean;
  getDefaultModel: () => string;
  createStream: (input: ChatCompletionInput) => Promise<ChatTextStream>;
}

const providerConfigs: ChatProviderConfig[] = [
  {
    name: "openrouter",
    isEnabled: () => Boolean(env.openRouterApiKey),
    getDefaultModel: () => env.openRouterModel,
    createStream: createOpenRouterChatStream,
  },
  {
    name: "cerebras",
    isEnabled: () => Boolean(env.cerebrasApiKey),
    getDefaultModel: () => env.cerebrasModel,
    createStream: createCerebrasChatStream,
  },
  {
    name: "groq",
    isEnabled: () => Boolean(env.groqApiKey),
    getDefaultModel: () => env.groqModel,
    createStream: createGroqChatStream,
  },
];

let nextProviderIndex = 0;

function getEnabledProviderConfigs(): ChatProviderConfig[] {
  const enabledProviders = providerConfigs.filter((providerConfig) =>
    providerConfig.isEnabled(),
  );

  console.log(
    "[providers] Proveedores habilitados:",
    enabledProviders.map((providerConfig) => providerConfig.name),
  );

  return enabledProviders;
}

function selectRoundRobinProvider(
  enabledProviders: ChatProviderConfig[],
): ChatProviderConfig {
  const selectedIndex = nextProviderIndex % enabledProviders.length;
  const selectedProvider = enabledProviders[selectedIndex];

  if (!selectedProvider) {
    throw new Error("No se pudo seleccionar proveedor para round robin.");
  }

  nextProviderIndex = (nextProviderIndex + 1) % enabledProviders.length;

  console.log("[providers] Seleccion round robin", {
    selectedProvider: selectedProvider.name,
    selectedIndex,
    nextProviderIndex,
  });

  return selectedProvider;
}

export async function createRoundRobinChatStream(
  input: RoundRobinChatInput,
): Promise<RoutedChatStream> {
  const enabledProviders = getEnabledProviderConfigs();

  if (enabledProviders.length === 0) {
    throw new Error(
      "No hay proveedores configurados. Define OPENROUTER_API_KEY, CEREBRAS_API_KEY o GROQ_API_KEY.",
    );
  }

  const selectedProvider = selectRoundRobinProvider(enabledProviders);
  const requestedModel = input.requestedModel?.trim();

  const modelToUse = requestedModel
    ? requestedModel
    : selectedProvider.getDefaultModel();

  console.log("[providers] Modelo seleccionado", {
    provider: selectedProvider.name,
    modelToUse,
    usedRequestedModel: Boolean(requestedModel),
  });

  const stream = await selectedProvider.createStream({
    message: input.message,
    model: modelToUse,
  });

  return {
    provider: selectedProvider.name,
    model: modelToUse,
    stream,
  };
}
