const {
  formatarProfissionalComArtigo,
  formatarTipoProfissional,
} = require("./profissional");

describe("formatação de profissional", () => {
  it.each([
    ["MEDICO", "Médico"],
    ["ENFERMEIRO", "Enfermeiro"],
    ["DENTISTA", "Dentista"],
    ["NUTRICAO", "Nutricionista"],
    ["Médico", "Médico"],
  ])("formata %s como %s", (entrada, esperado) => {
    expect(formatarTipoProfissional(entrada)).toBe(esperado);
  });

  it("mantém fallback legível para valor futuro", () => {
    expect(formatarTipoProfissional("FISIOTERAPIA")).toBe("Fisioterapia");
  });

  it("fornece artigo adequado para mensagens", () => {
    expect(formatarProfissionalComArtigo("MEDICO")).toBe("o Médico");
    expect(formatarProfissionalComArtigo("NUTRICAO")).toBe(
      "o(a) Nutricionista",
    );
  });
});
