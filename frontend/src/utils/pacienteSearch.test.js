import assert from "node:assert/strict";
import { test } from "node:test";
import { filtrarPacientesPorBusca } from "./pacienteSearch.js";

const pacientes = [
  { nome_completo: "João da Silva", cpf_cns: "12345678901" },
  { nome_completo: "Maria Áurea", cpf_cns: "987654321001234" },
  { nome_completo: "Ana Souza", cpf_cns: "11122233344" },
];

test("busca paciente por parte do nome sem diferenciar caixa ou acentos", () => {
  assert.deepEqual(filtrarPacientesPorBusca(pacientes, "JOAO"), [pacientes[0]]);
  assert.deepEqual(filtrarPacientesPorBusca(pacientes, "aure"), [pacientes[1]]);
});

test("busca CPF ou CNS com ou sem formatação", () => {
  assert.deepEqual(filtrarPacientesPorBusca(pacientes, "123.456.789-01"), [
    pacientes[0],
  ]);
  assert.deepEqual(filtrarPacientesPorBusca(pacientes, "987 654 321"), [
    pacientes[1],
  ]);
});

test("termo vazio retorna todos os pacientes", () => {
  assert.deepEqual(filtrarPacientesPorBusca(pacientes, "   "), pacientes);
});

test("campos ausentes e lista inválida são tratados com segurança", () => {
  assert.deepEqual(
    filtrarPacientesPorBusca([{ nome_completo: null }, { cpf_cns: null }], "ana"),
    [],
  );
  assert.deepEqual(filtrarPacientesPorBusca(null, "ana"), []);
});
