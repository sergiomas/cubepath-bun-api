const landingHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CubePath Bun API</title>
    <style>
      :root {
        --bg: #f6f6f3;
        --surface: #ffffff;
        --text: #121212;
        --muted: #646464;
        --line: #dfdfdf;
        --accent: #131313;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: var(--bg);
        color: var(--text);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }

      main {
        width: min(760px, 100%);
        padding: 24px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: var(--surface);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.04);
      }

      h1 {
        margin: 0 0 8px;
        font-size: 1.55rem;
        letter-spacing: -0.02em;
      }

      p {
        margin: 0 0 16px;
        color: var(--muted);
      }

      label {
        display: block;
        margin: 12px 0 6px;
        font-size: 0.9rem;
        color: var(--muted);
      }

      textarea,
      input {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 10px 12px;
        font: inherit;
        color: var(--text);
        background: #fff;
      }

      textarea {
        min-height: 120px;
        resize: vertical;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
      }

      button {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        font: inherit;
        cursor: pointer;
      }

      button.primary {
        background: var(--accent);
        color: #fff;
      }

      button.secondary {
        background: #ececec;
        color: #1f1f1f;
      }

      .status {
        margin-top: 14px;
        font-size: 0.9rem;
        color: var(--muted);
      }

      pre {
        margin: 12px 0 0;
        min-height: 170px;
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 12px;
        white-space: pre-wrap;
        word-break: break-word;
        background: #fbfbfb;
      }

      small {
        display: block;
        margin-top: 10px;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>CubePath API Playground</h1>
      <p>Desde aquí puedes probar <code>GET /health</code> y <code>POST /chat</code> con streaming.</p>

      <label for="message">Mensaje</label>
      <textarea id="message" placeholder="Escribe tu prompt aquí"></textarea>

      <label for="model">Modelo (opcional)</label>
      <input id="model" placeholder="Opcional: modelo especifico para el proveedor actual" />

      <div class="actions">
        <button id="chatButton" type="button" class="primary">Enviar a /chat (stream)</button>
        <button id="healthButton" type="button" class="secondary">Comprobar /health</button>
        <button id="clearButton" type="button" class="secondary">Limpiar</button>
      </div>

      <div id="status" class="status">Listo.</div>
      <pre id="output"></pre>
      <small>Verás el texto segun vaya llegando desde el proveedor seleccionado por round robin.</small>
    </main>

    <script>
      const messageElement = document.getElementById("message");
      const modelElement = document.getElementById("model");
      const statusElement = document.getElementById("status");
      const outputElement = document.getElementById("output");
      const chatButton = document.getElementById("chatButton");
      const healthButton = document.getElementById("healthButton");
      const clearButton = document.getElementById("clearButton");

      function setStatus(message) {
        statusElement.textContent = message;
      }

      function clearOutput() {
        outputElement.textContent = "";
      }

      async function checkHealth() {
        setStatus("Consultando /health...");

        try {
          const response = await fetch("/health");
          const payload = await response.json();

          setStatus("GET /health -> " + response.status);
          outputElement.textContent = JSON.stringify(payload, null, 2);
        } catch (error) {
          setStatus("Error consultando /health");
          outputElement.textContent = String(error);
        }
      }

      async function streamChat() {
        const message = messageElement.value.trim();
        const model = modelElement.value.trim();

        if (!message) {
          setStatus("Debes escribir un mensaje.");
          return;
        }

        clearOutput();
        setStatus("Conectando con /chat...");

        try {
          const payload = { message };

          if (model) {
            payload.model = model;
          }

          const response = await fetch("/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            setStatus("Error en /chat -> " + response.status);
            outputElement.textContent = errorText;
            return;
          }

          if (!response.body) {
            setStatus("El navegador no expone streaming en este contexto.");
            outputElement.textContent = await response.text();
            return;
          }

          const provider = response.headers.get("X-Chat-Provider") || "desconocido";
          const selectedModel = response.headers.get("X-Chat-Model") || "(sin modelo)";

          setStatus(
            "Streaming activo con " + provider + " (" + selectedModel + ")...",
          );

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const result = await reader.read();

            if (result.done) {
              break;
            }

            outputElement.textContent += decoder.decode(result.value, {
              stream: true,
            });
          }

          outputElement.textContent += decoder.decode();
          setStatus(
            "Streaming finalizado con " + provider + " (" + selectedModel + ").",
          );
        } catch (error) {
          setStatus("Error llamando /chat.");
          outputElement.textContent = String(error);
        }
      }

      chatButton.addEventListener("click", streamChat);
      healthButton.addEventListener("click", checkHealth);
      clearButton.addEventListener("click", () => {
        messageElement.value = "";
        modelElement.value = "";
        clearOutput();
        setStatus("Listo.");
      });
    </script>
  </body>
</html>`;

export function handleHome(): Response {
  console.log("[home] Entrando en GET /");

  return new Response(landingHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
