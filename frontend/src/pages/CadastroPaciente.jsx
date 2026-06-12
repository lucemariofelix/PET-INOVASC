import { useEffect, useState } from "react";
import { FaUserPlus } from "react-icons/fa";
import { api } from "../api/services";
import { formatarDocumento } from "../utils/formatters";
import ModalAlerta from "../components/ModalAlerta";

export default function CadastroPaciente({ onSuccess }) {
  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [agenteId, setAgenteId] = useState("");
  const [gruposIds, setGruposIds] = useState([]);
  const [condicao, setCondicao] = useState("NENHUM");
  const [agentesACS, setAgentesACS] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loadingMetadados, setLoadingMetadados] = useState(false);

  // Estado de controle do Modal
  const [alerta, setAlerta] = useState({
    isOpen: false,
    tipo: "",
    titulo: "",
    mensagem: "",
  });

  useEffect(() => {
    const carregarMetadados = async () => {
      setLoadingMetadados(true);

      try {
        const [respostaACS, respostaGrupos] = await Promise.all([
          api.getACS(),
          api.getGrupos(),
        ]);

        setAgentesACS(respostaACS.usuarios || respostaACS || []);
        setGrupos(respostaGrupos.grupos || respostaGrupos || []);
      } catch (error) {
        console.error("Erro ao carregar ACS/grupos:", error);
        setAlerta({
          isOpen: true,
          tipo: "erro",
          titulo: "Erro ao carregar dados",
          mensagem: "Não foi possível carregar ACS e grupos de acompanhamento.",
        });
      } finally {
        setLoadingMetadados(false);
      }
    };

    carregarMetadados();
  }, []);

  // Lógica da Máscara de CPF/CNS
  const handleCpfChange = (e) => {
    setCpf(formatarDocumento(e.target.value));
  };

  // Nova Lógica da Máscara de Telefone (Padrão Brasil)
  const aplicarMascaraTelefone = (valor) => {
    if (!valor) return "";

    // Remove tudo o que não for número
    let v = valor.replace(/\D/g, "");

    // Limita a 11 caracteres (DDD + 9 dígitos)
    v = v.substring(0, 11);

    // Aplica a formatação
    if (v.length <= 2) return v.length > 0 ? `(${v}` : v;
    if (v.length <= 7) return `(${v.substring(0, 2)}) ${v.substring(2)}`;

    return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
  };

  const handleTelefoneChange = (e) => {
    setTelefone(aplicarMascaraTelefone(e.target.value));
  };

  const toggleGrupo = (grupoId) => {
    setGruposIds((idsAtuais) =>
      idsAtuais.includes(grupoId)
        ? idsAtuais.filter((id) => id !== grupoId)
        : [...idsAtuais, grupoId],
    );
  };

  const handleSubmitPaciente = async (e) => {
    e.preventDefault();

    // Removemos os pontos, traços e espaços antes de mandar para o backend
    const documentoLimpo = cpf.replace(/\D/g, "");

    if (documentoLimpo.length !== 11 && documentoLimpo.length !== 15) {
      setAlerta({
        isOpen: true,
        tipo: "aviso",
        titulo: "Documento Inválido",
        mensagem:
          "O documento deve ter 11 números (CPF) ou 15 números (Cartão SUS).",
      });
      return;
    }

    const payload = {
      nome_completo: nome,
      cpf_cns: documentoLimpo,
      data_nascimento: nascimento,
      telefone: telefone,
      endereco,
      agente_id: agenteId || null,
      grupos_ids: gruposIds,
      condicao,
    };

    try {
      await api.criarPaciente(payload);

      // Limpa os campos após o sucesso
      setNome("");
      setCpf("");
      setNascimento("");
      setTelefone("");
      setEndereco("");
      setAgenteId("");
      setGruposIds([]);
      setCondicao("NENHUM");

      // Apenas abre o modal de sucesso
      setAlerta({
        isOpen: true,
        tipo: "sucesso",
        titulo: "Tudo Certo!",
        mensagem: "Paciente cadastrado com sucesso.",
      });
    } catch (err) {
      // Captura o erro do backend (incluindo o aviso de CPF duplicado)
      setAlerta({
        isOpen: true,
        tipo: "erro",
        titulo: "Ops! Ocorreu um erro",
        mensagem: err.message,
      });
    }
  };

  // Função para fechar o alerta e mudar de aba
  const fecharAlerta = () => {
    setAlerta({ ...alerta, isOpen: false });
    if (alerta.tipo === "sucesso" && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-in fade-in zoom-in-95 duration-300">
      <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <FaUserPlus className="text-sky-700" /> Novo Paciente
      </h2>
      <p className="text-slate-500 text-sm mb-8">
        Preencha os dados obrigatórios para inserir no banco de dados.
      </p>

      <form onSubmit={handleSubmitPaciente} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              placeholder="Ex: Maria da Silva"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              CPF ou CNS *
            </label>
            <input
              type="text"
              required
              value={cpf}
              onChange={handleCpfChange}
              maxLength={18}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Data de Nascimento *
            </label>
            <input
              type="date"
              required
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Agente de Saúde (ACS)
            </label>
            <select
              value={agenteId}
              onChange={(e) => setAgenteId(e.target.value)}
              disabled={loadingMetadados}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white"
            >
              <option value="">Área Descoberta</option>
              {agentesACS.map((agente) => (
                <option key={agente.id} value={agente.id}>
                  {agente.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Endereço Completo
            </label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              placeholder="Rua, Número, Bairro"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              WhatsApp / Telefone
            </label>
            {/* Campo de Telefone atualizado com maxLength e o novo evento onChange */}
            <input
              type="tel"
              value={telefone}
              onChange={handleTelefoneChange}
              maxLength={15}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              placeholder="(84) 99999-9999"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">
            Condição de Saúde
          </label>
          <select
            value={condicao}
            onChange={(e) => setCondicao(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white"
          >
            <option value="NENHUM">Nenhum / Não informado</option>
            <option value="HIPERTENSO">Hipertenso</option>
            <option value="DIABETICO">Diabético</option>
            <option value="AMBOS">Hipertenso e Diabético</option>
            <option value="GESTANTE">Gestante</option>
            <option value="CD">CD: Crescimento e Desenvolvimento</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Grupos de Acompanhamento
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {grupos.length === 0 ? (
              <p className="text-sm text-slate-400">
                {loadingMetadados ? "Carregando grupos..." : "Nenhum grupo cadastrado"}
              </p>
            ) : (
              grupos.map((grupo) => (
                <label
                  key={grupo.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={gruposIds.includes(grupo.id)}
                    onChange={() => toggleGrupo(grupo.id)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                  />
                  <span>{grupo.nome}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition cursor-pointer"
          >
            Salvar Cadastro no Banco
          </button>
        </div>
      </form>

      {/* Instância do Modal conectada ao estado */}
      <ModalAlerta
        isOpen={alerta.isOpen}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensagem={alerta.mensagem}
        onClose={fecharAlerta}
      />
    </div>
  );
}
