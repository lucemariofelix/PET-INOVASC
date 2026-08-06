import assert from "node:assert/strict";
import test from "node:test";
import {
  comprimirAvatar,
  OPCOES_COMPRESSAO_AVATAR,
} from "./avatar.js";

test("comprime o avatar para WebP com os limites definidos", async () => {
  const original = new File(["imagem"], "foto.png", { type: "image/png" });
  const compressor = async (arquivo, opcoes) => {
    assert.equal(arquivo, original);
    assert.deepEqual(opcoes, OPCOES_COMPRESSAO_AVATAR);
    return new Blob(["webp"], { type: "image/webp" });
  };

  const resultado = await comprimirAvatar(original, compressor);

  assert.equal(resultado.name, "avatar.webp");
  assert.equal(resultado.type, "image/webp");
});

test("rejeita arquivo que não seja imagem compatível", async () => {
  const arquivo = new File(["texto"], "arquivo.txt", { type: "text/plain" });

  await assert.rejects(
    comprimirAvatar(arquivo, async () => arquivo),
    /JPEG, PNG ou WebP/,
  );
});
