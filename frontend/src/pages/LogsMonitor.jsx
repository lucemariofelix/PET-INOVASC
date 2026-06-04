import { useState, useEffect } from "react";
import api from "../api/services"; // Ajuste o caminho se necessário
import { FaHistory, FaUserShield } from "react-icons/fa";

export default function LogsMonitor() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarLogs = async () => {
      try {
        const dados = await api.getLogs();
        setLogs(dados);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    carregarLogs();
  }, []);

  const formatarData = (dataIso) => {
    return new Date(dataIso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading) return <div className="p-4 text-sky-800">Carregando auditoria...</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-sky-100 mt-6">
      <div className="flex items-center gap-3 mb-6 border-b border-sky-100 pb-4">
        <div className="p-3 bg-sky-100 text-sky-800 rounded-lg">
          <FaHistory size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-sky-900">Monitor de Atividades</h2>
          <p className="text-sm text-sky-600">Registro das últimas 100 ações no sistema</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sky-50 text-sky-800 text-sm">
              <th className="p-3 font-semibold rounded-tl-md">Data / Hora</th>
              <th className="p-3 font-semibold">Usuário</th>
              <th className="p-3 font-semibold">Ação</th>
              <th className="p-3 font-semibold rounded-tr-md">Detalhes</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3 whitespace-nowrap text-gray-500">
                    {formatarData(log.created_at)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <FaUserShield className="text-sky-300" />
                      <span className="font-medium">{log.perfis_usuarios?.nome || 'Sistema'}</span>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-sky-700">{log.acao}</td>
                  <td className="p-3 text-gray-600">{log.detalhes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
