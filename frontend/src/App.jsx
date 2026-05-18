import React, { useState, useEffect } from 'react';

// Importação das Peças e Telas
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ListaPacientes from './pages/ListaPacientes';
import CadastroPaciente from './pages/CadastroPaciente';
import AgendarConsulta from './pages/AgendarConsulta';
import Login from './pages/Login'; // <-- IMPORTAÇÃO DA TELA DE LOGIN

export default function App() {
  // ESTADOS DO SISTEMA
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // NOVO: Estado de Autenticação
  const [usuario, setUsuario] = useState(null); 

  // NOVO: Verifica se existe sessão ativa (token) ao abrir o navegador
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('sgr_usuario');
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
  }, []);

  // NOVO: Função para sair do sistema (limpa o cache e volta pra tela de login)
  const handleLogout = () => {
    localStorage.removeItem('sgr_token');
    localStorage.removeItem('sgr_usuario');
    setUsuario(null);
    setActiveTab('dashboard'); // Reseta a aba para a próxima vez que logar
  };

  // O "SEGURANÇA DA PORTA": Se não tem usuário no estado, renderiza APENAS o Login
  if (!usuario) {
    return <Login onLoginSucesso={(dadosUser) => setUsuario(dadosUser)} />;
  }

  // SE ESTIVER LOGADO, RENDERIZA O SISTEMA NORMALMENTE
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* O Header agora recebe o usuário e a função de logout para uso futuro */}
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
      </main>

    </div>
  );
}