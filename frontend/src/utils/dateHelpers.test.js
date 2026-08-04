import assert from "node:assert/strict";
import test from "node:test";
import { getBadgeInfo } from "./dateHelpers.js";

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
