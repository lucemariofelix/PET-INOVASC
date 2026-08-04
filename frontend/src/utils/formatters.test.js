import assert from "node:assert/strict";
import test from "node:test";
import {
  formatarTipoProfissional,
  normalizarTextoBusca,
} from "./formatters.js";

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
