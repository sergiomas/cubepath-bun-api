const DEFAULT_PORT = 3000;

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

console.log(
  `[env] OPENROUTER_API_KEY configurada: ${Boolean(openRouterApiKey)}`,
);

export const env = {
  port: parsePort(process.env.PORT),
  openRouterApiKey,
};
