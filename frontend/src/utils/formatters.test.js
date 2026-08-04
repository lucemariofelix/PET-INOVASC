import assert from "node:assert/strict";
import test from "node:test";
import {
  formatarDataConsulta,
  formatarTipoProfissional,
  normalizarTextoBusca,
} from "./formatters.js";

test("formata datas de consulta sem deslocamento de fuso horário", () => {
  assert.equal(formatarDataConsulta("2026-08-04"), "04/08/2026");
  assert.equal(
    formatarDataConsulta("2026-01-01T00:00:00.000Z"),
    "01/01/2026",
  );
});

test("distingue ausência de registro de uma data inconsistente", () => {
  assert.equal(formatarDataConsulta(null), "Sem registro");
  assert.equal(formatarDataConsulta(""), "Sem registro");
  assert.equal(formatarDataConsulta("2026-02-30"), "Data inválida");
  assert.equal(formatarDataConsulta("valor-inválido"), "Data inválida");
});

test("formata os identificadores técnicos dos profissionais", () => {
  assert.deepEqual(
    ["MEDICO", "ENFERMEIRO", "DENTISTA", "NUTRICAO"].map(
      formatarTipoProfissional,
    ),
    ["Médico", "Enfermeiro", "Dentista", "Nutricionista"],
  );
});

test("mantém fallback legível e busca sem acentos", () => {
  assert.equal(formatarTipoProfissional("FISIOTERAPIA"), "Fisioterapia");
  assert.equal(normalizarTextoBusca("Médico"), "medico");
  assert.equal(normalizarTextoBusca("Nutrição"), "nutricao");
  assert.equal(
    normalizarTextoBusca(formatarTipoProfissional("MEDICO")).includes(
      normalizarTextoBusca("Medico"),
    ),
    true,
  );
});
