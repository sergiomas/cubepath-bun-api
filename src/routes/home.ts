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

      h2 {
        margin: 0 0 8px;
        font-size: 1.1rem;
        letter-spacing: -0.01em;
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
      input,
      select {
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

      .section {
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px dashed var(--line);
      }

      .subgrid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }

      .mono {
        font-family: "Cascadia Mono", "Consolas", monospace;
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
      <p>
        Desde aquí puedes probar chat en streaming y también ejecutar métodos REST
        de <code>/users</code> rápidamente.
      </p>

      <section>
        <h2>Chat streaming</h2>

        <label for="message">Mensaje</label>
        <textarea id="message" placeholder="Escribe tu prompt aquí"></textarea>

        <label for="model">Modelo (opcional)</label>
        <input id="model" placeholder="Opcional: modelo especifico para el proveedor actual" />

        <div class="actions">
          <button id="chatButton" type="button" class="primary">Enviar a /chat (stream)</button>
          <button id="healthButton" type="button" class="secondary">Comprobar /health</button>
          <button id="clearButton" type="button" class="secondary">Limpiar chat</button>
        </div>

        <div id="chatStatus" class="status">Listo.</div>
        <pre id="chatOutput"></pre>
        <small>Verás el texto segun vaya llegando desde el proveedor seleccionado por round robin.</small>
      </section>

      <section class="section">
        <h2>REST rapido de usuarios</h2>
        <p>Botones de atajo para probar <code>/users</code> y <code>/users/:id</code>.</p>

        <div class="quick-actions">
          <button id="quickList" type="button" class="secondary">GET /users</button>
          <button id="quickCreate" type="button" class="secondary">POST demo</button>
          <button id="quickGetById" type="button" class="secondary">GET /users/:id</button>
          <button id="quickPut" type="button" class="secondary">PUT demo</button>
          <button id="quickPatch" type="button" class="secondary">PATCH active</button>
          <button id="quickDelete" type="button" class="secondary">DELETE</button>
        </div>

        <div class="subgrid">
          <div>
            <label for="restMethod">Metodo</label>
            <select id="restMethod">
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>
          </div>
          <div>
            <label for="restPath">Path</label>
            <input id="restPath" class="mono" value="/users" />
          </div>
          <div>
            <label for="restUserId">User ID para /users/:id</label>
            <input id="restUserId" type="number" min="1" value="1" />
          </div>
        </div>

        <label for="restBody">Body JSON (opcional en GET/DELETE)</label>
        <textarea
          id="restBody"
          class="mono"
          placeholder='{"name":"Ada Lovelace","email":"ada@example.com","active":true}'
        ></textarea>

        <div class="actions">
          <button id="restRunButton" type="button" class="primary">Ejecutar REST</button>
          <button id="restClearButton" type="button" class="secondary">Limpiar REST</button>
        </div>

        <div id="restStatus" class="status">Listo para probar /users.</div>
        <pre id="restOutput"></pre>
      </section>
    </main>

    <script>
      const messageElement = document.getElementById("message");
      const modelElement = document.getElementById("model");
      const chatStatusElement = document.getElementById("chatStatus");
      const chatOutputElement = document.getElementById("chatOutput");
      const chatButton = document.getElementById("chatButton");
      const healthButton = document.getElementById("healthButton");
      const clearButton = document.getElementById("clearButton");

      const restMethodElement = document.getElementById("restMethod");
      const restPathElement = document.getElementById("restPath");
      const restUserIdElement = document.getElementById("restUserId");
      const restBodyElement = document.getElementById("restBody");
      const restStatusElement = document.getElementById("restStatus");
      const restOutputElement = document.getElementById("restOutput");
      const restRunButton = document.getElementById("restRunButton");
      const restClearButton = document.getElementById("restClearButton");
      const quickListButton = document.getElementById("quickList");
      const quickCreateButton = document.getElementById("quickCreate");
      const quickGetByIdButton = document.getElementById("quickGetById");
      const quickPutButton = document.getElementById("quickPut");
      const quickPatchButton = document.getElementById("quickPatch");
      const quickDeleteButton = document.getElementById("quickDelete");

      function setChatStatus(message) {
        chatStatusElement.textContent = message;
      }

      function clearChatOutput() {
        chatOutputElement.textContent = "";
      }

      function setRestStatus(message) {
        restStatusElement.textContent = message;
      }

      function clearRestOutput() {
        restOutputElement.textContent = "";
      }

      function toPrettyText(rawText) {
        if (!rawText) {
          return "";
        }

        try {
          const parsed = JSON.parse(rawText);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return rawText;
        }
      }

      function readUserId() {
        const parsedId = Number(restUserIdElement.value);

        if (!Number.isInteger(parsedId) || parsedId <= 0) {
          setRestStatus("El User ID debe ser un entero positivo.");
          return null;
        }

        return parsedId;
      }

      function fillRestForm(method, path, bodyObject) {
        restMethodElement.value = method;
        restPathElement.value = path;

        if (bodyObject === undefined) {
          restBodyElement.value = "";
          return;
        }

        restBodyElement.value = JSON.stringify(bodyObject, null, 2);
      }

      async function runRest(method, path, bodyObject) {
        clearRestOutput();
        setRestStatus("Ejecutando " + method + " " + path + "...");

        const requestInit = {
          method,
        };

        if (bodyObject !== undefined) {
          requestInit.headers = {
            "Content-Type": "application/json",
          };
          requestInit.body = JSON.stringify(bodyObject);
        }

        try {
          const response = await fetch(path, requestInit);
          const rawText = await response.text();
          const formatted = toPrettyText(rawText);

          setRestStatus(method + " " + path + " -> " + response.status);
          restOutputElement.textContent = formatted || "(sin contenido)";
        } catch (error) {
          setRestStatus("Error llamando " + method + " " + path + ".");
          restOutputElement.textContent = String(error);
        }
      }

      async function checkHealth() {
        setChatStatus("Consultando /health...");

        try {
          const response = await fetch("/health");
          const payload = await response.json();

          setChatStatus("GET /health -> " + response.status);
          chatOutputElement.textContent = JSON.stringify(payload, null, 2);
        } catch (error) {
          setChatStatus("Error consultando /health");
          chatOutputElement.textContent = String(error);
        }
      }

      async function streamChat() {
        const message = messageElement.value.trim();
        const model = modelElement.value.trim();

        if (!message) {
          setChatStatus("Debes escribir un mensaje.");
          return;
        }

        clearChatOutput();
        setChatStatus("Conectando con /chat...");

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
            setChatStatus("Error en /chat -> " + response.status);
            chatOutputElement.textContent = errorText;
            return;
          }

          if (!response.body) {
            setChatStatus("El navegador no expone streaming en este contexto.");
            chatOutputElement.textContent = await response.text();
            return;
          }

          const provider = response.headers.get("X-Chat-Provider") || "desconocido";
          const selectedModel = response.headers.get("X-Chat-Model") || "(sin modelo)";

          setChatStatus(
            "Streaming activo con " + provider + " (" + selectedModel + ")...",
          );

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const result = await reader.read();

            if (result.done) {
              break;
            }

            chatOutputElement.textContent += decoder.decode(result.value, {
              stream: true,
            });
          }

          chatOutputElement.textContent += decoder.decode();
          setChatStatus(
            "Streaming finalizado con " + provider + " (" + selectedModel + ").",
          );
        } catch (error) {
          setChatStatus("Error llamando /chat.");
          chatOutputElement.textContent = String(error);
        }
      }

      async function runManualRest() {
        const method = restMethodElement.value;
        const path = restPathElement.value.trim() || "/users";
        const rawBody = restBodyElement.value.trim();

        let parsedBody;

        if (rawBody) {
          try {
            parsedBody = JSON.parse(rawBody);
          } catch {
            setRestStatus("El body JSON no es válido.");
            restOutputElement.textContent = rawBody;
            return;
          }
        }

        await runRest(method, path, parsedBody);
      }

      async function runQuickList() {
        fillRestForm("GET", "/users");
        await runRest("GET", "/users");
      }

      async function runQuickCreate() {
        const stamp = Date.now();
        const body = {
          name: "Usuario Demo " + stamp,
          email: "usuario" + stamp + "@example.com",
          active: true,
        };

        fillRestForm("POST", "/users", body);
        await runRest("POST", "/users", body);
      }

      async function runQuickGetById() {
        const userId = readUserId();

        if (!userId) {
          return;
        }

        const path = "/users/" + userId;

        fillRestForm("GET", path);
        await runRest("GET", path);
      }

      async function runQuickPut() {
        const userId = readUserId();

        if (!userId) {
          return;
        }

        const body = {
          name: "Usuario Actualizado " + userId,
          email: "actualizado" + userId + "@example.com",
          active: true,
        };
        const path = "/users/" + userId;

        fillRestForm("PUT", path, body);
        await runRest("PUT", path, body);
      }

      async function runQuickPatch() {
        const userId = readUserId();

        if (!userId) {
          return;
        }

        const body = {
          active: false,
        };
        const path = "/users/" + userId;

        fillRestForm("PATCH", path, body);
        await runRest("PATCH", path, body);
      }

      async function runQuickDelete() {
        const userId = readUserId();

        if (!userId) {
          return;
        }

        const path = "/users/" + userId;

        fillRestForm("DELETE", path);
        await runRest("DELETE", path);
      }

      chatButton.addEventListener("click", streamChat);
      healthButton.addEventListener("click", checkHealth);
      restRunButton.addEventListener("click", runManualRest);
      quickListButton.addEventListener("click", runQuickList);
      quickCreateButton.addEventListener("click", runQuickCreate);
      quickGetByIdButton.addEventListener("click", runQuickGetById);
      quickPutButton.addEventListener("click", runQuickPut);
      quickPatchButton.addEventListener("click", runQuickPatch);
      quickDeleteButton.addEventListener("click", runQuickDelete);

      clearButton.addEventListener("click", () => {
        messageElement.value = "";
        modelElement.value = "";
        clearChatOutput();
        setChatStatus("Listo.");
      });

      restClearButton.addEventListener("click", () => {
        restMethodElement.value = "GET";
        restPathElement.value = "/users";
        restBodyElement.value = "";
        clearRestOutput();
        setRestStatus("Listo para probar /users.");
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
