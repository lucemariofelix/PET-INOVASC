import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchComAutenticacao, fetchPublico } from "./client.js";

const fetchOriginal = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

const capturarRequisicao = () => {
  let requisicao;
  globalThis.fetch = async (url, options) => {
    requisicao = { url, options };
    return { status: 200 };
  };
  return () => requisicao;
};

test("DELETE autenticado sem corpo não declara Content-Type JSON", async () => {
  const requisicao = capturarRequisicao();

  await fetchComAutenticacao("/grupos-acompanhamento/grupo-1", {
    method: "DELETE",
  });

  assert.equal(requisicao().options.headers["Content-Type"], undefined);
  assert.equal(requisicao().options.body, undefined);
});

test("POST público sem corpo não declara Content-Type JSON", async () => {
  const requisicao = capturarRequisicao();

  await fetchPublico("/auth/logout", { method: "POST" });

  assert.equal(requisicao().options.headers["Content-Type"], undefined);
});

test("POST com corpo JSON declara Content-Type application/json", async () => {
  const requisicao = capturarRequisicao();

  await fetchPublico("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@ubs.com" }),
  });

  assert.equal(
    requisicao().options.headers["Content-Type"],
    "application/json",
  );
});
