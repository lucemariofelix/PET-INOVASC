import React, { useState, useEffect, useMemo } from "react";
import {
  FaBullhorn,
  FaUsers,
  FaPaperPlane,
  FaFilter,
  FaInfoCircle,
  FaSpinner,
} from "react-icons/fa";
// Ajuste o caminho de importação da sua API conforme a estrutura do seu projeto
import api from "../api/services";

export default function Notificacoes({ usuario }) {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filtros
  const [filtroAcs, setFiltroAcs] = useState("");
  const [filtroCondicao, setFiltroCondicao] = useState("");
  const [mensagem, setMensagem] = useState("Olá {nome}, ");

  // Carrega os pacientes ao abrir a tela
  useEffect(() => {
    const carregarPacientes = async () => {
      try {
        setLoading(true);
        const dados = await api.getPacientes();

        // TRAVA DE SEGURANÇA: Verifica o formato antes de salvar no estado
        if (Array.isArray(dados)) {
          setPacientes(dados);
        } else if (dados && Array.isArray(dados.data)) {
          setPacientes(dados.data);
        } else if (dados && Array.isArray(dados.pacientes)) {
          setPacientes(dados.pacientes);
        } else {
          setPacientes([]); // Garante que será um Array (lista vazia) para não quebrar o .map
          setFeedback({
            tipo: "erro",
            texto: "Formato de dados inesperado recebido do servidor.",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar pacientes:", error);
        setFeedback({
          tipo: "erro",
          texto: "Não foi possível carregar a lista de pacientes.",
        });
      } finally {
        setLoading(false);
      }
    };
    carregarPacientes();
  }, []);

  // Extrai listas únicas de ACS e Condições para preencher os selects do filtro
  const listaAcs = useMemo(() => {
    // A interrogação (?) protege o código se pacientes for nulo/undefined
    const agentes = pacientes?.map((p) => p.acs).filter(Boolean) || [];
    return [...new Set(agentes)].sort();
  }, [pacientes]);

  const listaCondicoes = useMemo(() => {
    const condicoes = pacientes.map((p) => p.condicao).filter(Boolean);
    return [...new Set(condicoes)].sort();
  }, [pacientes]);

  // Aplica os filtros para saber quem vai receber a mensagem
  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((p) => {
      const bateAcs = filtroAcs ? p.acs === filtroAcs : true;
      const bateCondicao = filtroCondicao
        ? p.condicao === filtroCondicao
        : true;
      // Garante que só envia para quem tem telefone cadastrado
      const temTelefone = p.telefone && p.telefone.trim() !== "";
      return bateAcs && bateCondicao && temTelefone;
    });
  }, [pacientes, filtroAcs, filtroCondicao]);

  const handleDisparar = async () => {
    if (pacientesFiltrados.length === 0) {
      setFeedback({
        tipo: "erro",
        texto: "Nenhum paciente selecionado para envio.",
      });
      return;
    }
    if (!mensagem.includes("{nome}")) {
      setFeedback({
        tipo: "erro",
        texto: "A mensagem precisa conter a variável {nome}.",
      });
      return;
    }

    try {
      setEnviando(true);
      setFeedback(null);

      await api.dispararMensagensLote({
        pacientes: pacientesFiltrados,
        mensagemBase: mensagem,
        usuario_id: usuario?.id, // Pega o ID de quem está logado
      });

      setFeedback({
        tipo: "sucesso",
        texto: `Disparo iniciado para ${pacientesFiltrados.length} pacientes! O sistema fará o envio em segundo plano para evitar bloqueios.`,
      });
      setMensagem("Olá {nome}, "); // Reseta o campo
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-800 text-2xl shadow-sm">
          <FaBullhorn />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Mensageria e Avisos
          </h2>
          <p className="text-gray-500 text-sm">
            Dispare mensagens em lote via WhatsApp com segurança anti-ban.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-md mb-6 font-medium ${feedback.tipo === "sucesso" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}
        >
          {feedback.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA: Filtros */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4 border-b pb-2">
            <FaFilter className="text-sky-600" /> Público Alvo
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Agente de Saúde (ACS)
              </label>
              <select
                value={filtroAcs}
                onChange={(e) => setFiltroAcs(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
              >
                <option value="">Todos os ACS</option>
                {listaAcs.map((acs) => (
                  <option key={acs} value={acs}>
                    {acs}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Condição de Saúde
              </label>
              <select
                value={filtroCondicao}
                onChange={(e) => setFiltroCondicao(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
              >
                <option value="">Todas as Condições</option>
                {listaCondicoes.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="bg-sky-50 p-4 rounded-lg flex flex-col items-center justify-center border border-sky-100">
                <FaUsers className="text-sky-600 text-3xl mb-2" />
                <span className="text-3xl font-bold text-sky-800">
                  {loading ? "..." : pacientesFiltrados.length}
                </span>
                <span className="text-xs text-sky-600 font-medium uppercase tracking-wide text-center mt-1">
                  Pacientes Selecionados
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Editor de Mensagem */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4 border-b pb-2">
            <FaPaperPlane className="text-sky-600" /> Composição da Mensagem
          </h3>

          <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-3">
            <FaInfoCircle className="text-amber-500 mt-1 shrink-0" />
            <p className="text-sm text-amber-800">
              Use a variável{" "}
              <strong className="bg-amber-200 px-1 rounded">{"{nome}"}</strong>{" "}
              no texto. O sistema substituirá automaticamente pelo primeiro nome
              do paciente para deixar a mensagem mais acolhedora.
            </p>
          </div>

          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={6}
            placeholder="Digite o aviso geral aqui..."
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-sky-500 outline-none resize-none text-gray-700"
          ></textarea>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleDisparar}
              disabled={enviando || loading || pacientesFiltrados.length === 0}
              className="bg-sky-700 hover:bg-sky-800 text-white px-6 py-3 rounded-md font-medium shadow-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <>
                  <FaSpinner className="animate-spin" /> Processando Fila...
                </>
              ) : (
                <>
                  <FaPaperPlane /> Disparar Lote
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
