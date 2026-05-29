import React, { useState } from "react";
import {
  FaHeartbeat,
  FaUserPlus,
  FaCalendarPlus,
  FaList,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaCog,
  FaBullhorn,
} from "react-icons/fa";
import RoleGuard from "../components/RoleGuard";

export default function Header({ activeTab, setActiveTab, usuario, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-sky-800 shadow-md relative z-50">
      <div className="py-4 px-4 sm:px-8 flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* 1. LOGO E TÍTULO */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
            {/* CORAÇÃO DA LOGO: Sempre Vermelho */}
            <FaHeartbeat className="text-red-500" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl leading-tight">
              SGR-UBS
            </h1>
            <p className="text-sky-200 text-xs">Gestão e Busca Ativa</p>
          </div>
        </div>

        {/* 2. BOTÃO HAMBÚRGUER */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden text-sky-100 hover:text-white p-2 focus:outline-none transition-colors cursor-pointer"
          aria-label="Abrir menu"
        >
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        {/* 3. MENU DESKTOP E PERFIL */}
        <div className="hidden lg:flex items-center gap-6">
          <nav className="flex flex-wrap justify-center gap-2 bg-sky-900/50 p-1 rounded-lg">
            <button
              onClick={() => handleTabClick("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "dashboard" ? "bg-white text-sky-800 shadow-sm" : "text-sky-100 hover:text-white"}`}
            >
              {/* CORAÇÃO DO MENU DESKTOP */}
              <FaHeartbeat
                className={
                  activeTab === "dashboard" ? "text-red-500" : "text-red-400"
                }
              />{" "}
              Alertas
            </button>

            <button
              onClick={() => handleTabClick("pacientes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "pacientes" ? "bg-white text-sky-800 shadow-sm" : "text-sky-100 hover:text-white"}`}
            >
              <FaList /> Pacientes
            </button>

            <RoleGuard rolesAllowed={["ADMIN", "RECEPCAO"]}>
              <button
                onClick={() => handleTabClick("cadastro")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "cadastro" ? "bg-white text-sky-800 shadow-sm" : "text-sky-100 hover:text-white"}`}
              >
                <FaUserPlus /> Novo Paciente
              </button>

              <button
                onClick={() => handleTabClick("consulta")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "consulta" ? "bg-white text-sky-800 shadow-sm" : "text-sky-100 hover:text-white"}`}
              >
                <FaCalendarPlus /> Agendar
              </button>
            </RoleGuard>

            {/* ABA MENSAGERIA */}
            <RoleGuard rolesAllowed={["ADMIN", "RECEPCAO", "ACS"]}>
              <button
                onClick={() => handleTabClick("notificacoes")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "notificacoes" ? "bg-white text-sky-800 shadow-sm" : "text-sky-100 hover:text-white"}`}
              >
                <FaBullhorn /> Mensageria
              </button>
            </RoleGuard>

            <RoleGuard rolesAllowed={["ADMIN"]}>
              <button
                onClick={() => handleTabClick("configuracoes")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "configuracoes" ? "bg-white text-sky-800 shadow-sm" : "text-sky-100 hover:text-white"}`}
              >
                <FaCog /> Configurações
              </button>
            </RoleGuard>
          </nav>

          {usuario && (
            <div className="flex items-center gap-4 pl-4 border-l border-sky-700/50">
              <div className="flex items-center gap-2 text-right">
                <FaUserCircle className="text-sky-200 text-2xl hidden xl:block" />
                <div className="text-right">
                  <p className="text-white text-sm font-bold leading-tight">
                    {usuario.nome}
                  </p>
                  <p className="text-sky-300 text-[10px] uppercase font-bold tracking-wider">
                    {usuario.funcao}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 bg-sky-900 hover:bg-red-600 text-sky-100 hover:text-white rounded-md text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                title="Sair do sistema"
              >
                <FaSignOutAlt />
                <span className="hidden xl:inline">Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. MENU MOBILE EXPANSÍVEL */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-sky-800 border-t border-sky-700 px-4 pt-3 pb-5 shadow-inner animate-in slide-in-from-top-2 duration-200 ease-out">
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => handleTabClick("dashboard")}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-base font-medium transition-colors ${activeTab === "dashboard" ? "bg-sky-100 text-sky-900" : "text-sky-100 hover:bg-sky-700"}`}
            >
              {/* CORAÇÃO DO MENU MOBILE */}
              <FaHeartbeat
                className={
                  activeTab === "dashboard" ? "text-red-500" : "text-red-400"
                }
              />
              Alertas
            </button>

            <button
              onClick={() => handleTabClick("pacientes")}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-base font-medium transition-colors ${activeTab === "pacientes" ? "bg-sky-100 text-sky-900" : "text-sky-100 hover:bg-sky-700"}`}
            >
              <FaList
                className={
                  activeTab === "pacientes" ? "text-sky-700" : "text-sky-300"
                }
              />
              Pacientes
            </button>

            <RoleGuard rolesAllowed={["ADMIN", "RECEPCAO"]}>
              <button
                onClick={() => handleTabClick("cadastro")}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-base font-medium transition-colors ${activeTab === "cadastro" ? "bg-sky-100 text-sky-900" : "text-sky-100 hover:bg-sky-700"}`}
              >
                <FaUserPlus
                  className={
                    activeTab === "cadastro" ? "text-sky-700" : "text-sky-300"
                  }
                />
                Novo Paciente
              </button>

              <button
                onClick={() => handleTabClick("consulta")}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-base font-medium transition-colors ${activeTab === "consulta" ? "bg-sky-100 text-sky-900" : "text-sky-100 hover:bg-sky-700"}`}
              >
                <FaCalendarPlus
                  className={
                    activeTab === "consulta" ? "text-sky-700" : "text-sky-300"
                  }
                />
                Agendar Consulta
              </button>
            </RoleGuard>

            {/* ABA MENSAGERIA NO MOBILE */}
            <RoleGuard rolesAllowed={["ADMIN", "RECEPCAO", "ACS"]}>
              <button
                onClick={() => handleTabClick("notificacoes")}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-base font-medium transition-colors ${activeTab === "notificacoes" ? "bg-sky-100 text-sky-900" : "text-sky-100 hover:bg-sky-700"}`}
              >
                <FaBullhorn
                  className={
                    activeTab === "notificacoes"
                      ? "text-sky-700"
                      : "text-sky-300"
                  }
                />
                Mensageria
              </button>
            </RoleGuard>

            <RoleGuard rolesAllowed={["ADMIN"]}>
              <button
                onClick={() => handleTabClick("configuracoes")}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-base font-medium transition-colors ${activeTab === "configuracoes" ? "bg-sky-100 text-sky-900" : "text-sky-100 hover:bg-sky-700"}`}
              >
                <FaCog
                  className={
                    activeTab === "configuracoes"
                      ? "text-sky-700"
                      : "text-sky-300"
                  }
                />
                Configurações
              </button>
            </RoleGuard>
          </nav>

          {usuario && (
            <div className="mt-5 pt-5 border-t border-sky-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaUserCircle className="text-sky-200 text-3xl" />
                <div>
                  <p className="text-white text-base font-bold leading-tight">
                    {usuario.nome}
                  </p>
                  <p className="text-sky-300 text-xs uppercase font-bold tracking-wider">
                    {usuario.funcao}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center justify-center p-3 bg-sky-900 hover:bg-red-600 text-sky-100 hover:text-white rounded-md transition-colors shadow-sm cursor-pointer"
                title="Sair"
              >
                <FaSignOutAlt size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
