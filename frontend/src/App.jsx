import { useState, useEffect } from "react";
import {
  FaBullhorn,
  FaCalendarPlus,
  FaChartLine,
  FaLayerGroup,
} from "react-icons/fa";

// Importação das Peças e Telas
import Header from "./components/Header";
import RoleGuard from "./components/RoleGuard";
import Dashboard from "./pages/Dashboard";
import ListaPacientes from "./pages/ListaPacientes";
import CadastroPaciente from "./pages/CadastroPaciente";
import AgendarConsulta from "./pages/AgendarConsulta";
import Configuracoes from "./pages/Configuracoes";
import Notificacoes from "./pages/Notificacoes";
import Login from "./pages/Login";
import GestaoGrupos from "./components/GestaoGrupos";
import { api } from "./api/services";

export default function App() {
  // ESTADOS DO SISTEMA
  const [activeTab, setActiveTab] = useState("pacientes");
  const [pacientesView, setPacientesView] = useState("lista");
  const [agendaView, setAgendaView] = useState("painel");
  const [comunicacaoView, setComunicacaoView] = useState("grupos");

  // Estados de Autenticação
  const [usuario, setUsuario] = useState(null);
  // Estado para segurar a tela enquanto valida a sessão no backend
  const [authLoading, setAuthLoading] = useState(true);

  // Verifica se existe sessão ativa e válida ao abrir o navegador
  useEffect(() => {
    let cancelado = false;

    const validarSessao = async () => {
      const token = localStorage.getItem("sgr_token");

      if (!token) {
        localStorage.removeItem("sgr_usuario");

        if (!cancelado) {
          setUsuario(null);
          setAuthLoading(false);
        }

        return;
      }

      try {
        const resposta = await api.getMe();

        if (cancelado) return;

        setUsuario(resposta.usuario);
        localStorage.setItem("sgr_usuario", JSON.stringify(resposta.usuario));
      } catch (error) {
        console.error("Erro ao validar sessão:", error);

        localStorage.removeItem("sgr_token");
        localStorage.removeItem("sgr_usuario");

        if (!cancelado) {
          setUsuario(null);
        }
      } finally {
        if (!cancelado) {
          setAuthLoading(false);
        }
      }
    };

    validarSessao();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    const handleSessaoExpirada = () => {
      setUsuario(null);
      setActiveTab("pacientes");
      setPacientesView("lista");
      setAgendaView("painel");
      setComunicacaoView("grupos");
    };

    window.addEventListener("sgr:sessao-expirada", handleSessaoExpirada);

    return () => {
      window.removeEventListener("sgr:sessao-expirada", handleSessaoExpirada);
    };
  }, []);

  // Função para sair do sistema (limpa o cache e volta pra tela de login)
  const handleLogout = () => {
    localStorage.removeItem("sgr_token");
    localStorage.removeItem("sgr_usuario");
    setUsuario(null);
    setActiveTab("pacientes");
    setPacientesView("lista");
    setAgendaView("painel");
    setComunicacaoView("grupos");
  };

  const handleLoginSucesso = (dadosUser) => {
    setUsuario(dadosUser);
    setActiveTab("pacientes");
  };

  const navegarPara = (tab) => {
    if (tab === "cadastro") {
      setPacientesView("cadastro");
      setActiveTab("pacientes");
      return;
    }

    if (tab === "consulta") {
      const podeAgendar = ["ADMIN", "RECEPCAO"].includes(usuario?.funcao);
      setAgendaView(podeAgendar ? "agendar" : "painel");
      setActiveTab("agenda");
      return;
    }

    if (tab === "dashboard") {
      setAgendaView("painel");
      setActiveTab("agenda");
      return;
    }

    if (tab === "grupos") {
      setComunicacaoView("grupos");
      setActiveTab("comunicacao");
      return;
    }

    if (tab === "notificacoes") {
      setComunicacaoView("mensageria");
      setActiveTab("comunicacao");
      return;
    }

    setActiveTab(tab);

    if (tab === "pacientes") setPacientesView("lista");
    if (tab === "agenda") setAgendaView("painel");
    if (tab === "comunicacao") setComunicacaoView("grupos");
  };

  // BARREIRA 1: A TELA DE CARREGAMENTO (Evita o piscar)
  // Enquanto o useEffect não der a resposta final, mostra um spinner de carregamento elegante
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // BARREIRA 2: O "SEGURANÇA DA PORTA"
  // Se a verificação terminou e não tem usuário, renderiza APENAS o Login
  if (!usuario) {
    return <Login onLoginSucesso={handleLoginSucesso} />;
  }

  // SE ESTIVER LOGADO, RENDERIZA O SISTEMA NORMALMENTE
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* O Header recebe o usuário e a função de logout */}
      <Header
        activeTab={activeTab}
        setActiveTab={navegarPara}
        usuario={usuario}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto py-6 px-2 sm:px-6 lg:px-8 w-full">
        {activeTab === "pacientes" && (
          <>
            {pacientesView === "lista" && (
              <ListaPacientes onNovoPaciente={() => setPacientesView("cadastro")} />
            )}
            {pacientesView === "cadastro" && (
              <CadastroPaciente onSuccess={() => setPacientesView("lista")} />
            )}
          </>
        )}

        {activeTab === "agenda" && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <button
                type="button"
                onClick={() => setAgendaView("painel")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${agendaView === "painel" ? "bg-sky-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <FaChartLine /> Painel
              </button>
              <RoleGuard rolesAllowed={["ADMIN", "RECEPCAO"]}>
                <button
                  type="button"
                  onClick={() => setAgendaView("agendar")}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${agendaView === "agendar" ? "bg-sky-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <FaCalendarPlus /> Agendar
                </button>
              </RoleGuard>
            </div>

            {agendaView === "painel" && <Dashboard />}
            {agendaView === "agendar" && (
              <AgendarConsulta onSuccess={() => setAgendaView("painel")} />
            )}
          </div>
        )}

        {activeTab === "comunicacao" && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <button
                type="button"
                onClick={() => setComunicacaoView("grupos")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${comunicacaoView === "grupos" ? "bg-sky-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <FaLayerGroup /> Grupos
              </button>
              <button
                type="button"
                onClick={() => setComunicacaoView("mensageria")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${comunicacaoView === "mensageria" ? "bg-sky-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <FaBullhorn /> Mensageria
              </button>
            </div>

            {comunicacaoView === "grupos" && <GestaoGrupos usuario={usuario} />}
            {comunicacaoView === "mensageria" && (
              <Notificacoes usuario={usuario} />
            )}
          </div>
        )}

        {/* NOVA CONDICIONAL: Renderiza a tela de configurações se a aba estiver ativa */}
        {activeTab === "configuracoes" && <Configuracoes />}
      </main>
    </div>
  );
}
