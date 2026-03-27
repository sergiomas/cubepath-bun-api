const DEFAULT_PORT = 3000;
const DEFAULT_OPENROUTER_MODEL = "openrouter/free";
const DEFAULT_CEREBRAS_MODEL = "llama3.1-8b";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

function parseModel(
  value: string | undefined,
  defaultModel: string,
  envVariableName: string,
): string {
  if (value && value.trim().length > 0) {
    console.log(`[env] ${envVariableName} configurada: ${value}`);
    return value;
  }

  console.warn(
    `[env] ${envVariableName} no configurada. Se usara ${defaultModel}.`,
  );

  return defaultModel;
}

function parsePort(value: string | undefined): number {
  console.log(`[env] Valor recibido para PORT: ${value ?? "(undefined)"}`);

  const parsedValue = Number(value);

  if (Number.isInteger(parsedValue) && parsedValue > 0) {
    console.log(`[env] PORT válida detectada: ${parsedValue}`);
    return parsedValue;
  }

  console.warn(`[env] PORT no válida. Se usará ${DEFAULT_PORT}.`);
  return DEFAULT_PORT;
}

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const databaseUrl = process.env.DATABASE_URL;
const openRouterModel = parseModel(
  process.env.OPENROUTER_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  "OPENROUTER_MODEL",
);
const cerebrasModel = parseModel(
  process.env.CEREBRAS_MODEL,
  DEFAULT_CEREBRAS_MODEL,
  "CEREBRAS_MODEL",
);
const groqModel = parseModel(
  process.env.GROQ_MODEL,
  DEFAULT_GROQ_MODEL,
  "GROQ_MODEL",
);

console.log(
  `[env] OPENROUTER_API_KEY configurada: ${Boolean(openRouterApiKey)}`,
);
console.log(`[env] CEREBRAS_API_KEY configurada: ${Boolean(cerebrasApiKey)}`);
console.log(`[env] GROQ_API_KEY configurada: ${Boolean(groqApiKey)}`);
console.log(`[env] DATABASE_URL configurada: ${Boolean(databaseUrl)}`);

export const env = {
  port: parsePort(process.env.PORT),
  openRouterApiKey,
  cerebrasApiKey,
  groqApiKey,
  databaseUrl,
  openRouterModel,
  cerebrasModel,
  groqModel,
};
