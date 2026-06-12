import { useState, useEffect } from "react";

// Importação das Peças e Telas
import Header from "./components/Header";
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
  const [activeTab, setActiveTab] = useState("dashboard");

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
      setActiveTab("dashboard");
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
    setActiveTab("dashboard"); // Reseta a aba para a próxima vez que logar
  };

  const handleLoginSucesso = (dadosUser) => {
    setUsuario(dadosUser);
    setActiveTab("dashboard");
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
        setActiveTab={setActiveTab}
        usuario={usuario}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto py-6 px-2 sm:px-6 lg:px-8 w-full">
        {activeTab === "dashboard" && <Dashboard />}

        {activeTab === "pacientes" && <ListaPacientes />}

        {activeTab === "cadastro" && (
          <CadastroPaciente onSuccess={() => setActiveTab("consulta")} />
        )}

        {activeTab === "consulta" && (
          <AgendarConsulta onSuccess={() => setActiveTab("dashboard")} />
        )}

        {activeTab === "grupos" && <GestaoGrupos usuario={usuario} />}

        {/* NOVA CONDICIONAL: Renderiza a tela de configurações se a aba estiver ativa */}
        {activeTab === "configuracoes" && <Configuracoes />}

        {/* NOVA CONDICIONAL: A tela de disparos em massa da Evolution API */}
        {activeTab === "notificacoes" && <Notificacoes usuario={usuario} />}
      </main>
    </div>
  );
}
