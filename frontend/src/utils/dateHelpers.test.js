import assert from "node:assert/strict";
import test from "node:test";
import { getBadgeInfo, podeRegistrarDesfecho } from "./dateHelpers.js";

test("prioriza o estado cancelado sobre as datas da consulta", () => {
  assert.deepEqual(
    getBadgeInfo({
      status_consulta: "CANCELADA",
      data_proxima_consulta: "2099-01-01",
    }),
    {
      label: "CANCELADA",
      color: "bg-slate-200 text-slate-700 border-slate-300",
      textoDias: "Encerrada",
    },
  );
});

const agora = new Date("2026-08-04T12:00:00-03:00");

test("classifica agendamento passado como vencido", () => {
  assert.deepEqual(
    getBadgeInfo(
      { status_consulta: "AGENDADA", data_proxima_consulta: "2026-08-02" },
      agora,
    ),
    {
      label: "AGENDAMENTO VENCIDO",
      color: "bg-red-100 text-red-800 border-red-200",
      textoDias: "Há 2 dias",
    },
  );
});

test("classifica falta sem inventar data de última consulta", () => {
  const badge = getBadgeInfo(
    { status_consulta: "FALTOU", data_ultima_consulta: null },
    agora,
  );
  assert.equal(badge.label, "FALTOU");
  assert.equal(badge.textoDias, "Não compareceu");
});

test("libera desfecho somente para admin ou recepção na data ou depois", () => {
  const consulta = {
    status_consulta: "AGENDADA",
    data_proxima_consulta: "2026-08-04",
  };
  assert.equal(podeRegistrarDesfecho(consulta, "RECEPCAO", agora), true);
  assert.equal(podeRegistrarDesfecho(consulta, "ADMIN", agora), true);
  assert.equal(podeRegistrarDesfecho(consulta, "ACS", agora), false);
  assert.equal(
    podeRegistrarDesfecho(
      { ...consulta, data_proxima_consulta: "2026-08-05" },
      "ADMIN",
      agora,
    ),
    false,
  );
});
