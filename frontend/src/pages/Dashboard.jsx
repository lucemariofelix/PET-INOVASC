import React, { useState, useEffect } from "react";
import { api } from "../api/services";
import { getBadgeInfo } from "../utils/dateHelpers";
import ModalConfirmacao from "../components/ModalConfirmacao";
import ModalAlerta from "../components/ModalAlerta";
import PainelMetricas from "../components/PainelMetricas";
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Dashboard() {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(false);

  // ESTADOS EXISTENTES: Filtros e Modais
  const [filtro, setFiltro] = useState("TODAS");
  const [modalConfirmacao, setModalConfirmacao] = useState({
    isOpen: false,
    consulta: null,
  });
  const [alerta, setAlerta] = useState({
    isOpen: false,
    tipo: "",
    titulo: "",
    mensagem: "",
  });

  // NOVOS ESTADOS: Busca e Paginação
  const [termoBusca, setTermoBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5; // Quantidade de registros por página

  const carregarDados = async () => {
    setLoading(true);
    try {
      const data = await api.getTodasConsultas();
      setConsultas(data.consultas || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // NOVO: Volta para a página 1 sempre que o usuário digitar na busca ou trocar o filtro
  useEffect(() => {
    setPaginaAtual(1);
  }, [termoBusca, filtro]);

  // LÓGICA DE FILTRAGEM COMBINADA (Status + Busca Universal)
  const consultasFiltradas = consultas.filter((consulta) => {
    const badge = getBadgeInfo(consulta);
    const paciente = consulta.pacientes || {};

    // 1. Verifica o Filtro de Status
    let passaFiltroStatus = false;
    if (filtro === "TODAS") passaFiltroStatus = true;
    else if (filtro === "ATRASADAS")
      passaFiltroStatus = badge.label === "URGENTE" || badge.label === "ALERTA";
    else if (filtro === "NO_PRAZO")
      passaFiltroStatus = badge.label === "OK" || badge.label === "LEMBRETE";

    // 2. Verifica o Filtro de Busca Universal (Nome, Doc, ACS, Condição ou Profissional)
    let passaFiltroBusca = true;
    if (termoBusca.trim() !== "") {
      const termo = termoBusca.toLowerCase();
      
      // Coleta todas as informações e joga para minúsculo para comparar
      const nome = paciente.nome_completo?.toLowerCase() || "";
      // Ajustado para o padrão cpf_cns usado no seu banco
      const documento = paciente.cpf_cns?.toLowerCase() || paciente.documento?.toLowerCase() || "";
      const acs = paciente.acs?.toLowerCase() || "";
      const condicao = paciente.condicao?.toLowerCase() || "";
      const profissional = consulta.tipo_profissional?.toLowerCase() || "";

      // Se o termo digitado bater com QUALQUER UMA dessas colunas, ele exibe na tela
      passaFiltroBusca = 
        nome.includes(termo) || 
        documento.includes(termo) ||
        acs.includes(termo) ||
        condicao.includes(termo) ||
        profissional.includes(termo);
    }

    return passaFiltroStatus && passaFiltroBusca;
  });

  // LÓGICA DE PAGINAÇÃO
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const itensAtuais = consultasFiltradas.slice(
    indicePrimeiroItem,
    indiceUltimoItem,
  );
  const totalPaginas = Math.ceil(consultasFiltradas.length / itensPorPagina);

  const irParaProximaPagina = () => {
    if (paginaAtual < totalPaginas) setPaginaAtual(paginaAtual + 1);
  };

  const irParaPaginaAnterior = () => {
    if (paginaAtual > 1) setPaginaAtual(paginaAtual - 1);
  };

  // Funções de Disparo (Mantidas intactas)
  const solicitarDisparo = (consulta) => {
    const paciente = consulta.pacientes;

    if (!paciente?.telefone) {
      setAlerta({
        isOpen: true,
        tipo: "aviso",
        titulo: "Telefone Ausente",
        mensagem:
          "Este paciente não possui telefone cadastrado! Atualize o cadastro primeiro.",
      });
      return;
    }
    setModalConfirmacao({ isOpen: true, consulta });
  };

  const confirmarDisparo = async () => {
    const consulta = modalConfirmacao.consulta;
    const paciente = consulta.pacientes;

    setModalConfirmacao({ isOpen: false, consulta: null });

    try {
      await api.dispararWhatsApp({
        paciente_id: paciente.id, 
        telefone: paciente.telefone,
        nome: paciente.nome_completo,
        profissional: consulta.tipo_profissional,
        status_consulta: consulta.status_consulta,
        data_referencia:
          consulta.data_proxima_consulta || consulta.data_ultima_consulta,
      });

      // A MÁGICA DO REACT ACONTECE AQUI:
      // Atualizamos a memória da tela instantaneamente, sem precisar de recarregamento
      setConsultas((consultasAtuais) =>
        consultasAtuais.map((item) => {
          // Se for a linha do paciente que acabamos de avisar...
          if (item.pacientes?.id === paciente.id) {
            return {
              ...item,
              pacientes: {
                ...item.pacientes,
                // Injetamos um histórico fresquinho no topo da lista dele
                historico_mensagens: [
                  { data_envio: new Date().toISOString(), status: "ENVIADO" },
                  ...(item.pacientes.historico_mensagens || []),
                ],
              },
            };
          }
          return item; // As outras linhas da tabela continuam intactas
        })
      );

      setAlerta({
        isOpen: true,
        tipo: "sucesso",
        titulo: "Mensagem Enviada!",
        mensagem: "O disparo foi encaminhado e salvo no histórico com sucesso.",
      });
    } catch (err) {
      setAlerta({
        isOpen: true,
        tipo: "erro",
        titulo: "Falha no Disparo",
        mensagem: err.message,
      });
    }
  };

  return (
    // Note que removemos o bg-white e as bordas daqui. Usamos space-y-6 para separar os blocos.
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. CABEÇALHO DA PÁGINA (Apenas Título) */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          Motor de Busca Ativa
        </h2>
        <p className="text-slate-500 text-sm sm:text-base mt-1">
          Acompanhamento, rastreio de agendamentos e visão geral da unidade.
        </p>
      </div>

      {/* 2. PAINEL DE MÉTRICAS GLOBAIS */}
      {!loading && consultas.length > 0 && (
        <PainelMetricas consultas={consultas} />
      )}

      {/* 3. BLOCO DA TABELA (Tabela + Barra de Ferramentas colada nela) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* BARRA DE FERRAMENTAS DA TABELA */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50">
          
          <h3 className="text-lg font-bold text-slate-700 hidden xl:block">
            Diretório de Acompanhamento
          </h3>

          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto ml-auto">
            {/* CAMPO DE BUSCA */}
            <div className="relative w-full md:w-72 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-slate-400 text-sm" />
              </div>
              <input
                type="text"
                placeholder="Buscar paciente, ACS, condição ou profissional..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm shadow-sm"
              />
            </div>

            {/* BOTÕES DE FILTRO */}
            <div className="flex flex-wrap gap-1 bg-slate-200/50 p-1 rounded-lg">
              <button
                onClick={() => setFiltro("TODAS")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition ${filtro === "TODAS" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltro("ATRASADAS")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition ${filtro === "ATRASADAS" ? "bg-red-50 text-red-700 shadow-sm" : "text-slate-500 hover:text-red-700"}`}
              >
                Atrasadas
              </button>
              <button
                onClick={() => setFiltro("NO_PRAZO")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition ${filtro === "NO_PRAZO" ? "bg-green-50 text-green-700 shadow-sm" : "text-slate-500 hover:text-green-700"}`}
              >
                No Prazo
              </button>
            </div>
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO DA TABELA */}
        <div className="p-2 sm:p-0 min-h-[400px]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-700 mb-4"></div>
              <p className="text-slate-500">Buscando dados no servidor...</p>
            </div>
          ) : itensAtuais.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-500 text-lg">
                Nenhum registro encontrado para a busca/filtro atual.
              </p>
              {termoBusca && (
                <button
                  onClick={() => setTermoBusca("")}
                  className="mt-4 text-sky-600 hover:text-sky-800 text-sm font-medium underline"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <>
              {/* VISUALIZAÇÃO DESKTOP (Tabela) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Paciente</th>
                      <th className="px-6 py-4">Agente (ACS)</th>
                      <th className="px-6 py-4">Condição</th>
                      <th className="px-6 py-4">Profissional</th>
                      <th className="px-6 py-4 text-center">Tempo</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itensAtuais.map((consulta, index) => {
                      const paciente = consulta.pacientes;
                      const badge = getBadgeInfo(consulta);
                      
                      // LÓGICA DE HISTÓRICO APLICADA AQUI (Desktop)
                      const mensagens = paciente?.historico_mensagens || [];
                      const ultimaMensagem = mensagens.length > 0 
                        ? mensagens.sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio))[0] 
                        : null;

                      return (
                        <tr
                          key={`desk-${index}`}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          {/* COLUNA DO PACIENTE ATUALIZADA (Desktop) */}
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 leading-tight">
                              {paciente?.nome_completo}
                            </p>
                            
                            <div className="flex flex-col gap-0.5 mt-1">
                              <p className="text-xs text-slate-400">
                                {paciente?.telefone || "Sem contato"}
                              </p>
                              
                              {/* INDICADOR VISUAL DE MENSAGEM */}
                              {ultimaMensagem ? (
                                <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5 p-1 bg-emerald-50 rounded w-fit mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Avisado ({new Date(ultimaMensagem.data_envio).toLocaleDateString('pt-BR')})
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1.5 p-1 bg-amber-50 rounded w-fit mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  Aguardando disparo
                                </span>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 text-slate-600">
                            {paciente?.acs || "Não inf."}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium truncate max-w-[150px] inline-block">
                              {paciente?.condicao || "NENHUM"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {consulta.tipo_profissional}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">
                            {badge.textoDias}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-md text-xs font-bold border ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => solicitarDisparo(consulta)}
                              className="bg-slate-800 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 mx-auto w-full max-w-[120px]"
                            >
                              Disparar Msg
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* VISUALIZAÇÃO MOBILE (Cards) */}
              <div className="block lg:hidden grid grid-cols-1 gap-4 p-2">
                {itensAtuais.map((consulta, index) => {
                  const paciente = consulta.pacientes;
                  const badge = getBadgeInfo(consulta);
                  
                  // LÓGICA DE HISTÓRICO APLICADA AQUI (Mobile)
                  const mensagens = paciente?.historico_mensagens || [];
                  const ultimaMensagem = mensagens.length > 0 
                    ? mensagens.sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio))[0] 
                    : null;

                  return (
                    <div
                      key={`mob-${index}`}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-start gap-2">
                        {/* SEÇÃO DO NOME/TELEFONE ATUALIZADA (Mobile) */}
                        <div>
                          <h3 className="font-bold text-slate-800 leading-tight">
                            {paciente?.nome_completo}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {paciente?.telefone || "Sem contato"}
                          </p>
                          
                          {/* INDICADOR VISUAL DE MENSAGEM */}
                          {ultimaMensagem ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5 inline-flex items-center gap-1 mt-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                               Notificado em {new Date(ultimaMensagem.data_envio).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-0.5 inline-flex items-center gap-1 mt-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                               Aguardando disparo
                            </span>
                          )}
                        </div>
                        
                        <span
                          className={`px-2 py-1.5 rounded-md text-[10px] font-bold border shrink-0 mt-1 ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Agente / ACS
                          </span>
                          <span className="text-slate-700 line-clamp-1">
                            {paciente?.acs || "Não inf."}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Condição
                          </span>
                          <span className="text-slate-700 line-clamp-1">
                            {paciente?.condicao || "NENHUM"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Profissional
                          </span>
                          <span className="text-slate-700 font-medium">
                            {consulta.tipo_profissional}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Tempo
                          </span>
                          <span className="text-slate-700 font-bold">
                            {badge.textoDias}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => solicitarDisparo(consulta)}
                        className="w-full bg-slate-800 hover:bg-emerald-600 text-white py-3 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        Disparar Mensagem
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* RODAPÉ: CONTROLES DE PAGINAÇÃO */}
        {!loading && consultasFiltradas.length > 0 && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-slate-600 text-center sm:text-left">
              Mostrando{" "}
              <span className="font-semibold text-slate-800">
                {indicePrimeiroItem + 1}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(indiceUltimoItem, consultasFiltradas.length)}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-800">
                {consultasFiltradas.length}
              </span>{" "}
              resultados
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={irParaPaginaAnterior}
                disabled={paginaAtual === 1}
                className="p-2 border border-slate-300 rounded-md bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronLeft className="text-sm" />
              </button>
              <span className="text-sm font-medium text-slate-700 px-2">
                Página {paginaAtual} de {totalPaginas}
              </span>
              <button
                onClick={irParaProximaPagina}
                disabled={paginaAtual === totalPaginas}
                className="p-2 border border-slate-300 rounded-md bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronRight className="text-sm" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RENDERIZAÇÃO DOS MODAIS */}
      <ModalConfirmacao
        isOpen={modalConfirmacao.isOpen}
        titulo="Confirmar Disparo"
        mensagem={`Deseja enviar um aviso via WhatsApp para ${modalConfirmacao.consulta?.pacientes?.nome_completo}?`}
        onCancel={() => setModalConfirmacao({ isOpen: false, consulta: null })}
        onConfirm={confirmarDisparo}
      />

      <ModalAlerta
        isOpen={alerta.isOpen}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensagem={alerta.mensagem}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />
    </div>
  );
}
