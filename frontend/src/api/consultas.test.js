import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { consultasApi } from "./consultas.js";

const fetchOriginal = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

test("efetiva cancelamento por PATCH sem corpo", async () => {
  let requisicao;
  globalThis.fetch = async (url, options) => {
    requisicao = { url, options };
    return { ok: true, json: async () => ({ consulta: { status_consulta: "CANCELADA" } }) };
  };

  await consultasApi.efetivarCancelamento("consulta com espaço");

  assert.match(requisicao.url, /consultas\/consulta%20com%20espa%C3%A7o\/cancelamento$/);
  assert.equal(requisicao.options.method, "PATCH");
  assert.equal(requisicao.options.body, undefined);
});
