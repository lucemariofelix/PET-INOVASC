import { useEffect, useState } from "react";
import { FaBullhorn, FaLayerGroup, FaPlus, FaSave, FaTimes } from "react-icons/fa";
import { api } from "../api/services";
import ModalAlerta from "./ModalAlerta";

export default function GestaoGrupos({ usuario }) {
  const [grupos, setGrupos] = useState([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [grupoDisparo, setGrupoDisparo] = useState(null);
  const [mensagemDisparo, setMensagemDisparo] = useState("");
  const [disparando, setDisparando] = useState(false);
  const [alerta, setAlerta] = useState({
    isOpen: false,
    tipo: "",
    titulo: "",
    mensagem: "",
  });

  const podeCriar = ["ADMIN", "RECEPCAO"].includes(usuario?.funcao);

  const carregarGrupos = async () => {
    setLoading(true);

    try {
      const data = await api.getGrupos();
      setGrupos(data.grupos || data || []);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
      setAlerta({
        isOpen: true,
        tipo: "erro",
        titulo: "Erro ao carregar grupos",
        mensagem: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarGrupos();
  }, []);

  const formatarData = (dataIso) => {
    if (!dataIso) return "Não informado";

    return new Date(dataIso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      setAlerta({
        isOpen: true,
        tipo: "aviso",
        titulo: "Nome obrigatório",
        mensagem: "Informe um nome para o grupo de acompanhamento.",
      });
      return;
    }

    try {
      setSalvando(true);
      await api.criarGrupo({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
      });

      setNome("");
      setDescricao("");
      await carregarGrupos();

      setAlerta({
        isOpen: true,
        tipo: "sucesso",
        titulo: "Grupo criado",
        mensagem: "Grupo de acompanhamento cadastrado com sucesso.",
      });
    } catch (error) {
      setAlerta({
        isOpen: true,
        tipo: "erro",
        titulo: "Erro ao salvar grupo",
        mensagem: error.message,
      });
    } finally {
      setSalvando(false);
    }
  };

  const abrirModalDisparo = (grupo) => {
    setGrupoDisparo(grupo);
    setMensagemDisparo("");
  };

  const fecharModalDisparo = () => {
    if (disparando) return;

    setGrupoDisparo(null);
    setMensagemDisparo("");
  };

  const handleDisparoGrupo = async () => {
    if (!mensagemDisparo.trim()) {
      setAlerta({
        isOpen: true,
        tipo: "aviso",
        titulo: "Mensagem obrigatória",
        mensagem: "Informe a mensagem antes de iniciar o disparo.",
      });
      return;
    }

    try {
      setDisparando(true);
      const resultado = await api.dispararGrupo(
        grupoDisparo.id,
        mensagemDisparo.trim(),
      );

      setGrupoDisparo(null);
      setMensagemDisparo("");

      setAlerta({
        isOpen: true,
        tipo: "sucesso",
        titulo: "Disparo finalizado",
        mensagem:
          resultado.mensagem ||
          "Mensagem enviada para o grupo de acompanhamento.",
      });
    } catch (error) {
      setAlerta({
        isOpen: true,
        tipo: "erro",
        titulo: "Erro no disparo",
        mensagem: error.message,
      });
    } finally {
      setDisparando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <FaLayerGroup className="text-sky-700" /> Grupos de Acompanhamento
        </h2>
        <p className="text-slate-500 text-sm sm:text-base mt-1">
          Organize pacientes por linhas de cuidado, condições e campanhas.
        </p>
      </div>

      {podeCriar && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <FaPlus className="text-sky-700" />
            Novo Grupo
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Nome *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                placeholder="Ex: Hipertensos"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Descrição
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                placeholder="Ex: Pacientes com HAS em acompanhamento"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white font-bold py-2.5 px-5 rounded-lg shadow-md transition disabled:opacity-70"
            >
              <FaSave />
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Grupos Cadastrados</h3>
            <p className="text-sm text-slate-500">
              {loading ? "Carregando..." : `${grupos.length} grupo(s)`}
            </p>
          </div>
          <button
            type="button"
            onClick={carregarGrupos}
            disabled={loading}
            className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-70"
          >
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700"></div>
          </div>
        ) : grupos.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum grupo de acompanhamento cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Data de Criação</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grupos.map((grupo) => (
                  <tr key={grupo.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {grupo.nome}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {grupo.descricao || (
                        <span className="text-slate-400 italic">
                          Sem descrição
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatarData(grupo.criado_em)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => abrirModalDisparo(grupo)}
                          disabled={!podeCriar}
                          title={
                            podeCriar
                              ? "Disparar mensagem"
                              : "Sem permissão para disparar"
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FaBullhorn />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {grupoDisparo && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl border border-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Enviando mensagem para o grupo: {grupoDisparo.nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={fecharModalDisparo}
                disabled={disparando}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                title="Fechar"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <textarea
                value={mensagemDisparo}
                onChange={(e) => setMensagemDisparo(e.target.value)}
                disabled={disparando}
                rows={6}
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                placeholder="Digite a mensagem para os pacientes deste grupo"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={fecharModalDisparo}
                  disabled={disparando}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDisparoGrupo}
                  disabled={disparando}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-sky-800 disabled:opacity-70"
                >
                  <FaBullhorn />
                  {disparando ? "Enviando..." : "Iniciar Disparo"}
                </button>
              </div>
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
