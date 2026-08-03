import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mesclarStatusMensagens,
  obterEstadoConfirmacao,
  selecionarConfirmacaoEfetiva,
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

test("apresenta os quatro estados da confirmação textual", () => {
  const agora = new Date("2026-07-25T12:00:00.000Z");

  assert.equal(
    obterEstadoConfirmacao({ confirmacao_status: "CONFIRMADO" }, agora),
    "CONFIRMADO",
  );
  assert.equal(
    obterEstadoConfirmacao(
      { confirmacao_status: "CANCELAMENTO_SOLICITADO" },
      agora,
    ),
    "CANCELAMENTO_SOLICITADO",
  );
  assert.equal(
    obterEstadoConfirmacao(
      {
        confirmacao_status: "PENDENTE",
        confirmacao_expira_em: "2026-07-25T13:00:00.000Z",
      },
      agora,
    ),
    "PENDENTE",
  );
  assert.equal(
    obterEstadoConfirmacao(
      {
        confirmacao_status: "PENDENTE",
        confirmacao_expira_em: "2026-07-25T11:59:59.000Z",
      },
      agora,
    ),
    "EXPIRADO",
  );
});

test("prioriza uma resposta terminal mesmo com pendência posterior", () => {
  const confirmacao = selecionarConfirmacaoEfetiva(
    [
      {
        id: "terminal",
        data_envio: "2026-07-25T19:32:00.000Z",
        respondido_em: "2026-07-25T20:37:00.000Z",
        confirmacao_status: "CANCELAMENTO_SOLICITADO",
      },
      {
        id: "pendente-posterior",
        data_envio: "2026-07-25T23:07:00.000Z",
        confirmacao_status: "PENDENTE",
        confirmacao_expira_em: "2026-07-28T23:07:00.000Z",
      },
      {
        id: "substituida",
        data_envio: "2026-07-25T23:08:00.000Z",
        confirmacao_status: "SUBSTITUIDO",
      },
    ],
    new Date("2026-07-25T23:30:00.000Z"),
  );

  assert.equal(confirmacao.id, "terminal");
  assert.equal(confirmacao.confirmacao_status, "CANCELAMENTO_SOLICITADO");
});

test("seleciona pendência ativa e classifica prazo vencido", () => {
  const pendente = {
    id: "pendente",
    data_envio: "2026-07-25T10:00:00.000Z",
    confirmacao_status: "PENDENTE",
    confirmacao_expira_em: "2026-07-28T10:00:00.000Z",
  };

  assert.equal(
    selecionarConfirmacaoEfetiva(
      [pendente],
      new Date("2026-07-26T10:00:00.000Z"),
    ).confirmacao_status,
    "PENDENTE",
  );
  assert.equal(
    selecionarConfirmacaoEfetiva(
      [pendente],
      new Date("2026-07-29T10:00:00.000Z"),
    ).confirmacao_status,
    "EXPIRADO",
  );
});

test("mescla separadamente a confirmação efetiva retornada pelo polling", () => {
  const resultado = mesclarStatusMensagens(
    [
      {
        id: "consulta-1",
        historico_mensagens: [
          {
            id: "terminal",
            mensagem_id: "msg-antiga",
            confirmacao_status: "CANCELAMENTO_SOLICITADO",
          },
        ],
      },
    ],
    [
      {
        id: "recente",
        consulta_id: "consulta-1",
        mensagem_id: "msg-recente",
        status: "LIDO",
        confirmacao_efetiva: {
          id: "terminal",
          confirmacao_status: "CANCELAMENTO_SOLICITADO",
        },
      },
    ],
  );

  assert.equal(
    resultado[0].confirmacao_whatsapp.confirmacao_status,
    "CANCELAMENTO_SOLICITADO",
  );
  assert.equal(selecionarUltimaMensagem(resultado[0].historico_mensagens).id, "recente");
});

test("mantém transporte entregue separado da confirmação pendente", () => {
  const resultado = mesclarStatusMensagens(
    [
      {
        id: "consulta-1",
        historico_mensagens: [
          {
            id: "hist-1",
            mensagem_id: "msg-1",
            status: "ENVIADO",
            confirmacao_status: "PENDENTE",
            confirmacao_expira_em: "2026-08-06T12:00:00.000Z",
          },
        ],
      },
    ],
    [
      {
        id: "hist-1",
        consulta_id: "consulta-1",
        mensagem_id: "msg-1",
        status: "ENTREGUE",
        entregue_em: "2026-08-03T12:00:00.000Z",
        confirmacao_efetiva: {
          id: "hist-1",
          confirmacao_status: "PENDENTE",
          confirmacao_expira_em: "2026-08-06T12:00:00.000Z",
        },
      },
    ],
  );

  assert.equal(resultado[0].ultima_mensagem_whatsapp.status, "ENTREGUE");
  assert.equal(
    resultado[0].confirmacao_whatsapp.confirmacao_status,
    "PENDENTE",
  );
});
