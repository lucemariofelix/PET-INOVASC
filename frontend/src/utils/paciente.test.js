import assert from "node:assert/strict";
import test from "node:test";
import {
  obterNomeAgentePaciente,
  substituirPacienteAtualizado,
} from "./paciente.js";

test("prioriza a relação canônica e preserva o fallback legado", () => {
  assert.equal(
    obterNomeAgentePaciente({ agente: { nome: "Ana ACS" }, acs: "Legado" }),
    "Ana ACS",
  );
  assert.equal(obterNomeAgentePaciente({ acs: "ACS legado" }), "ACS legado");
  assert.equal(obterNomeAgentePaciente({ agente: null, acs: null }), "Área Descoberta");
});

test("substitui somente o paciente confirmado pela API", () => {
  const pacientes = [{ id: "p-1", nome: "Um" }, { id: "p-2", nome: "Dois" }];
  const atualizado = { id: "p-2", nome: "Atualizado", agente: null };

  assert.deepEqual(substituirPacienteAtualizado(pacientes, atualizado), [
    pacientes[0],
    atualizado,
  ]);
});
