import React, { useState, useEffect } from 'react';

// Importação das Peças e Telas
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ListaPacientes from './pages/ListaPacientes';
import CadastroPaciente from './pages/CadastroPaciente';
import AgendarConsulta from './pages/AgendarConsulta';
import Configuracoes from './pages/Configuracoes'; // <-- INCLUSÃO DA NOVA TELA
import Login from './pages/Login'; 

export default function App() {
  // ESTADOS DO SISTEMA
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados de Autenticação
  const [usuario, setUsuario] = useState(null); 
  // Estado para segurar a tela enquanto lê o LocalStorage
  const [verificando, setVerificando] = useState(true);

  // Verifica se existe sessão ativa (token) ao abrir o navegador
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('sgr_usuario');
    
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
    
    // Independente de ter achado o usuário ou não, a verificação terminou!
    setVerificando(false);
  }, []);

  // Função para sair do sistema (limpa o cache e volta pra tela de login)
  const handleLogout = () => {
    localStorage.removeItem('sgr_token');
    localStorage.removeItem('sgr_usuario');
    setUsuario(null);
    setActiveTab('dashboard'); // Reseta a aba para a próxima vez que logar
  };

  // BARREIRA 1: A TELA DE CARREGAMENTO (Evita o piscar)
  // Enquanto o useEffect não der a resposta final, mostra um spinner de carregamento elegante
  if (verificando) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // BARREIRA 2: O "SEGURANÇA DA PORTA" 
  // Se a verificação terminou e não tem usuário, renderiza APENAS o Login
  if (!usuario) {
    return <Login onLoginSucesso={(dadosUser) => setUsuario(dadosUser)} />;
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
        {activeTab === 'dashboard' && <Dashboard />}
        
        {activeTab === 'pacientes' && <ListaPacientes />}
        
        {activeTab === 'cadastro' && (
          <CadastroPaciente onSuccess={() => setActiveTab('consulta')} />
        )}
        
        {activeTab === 'consulta' && (
          <AgendarConsulta onSuccess={() => setActiveTab('dashboard')} />
        )}

        {/* NOVA CONDICIONAL: Renderiza a tela de configurações se a aba estiver ativa */}
        {activeTab === 'configuracoes' && <Configuracoes />}
      </main>

    </div>
  );
}
