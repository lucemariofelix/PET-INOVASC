import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHeartbeat,
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
import { usuariosApi } from "../api/usuarios";
import { useAuth } from "../hooks/useAuth";
import { comprimirAvatar } from "../utils/avatar";

function AvatarButton({ usuario, carregando, imagemFalhou, onErro, onClick, tamanho }) {
  const dimensao = tamanho === "mobile" ? "h-10 w-10" : "h-8 w-8";
  const icone = tamanho === "mobile" ? "text-3xl" : "text-2xl";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      className={`relative flex ${dimensao} shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-500/60 bg-sky-900/40 text-sky-200 transition hover:border-sky-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait`}
      aria-label="Alterar foto de perfil"
      title="Alterar foto de perfil"
    >
      {usuario?.avatar_url && !imagemFalhou ? (
        <img
          src={usuario.avatar_url}
          alt={`Foto de perfil de ${usuario.nome}`}
          className="h-full w-full object-cover"
          onError={onErro}
        />
      ) : (
        <FaUserCircle className={icone} aria-hidden="true" />
      )}
      {carregando ? (
        <span className="absolute inset-0 flex items-center justify-center bg-sky-950/75">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        </span>
      ) : null}
    </button>
  );
}

const getActiveTab = (pathname) => {
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/comunicacao")) return "comunicacao";
  if (pathname.startsWith("/configuracoes")) return "configuracoes";
  return "pacientes";
};

export default function Header({ usuario, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [enviandoAvatar, setEnviandoAvatar] = useState(false);
  const [imagemAvatarFalhou, setImagemAvatarFalhou] = useState(false);
  const [mensagemAvatar, setMensagemAvatar] = useState(null);
  const inputAvatarRef = useRef(null);
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = getActiveTab(location.pathname);

  useEffect(() => {
    setImagemAvatarFalhou(false);
  }, [usuario?.avatar_url]);

  useEffect(() => {
    if (!mensagemAvatar) return undefined;
    const timer = window.setTimeout(() => setMensagemAvatar(null), 5000);
    return () => window.clearTimeout(timer);
  }, [mensagemAvatar]);

  const selecionarAvatar = () => {
    if (!enviandoAvatar) inputAvatarRef.current?.click();
  };

  const atualizarAvatar = async (event) => {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo || enviandoAvatar) return;

    setEnviandoAvatar(true);
    setMensagemAvatar(null);
    try {
      const { default: imageCompression } = await import(
        "browser-image-compression"
      );
      const avatarComprimido = await comprimirAvatar(
        arquivo,
        imageCompression,
      );
      await usuariosApi.atualizarAvatar(avatarComprimido);
      await refreshSession();
      setMensagemAvatar({ tipo: "sucesso", texto: "Foto de perfil atualizada." });
    } catch (error) {
      setMensagemAvatar({
        tipo: "erro",
        texto: error.message || "Não foi possível atualizar a foto de perfil.",
      });
    } finally {
      setEnviandoAvatar(false);
    }
  };

  const handleTabClick = (tab) => {
    const rotas = {
      pacientes: "/pacientes",
      agenda: "/agenda",
      comunicacao: "/comunicacao/grupos",
      configuracoes: "/configuracoes",
    };

    navigate(rotas[tab] || "/pacientes");
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-sky-800 shadow-md relative z-50">
      <input
        ref={inputAvatarRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={atualizarAvatar}
      />
      {mensagemAvatar ? (
        <div
          role={mensagemAvatar.tipo === "erro" ? "alert" : "status"}
          aria-live="polite"
          className={`absolute right-4 top-full mt-2 max-w-xs rounded-lg border px-3 py-2 text-sm font-medium shadow-lg ${
            mensagemAvatar.tipo === "erro"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {mensagemAvatar.texto}
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-4 sm:px-8">
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
              onClick={() => handleTabClick("pacientes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "pacientes" ? "bg-white text-sky-800 shadow-sm" : "text-sky-100 hover:text-white"}`}
            >
              <FaList /> Pacientes
            </button>

            <button
              onClick={() => handleTabClick("agenda")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "agenda" ? "bg-white text-sky-800 shadow-sm" : "text-sky-100 hover:text-white"}`}
            >
              <FaCalendarPlus /> Agenda
            </button>

            <RoleGuard rolesAllowed={["ADMIN", "RECEPCAO", "ACS"]}>
              <button
                onClick={() => handleTabClick("comunicacao")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "comunicacao" ? "bg-white text-sky-800 shadow-sm" : "text-sky-100 hover:text-white"}`}
              >
                <FaBullhorn /> Comunicação
              </button>
            </RoleGuard>

            <RoleGuard rolesAllowed={["ADMIN", "RECEPCAO"]}>
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
                <AvatarButton
                  usuario={usuario}
                  carregando={enviandoAvatar}
                  imagemFalhou={imagemAvatarFalhou}
                  onErro={() => setImagemAvatarFalhou(true)}
                  onClick={selecionarAvatar}
                  tamanho="desktop"
                />
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

            <button
              onClick={() => handleTabClick("agenda")}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-base font-medium transition-colors ${activeTab === "agenda" ? "bg-sky-100 text-sky-900" : "text-sky-100 hover:bg-sky-700"}`}
            >
              <FaCalendarPlus
                className={
                  activeTab === "agenda" ? "text-sky-700" : "text-sky-300"
                }
              />
              Agenda
            </button>

            <RoleGuard rolesAllowed={["ADMIN", "RECEPCAO", "ACS"]}>
              <button
                onClick={() => handleTabClick("comunicacao")}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-base font-medium transition-colors ${activeTab === "comunicacao" ? "bg-sky-100 text-sky-900" : "text-sky-100 hover:bg-sky-700"}`}
              >
                <FaBullhorn
                  className={
                    activeTab === "comunicacao"
                      ? "text-sky-700"
                      : "text-sky-300"
                  }
                />
                Comunicação
              </button>
            </RoleGuard>

            <RoleGuard rolesAllowed={["ADMIN", "RECEPCAO"]}>
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
                <AvatarButton
                  usuario={usuario}
                  carregando={enviandoAvatar}
                  imagemFalhou={imagemAvatarFalhou}
                  onErro={() => setImagemAvatarFalhou(true)}
                  onClick={selecionarAvatar}
                  tamanho="mobile"
                />
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
