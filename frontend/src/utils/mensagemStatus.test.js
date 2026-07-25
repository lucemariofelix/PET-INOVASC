import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mesclarStatusMensagens,
  selecionarUltimaMensagem,
} from "./mensagemStatus.js";

test("seleciona a mensagem mais recente sem alterar o histórico", () => {
  const mensagens = [
    { id: "1", data_envio: "2026-07-20T10:00:00Z" },
    { id: "2", data_envio: "2026-07-21T10:00:00Z" },
  ];
  const ordemOriginal = [...mensagens];

  assert.equal(selecionarUltimaMensagem(mensagens).id, "2");
  assert.deepEqual(mensagens, ordemOriginal);
});

test("mescla status pela mensagem_id sem alterar outra consulta", () => {
  const consultas = [
    {
      id: "consulta-1",
      historico_mensagens: [{ id: "hist-1", mensagem_id: "msg-1", status: "ENVIADO" }],
    },
    { id: "consulta-2", historico_mensagens: [] },
  ];

  const resultado = mesclarStatusMensagens(consultas, [
    {
      id: "hist-1",
      consulta_id: "consulta-1",
      mensagem_id: "msg-1",
      status: "LIDO",
      lido_em: "2026-07-21T22:54:24.369Z",
    },
  ]);

  assert.equal(resultado[0].historico_mensagens[0].status, "LIDO");
  assert.equal(resultado[0].historico_mensagens[0].lido_em, "2026-07-21T22:54:24.369Z");
  assert.equal(resultado[1], consultas[1]);
});

test("adiciona o novo disparo quando ainda não está no histórico", () => {
  const mensagem = {
    id: "hist-2",
    consulta_id: "consulta-1",
    mensagem_id: "msg-2",
    status: "ENVIADO",
  };
  const resultado = mesclarStatusMensagens(
    [{ id: "consulta-1", historico_mensagens: [] }],
    [mensagem],
  );

  assert.deepEqual(resultado[0].historico_mensagens, [mensagem]);
});
