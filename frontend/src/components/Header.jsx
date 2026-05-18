import React from 'react';
import { 
  FaHeartbeat, 
  FaUserPlus, 
  FaCalendarPlus, 
  FaList, 
  FaSignOutAlt, 
  FaUserCircle 
} from 'react-icons/fa';

export default function Header({ activeTab, setActiveTab, usuario, onLogout }) {
  return (
    <header className="bg-sky-800 shadow-md py-4 px-4 sm:px-8 flex flex-col lg:flex-row items-center justify-between gap-4">
      
      {/* 1. LOGO E TÍTULO */}
      <div className="flex items-center gap-3 w-full lg:w-auto justify-center lg:justify-start">
        <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-800 font-bold text-xl shrink-0">
          <FaHeartbeat />
        </div>
        <div>
          <h1 className="text-white font-bold text-xl leading-tight">SGR-UBS</h1>
          <p className="text-sky-200 text-xs">Gestão e Busca Ativa</p>
        </div>
      </div>

      {/* 2. MENU DE NAVEGAÇÃO */}
      <nav className="flex flex-wrap justify-center gap-2 bg-sky-900/50 p-1 rounded-lg">
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'bg-white text-sky-800 shadow-sm' : 'text-sky-100 hover:text-white'}`}>
          <FaHeartbeat /> Alertas
        </button>
        <button onClick={() => setActiveTab('pacientes')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === 'pacientes' ? 'bg-white text-sky-800 shadow-sm' : 'text-sky-100 hover:text-white'}`}>
          <FaList /> Pacientes
        </button>
        <button onClick={() => setActiveTab('cadastro')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === 'cadastro' ? 'bg-white text-sky-800 shadow-sm' : 'text-sky-100 hover:text-white'}`}>
          <FaUserPlus /> Novo Paciente
        </button>
        <button onClick={() => setActiveTab('consulta')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === 'consulta' ? 'bg-white text-sky-800 shadow-sm' : 'text-sky-100 hover:text-white'}`}>
          <FaCalendarPlus /> Agendar
        </button>
      </nav>

      {/* 3. PERFIL DO USUÁRIO E BOTÃO DE SAIR */}
      {usuario && (
        <div className="flex items-center gap-4 w-full lg:w-auto justify-center lg:justify-end border-t border-sky-700/50 lg:border-none pt-4 lg:pt-0 mt-2 lg:mt-0">
          
          <div className="flex items-center gap-2 text-right">
            <FaUserCircle className="text-sky-200 text-2xl hidden sm:block" />
            <div className="text-left sm:text-right">
              <p className="text-white text-sm font-bold leading-tight">{usuario.nome}</p>
              <p className="text-sky-300 text-[10px] uppercase font-bold tracking-wider">{usuario.funcao}</p>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 bg-sky-900 hover:bg-red-600 text-sky-100 hover:text-white rounded-md text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            title="Sair do sistema"
          >
            <FaSignOutAlt />
            <span className="lg:hidden xl:inline">Sair</span>
          </button>
        </div>
      )}

    </header>
  );
}