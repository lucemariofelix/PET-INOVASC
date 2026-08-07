import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mensageriaApi } from "./mensageria.js";

const fetchOriginal = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

test("consulta status usando IDs codificados e sinal de cancelamento", async () => {
  let requisicao;
  globalThis.fetch = async (url, options) => {
    requisicao = { url, options };
    return {
      ok: true,
      json: async () => ({ mensagens: [] }),
    };
  };
  const controller = new AbortController();

  const resposta = await mensageriaApi.getStatusMensagens(
    [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ],
    { signal: controller.signal },
  );

  assert.match(
    requisicao.url,
    /mensagens\/status\?consulta_ids=11111111-1111-4111-8111-111111111111%2C22222222-2222-4222-8222-222222222222$/,
  );
  assert.equal(requisicao.options.signal, controller.signal);
  assert.deepEqual(resposta, { mensagens: [] });
});

test("desconecta WhatsApp com DELETE e sem corpo", async () => {
  let requisicao;
  globalThis.fetch = async (url, options) => {
    requisicao = { url, options };
    return {
      ok: true,
      json: async () => ({
        status: "disconnected",
        already_disconnected: false,
      }),
    };
  };

  const resposta = await mensageriaApi.desconectarWhatsApp();

  assert.match(requisicao.url, /\/whatsapp\/conexao$/);
  assert.equal(requisicao.options.method, "DELETE");
  assert.equal(requisicao.options.body, undefined);
  assert.equal(requisicao.options.headers["Content-Type"], undefined);
  assert.deepEqual(resposta, {
    status: "disconnected",
    already_disconnected: false,
  });
});
