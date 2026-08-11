import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { sessaoApi } from "./sessao.js";

const fetchOriginal = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

test("consulta a página solicitada dos logs", async () => {
  let requisicao;
  globalThis.fetch = async (url, options) => {
    requisicao = { url, options };
    return {
      ok: true,
      json: async () => ({
        logs: [],
        paginacao: { pagina: 2, limite: 5, total: 8, total_paginas: 2 },
      }),
    };
  };

  const resposta = await sessaoApi.getLogs({ pagina: 2, limite: 5 });

  assert.match(requisicao.url, /\/logs\?pagina=2&limite=5$/);
  assert.deepEqual(resposta.paginacao, {
    pagina: 2,
    limite: 5,
    total: 8,
    total_paginas: 2,
  });
});
