import React, { useState, useEffect } from 'react';
import { FaList, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { api } from '../api/services';
import { formatarDocumento } from '../utils/formatters';

export default function ListaPacientes() {
  const [pacientesOptions, setPacientesOptions] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);

  // Estados da Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  const fetchPacientes = async () => {
    setLoadingPacientes(true);
    try {
      const data = await api.getPacientes();
      const lista = data.pacientes || data || [];
      setPacientesOptions(lista);
      setPaginaAtual(1); // Reseta a página ao atualizar
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err);
    } finally {
      setLoadingPacientes(false);
    }
  };

  // Carrega os dados assim que a aba é aberta
  useEffect(() => {
    fetchPacientes();
  }, []);

  // Lógica de Paginação
  const indexOfLastItem = paginaAtual * itensPorPagina;
  const indexOfFirstItem = indexOfLastItem - itensPorPagina;
  const pacientesAtuais = pacientesOptions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPaginas = Math.ceil(pacientesOptions.length / itensPorPagina);

  const irParaProximaPagina = () => { if (paginaAtual < totalPaginas) setPaginaAtual(paginaAtual + 1); };
  const irParaPaginaAnterior = () => { if (paginaAtual > 1) setPaginaAtual(paginaAtual - 1); };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaList className="text-sky-700" /> Diretório de Pacientes
          </h2>
          <p className="text-slate-500 text-sm mt-1">Visão geral e condições clínicas da unidade.</p>
        </div>
        <button onClick={fetchPacientes} className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer">
          Atualizar Lista
        </button>
      </div>

      <div className="overflow-x-auto">
        {loadingPacientes ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700"></div>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Paciente / Documento</th>
                  <th className="px-6 py-4">Agente (ACS)</th>
                  <th className="px-6 py-4">Condição Clínica</th>
                  <th className="px-6 py-4 text-center">Status Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pacientesAtuais.map((pac, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{pac.nome_completo}</p>
                      <p className="text-xs text-slate-400">Doc: {formatarDocumento(pac.cpf_cns)}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {pac.acs ? pac.acs : <span className="text-slate-400 italic">Não Informado</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        pac.condicao === 'HIPERTENSO' ? 'bg-blue-100 text-blue-700' :
                        pac.condicao === 'DIABETICO' ? 'bg-purple-100 text-purple-700' :
                        pac.condicao === 'AMBOS' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pac.condicao || 'NENHUMA'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${pac.status_telefone === 'VALIDO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {pac.status_telefone || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* CONTROLES DE PAGINAÇÃO */}
            {pacientesOptions.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <p className="text-sm text-slate-500">
                  Mostrando <span className="font-bold text-slate-700">{indexOfFirstItem + 1}</span> a <span className="font-bold text-slate-700">{Math.min(indexOfLastItem, pacientesOptions.length)}</span> de <span className="font-bold text-slate-700">{pacientesOptions.length}</span> pacientes
                </p>
                <div className="flex gap-2">
                  <button onClick={irParaPaginaAnterior} disabled={paginaAtual === 1} className={`flex items-center gap-1 px-3 py-1.5 rounded border ${paginaAtual === 1 ? 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed' : 'border-slate-300 text-slate-700 hover:bg-slate-200 cursor-pointer transition'}`}>
                    <FaChevronLeft className="text-xs" /> Anterior
                  </button>
                  <button onClick={irParaProximaPagina} disabled={paginaAtual === totalPaginas} className={`flex items-center gap-1 px-3 py-1.5 rounded border ${paginaAtual === totalPaginas ? 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed' : 'border-slate-300 text-slate-700 hover:bg-slate-200 cursor-pointer transition'}`}>
                    Próxima <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}