import { useState, useEffect } from "react";
import {
  FaQrcode,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCog,
  FaWhatsapp,
  FaUserShield,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaHistory, // <-- Ícone novo para a Auditoria
} from "react-icons/fa";
import { api } from "../api/services";
import ModalAlerta from "../components/ModalAlerta";

export default function Configuracoes() {
  // Controle de Abas Internas (WhatsApp vs Usuários vs Auditoria)
  const [abaAtiva, setAbaAtiva] = useState("whatsapp");

  // ==========================================
  // ESTADOS: WHATSAPP
  // ==========================================
  const [statusWpp, setStatusWpp] = useState("loading");
  const [qrCodeBase64, setQrCodeBase64] = useState("");

  // ==========================================
  // ESTADOS: USUÁRIOS
  // ==========================================
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Modais de Usuários
  const [modalUserAberto, setModalUserAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState({
    nome: "",
    email: "",
    senha: "",
    funcao: "ACS",
  });
  const [isEditando, setIsEditando] = useState(false);

  // ==========================================
  // ESTADOS: AUDITORIA (LOGS)
  // ==========================================
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [alerta, setAlerta] = useState({
    isOpen: false,
    tipo: "",
    titulo: "",
    mensagem: "",
  });

  // ==========================================
  // LÓGICA: WHATSAPP
  // ==========================================
  const checarConexao = async () => {
    try {
      const data = await api.getWhatsAppStatus();
      setStatusWpp(data.status);
      if (data.status === "qrcode") setQrCodeBase64(data.qrcode);
    } catch {
      setStatusWpp("error");
    }
  };

  useEffect(() => {
    checarConexao();
    const intervalo = setInterval(() => checarConexao(), 5000);
    return () => clearInterval(intervalo);
  }, []);

  // ==========================================
  // LÓGICA: USUÁRIOS E AUDITORIA
  // ==========================================
  const carregarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const data = await api.getUsuarios();
      setUsuarios(data.usuarios || data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const carregarLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Carrega os dados consoante a aba selecionada
  useEffect(() => {
    if (abaAtiva === "usuarios") carregarUsuarios();
    if (abaAtiva === "logs") carregarLogs();
  }, [abaAtiva]);

  const abrirModalNovo = () => {
    setIsEditando(false);
    setUsuarioAtual({ nome: "", email: "", senha: "", funcao: "ACS" });
    setModalUserAberto(true);
  };

  const abrirModalEdicao = (user) => {
    setIsEditando(true);
    setUsuarioAtual({ ...user, senha: "" });
    setModalUserAberto(true);
  };

  const confirmarExclusao = (user) => {
    setUsuarioAtual(user);
    setModalExcluirAberto(true);
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUsuarioAtual((prev) => ({ ...prev, [name]: value }));
  };

  const salvarUsuario = async (e) => {
    e.preventDefault();
    try {
      if (isEditando) {
        const payload = { ...usuarioAtual };
        if (!payload.senha) delete payload.senha;
        await api.atualizarUsuario(usuarioAtual.id, payload);
        setAlerta({
          isOpen: true,
          tipo: "sucesso",
          titulo: "Sucesso",
          mensagem: "Usuário atualizado com sucesso!",
        });
      } else {
        await api.criarUsuario(usuarioAtual);
        setAlerta({
          isOpen: true,
          tipo: "sucesso",
          titulo: "Sucesso",
          mensagem: "Novo usuário criado com sucesso!",
        });
      }
      setModalUserAberto(false);
      carregarUsuarios();
    } catch (error) {
      setAlerta({
        isOpen: true,
        tipo: "erro",
        titulo: "Erro",
        mensagem: error.message,
      });
    }
  };

  const excluirUsuario = async () => {
    try {
      await api.excluirUsuario(usuarioAtual.id);
      setModalExcluirAberto(false);
      carregarUsuarios();
      setAlerta({
        isOpen: true,
        tipo: "sucesso",
        titulo: "Excluído",
        mensagem: "Usuário removido do sistema.",
      });
    } catch (error) {
      setAlerta({
        isOpen: true,
        tipo: "erro",
        titulo: "Erro",
        mensagem: error.message,
      });
    }
  };

  const formatarData = (dataIso) => {
    return new Date(dataIso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <FaCog className="text-sky-700" /> Configurações do Sistema
        </h2>
        <p className="text-slate-500 text-sm sm:text-base mt-1">
          Gerenciamento do servidor, controle de acessos e monitorização.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Menu Lateral / Superior */}
        <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
          <button
            onClick={() => setAbaAtiva("whatsapp")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${abaAtiva === "whatsapp" ? "bg-sky-100 text-sky-800 shadow-sm border border-sky-200" : "text-slate-600 hover:bg-slate-200"}`}
          >
            <FaWhatsapp size={18} /> Servidor WhatsApp
          </button>

          <button
            onClick={() => setAbaAtiva("usuarios")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${abaAtiva === "usuarios" ? "bg-sky-100 text-sky-800 shadow-sm border border-sky-200" : "text-slate-600 hover:bg-slate-200"}`}
          >
            <FaUserShield size={18} /> Equipe e Acessos
          </button>

          <button
            onClick={() => setAbaAtiva("logs")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${abaAtiva === "logs" ? "bg-sky-100 text-sky-800 shadow-sm border border-sky-200" : "text-slate-600 hover:bg-slate-200"}`}
          >
            <FaHistory size={18} /> Auditoria
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 p-6 md:p-8">
          {/* ======================================================== */}
          {/* ABA 1: WHATSAPP */}
          {/* ======================================================== */}
          {abaAtiva === "whatsapp" && (
            <div className="animate-in fade-in">
              <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">
                Status da Evolution API
              </h3>
              <div className="flex flex-col items-center justify-center py-6">
                {statusWpp === "loading" && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-700"></div>
                    <p className="text-slate-500 font-medium">
                      Verificando status do servidor...
                    </p>
                  </div>
                )}

                {statusWpp === "connected" && (
                  <div className="flex flex-col items-center gap-3 text-center bg-emerald-50 p-6 rounded-xl border border-emerald-100 w-full max-w-md">
                    <FaCheckCircle className="text-emerald-500 text-5xl" />
                    <h4 className="font-bold text-emerald-800 text-lg">
                      WhatsApp Conectado
                    </h4>
                    <p className="text-emerald-600 text-sm">
                      A sessão está ativa e o SGR está pronto para realizar os
                      disparos automáticos.
                    </p>
                  </div>
                )}

                {statusWpp === "qrcode" && (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border border-amber-200">
                      <FaQrcode /> Aguardando leitura do QR Code
                    </div>
                    <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl">
                      <img
                        src={qrCodeBase64}
                        alt="QR Code WhatsApp"
                        className="w-64 h-64 object-contain"
                      />
                    </div>
                  </div>
                )}

                {(statusWpp === "error" || statusWpp === "unconfigured") && (
                  <div className="flex flex-col items-center gap-3 text-center bg-red-50 p-6 rounded-xl border border-red-100 w-full max-w-md">
                    <FaExclamationTriangle className="text-red-500 text-4xl" />
                    <h4 className="font-bold text-red-800">Falha de Conexão</h4>
                    <p className="text-red-600 text-sm">
                      Não foi possível conectar ao servidor. Verifique as
                      variáveis de ambiente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: USUÁRIOS E ACESSOS */}
          {/* ======================================================== */}
          {abaAtiva === "usuarios" && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
                <h3 className="text-lg font-bold text-slate-800">
                  Usuários do Sistema
                </h3>
                <button
                  onClick={abrirModalNovo}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <FaPlus /> Novo Usuário
                </button>
              </div>

              {loadingUsuarios ? (
                <div className="py-10 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700"></div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Nome / Email</th>
                        <th className="px-6 py-4">Função</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usuarios.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">
                              {user.nome}
                            </p>
                            <p className="text-xs text-slate-500">
                              {user.email}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${
                                user.funcao === "ADMIN"
                                  ? "bg-purple-100 text-purple-700"
                                  : user.funcao === "RECEPCAO"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {user.funcao}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center flex justify-center gap-3">
                            <button
                              onClick={() => abrirModalEdicao(user)}
                              className="text-slate-400 hover:text-sky-600 p-2 rounded-full hover:bg-sky-50 transition"
                              title="Editar"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => confirmarExclusao(user)}
                              className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"
                              title="Excluir"
                            >
                              <FaTrash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {usuarios.length === 0 && (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-6 py-8 text-center text-slate-500"
                          >
                            Nenhum usuário cadastrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: AUDITORIA (LOGS) */}
          {/* ======================================================== */}
          {abaAtiva === "logs" && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
                <h3 className="text-lg font-bold text-slate-800">
                  Monitor de Atividades
                </h3>
              </div>

              {loadingLogs ? (
                <div className="py-10 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700"></div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Data / Hora</th>
                        <th className="px-6 py-4">Usuário</th>
                        <th className="px-6 py-4">Ação</th>
                        <th className="px-6 py-4">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-6 py-8 text-center text-slate-500"
                          >
                            Nenhum registro encontrado.
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-500">
                              {formatarData(log.created_at)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 font-medium text-slate-800">
                                <FaUserShield className="text-sky-300" />
                                {log.perfis_usuarios?.nome || "Sistema"}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-sky-700">
                              {log.acao}
                            </td>
                            <td
                              className="px-6 py-4 text-slate-600 truncate max-w-xs"
                              title={log.detalhes}
                            >
                              {log.detalhes}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CRIAR / EDITAR USUÁRIO */}
      {/* ======================================================== */}
      {modalUserAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {isEditando ? (
                  <FaEdit className="text-sky-600" />
                ) : (
                  <FaUserShield className="text-sky-600" />
                )}
                {isEditando ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <button
                onClick={() => setModalUserAberto(false)}
                className="text-slate-400 hover:text-red-500 transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={salvarUsuario} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Nome de Exibição *
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  value={usuarioAtual.nome}
                  onChange={handleUserChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Email (Login) *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={usuarioAtual.email}
                  onChange={handleUserChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  {isEditando
                    ? "Nova Senha (deixe em branco para não alterar)"
                    : "Senha de Acesso *"}
                </label>
                <input
                  type="password"
                  name="senha"
                  required={!isEditando}
                  value={usuarioAtual.senha || ""}
                  onChange={handleUserChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Perfil de Acesso *
                </label>
                <select
                  name="funcao"
                  required
                  value={usuarioAtual.funcao}
                  onChange={handleUserChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                >
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                  <option value="RECEPCAO">
                    Recepção (Agendamentos e Cadastro)
                  </option>
                  <option value="ACS">Agente de Saúde (Visualização)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setModalUserAberto(false)}
                  className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition flex items-center gap-2"
                >
                  <FaSave />{" "}
                  {isEditando ? "Salvar Alterações" : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {/* ======================================================== */}
      {modalExcluirAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center animate-in zoom-in-95">
            <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Remover Usuário?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Tem certeza que deseja remover o acesso de{" "}
              <b>{usuarioAtual.nome}</b>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setModalExcluirAberto(false)}
                className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={excluirUsuario}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

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
