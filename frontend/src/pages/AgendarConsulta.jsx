import React, { useState, useEffect } from 'react';
import { FaCalendarPlus } from 'react-icons/fa';
import { api } from '../api/services';
import { formatarDocumento } from '../utils/formatters';

export default function AgendarConsulta({ onSuccess }) {
  // Estados para carregar a lista de pacientes no motor de busca
  const [pacientesOptions, setPacientesOptions] = useState([]);
  
  // Estados do Formulário de Consulta
  const [consultaPacienteId, setConsultaPacienteId] = useState('');
  const [tipoProfissional, setTipoProfissional] = useState('MEDICO');
  const [dataUltimaConsulta, setDataUltimaConsulta] = useState('');
  const [dataProximaConsulta, setDataProximaConsulta] = useState('');

  // Estados da Busca Dinâmica
  const [buscaTermo, setBuscaTermo] = useState('');
  const [pacienteSelecionadoNome, setPacienteSelecionadoNome] = useState('');
  const [mostrarListaBusca, setMostrarListaBusca] = useState(false);

  // Busca a lista de pacientes assim que a tela abre
  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const data = await api.getPacientes();
        setPacientesOptions(data.pacientes || data || []);
      } catch (err) {
        console.error("Erro ao buscar pacientes para o agendamento:", err);
      }
    };
    fetchPacientes();
  }, []);

  // Lógica do filtro
  const pacientesFiltrados = pacientesOptions.filter(p => {
    const termoLower = buscaTermo.toLowerCase();
    const nomeLower = (p.nome_completo || '').toLowerCase();
    const cpfString = (p.cpf_cns || '');
    return nomeLower.includes(termoLower) || cpfString.includes(termoLower);
  });

  const selecionarPaciente = (paciente) => {
    setConsultaPacienteId(paciente.id);
    setPacienteSelecionadoNome(`${paciente.nome_completo} (Doc: ${formatarDocumento(paciente.cpf_cns)})`);
    setBuscaTermo('');
    setMostrarListaBusca(false);
  };

  const deselecionarPaciente = () => {
    setConsultaPacienteId('');
    setPacienteSelecionadoNome('');
    setBuscaTermo('');
  };

  const handleSubmitConsulta = async (e) => {
    e.preventDefault();
    if (!consultaPacienteId) return alert("Por favor, pesquise e selecione um paciente primeiro.");

    const payload = { 
      paciente_id: consultaPacienteId, 
      tipo_profissional: tipoProfissional, 
      data_ultima_consulta: dataUltimaConsulta || null, 
      data_proxima_consulta: dataProximaConsulta, 
      status_consulta: 'AGENDADA' 
    };

    try {
      await api.criarConsulta(payload);
      alert('Consulta agendada com sucesso!');
      
      // Limpa os campos
      deselecionarPaciente();
      setTipoProfissional('MEDICO'); 
      setDataUltimaConsulta(''); 
      setDataProximaConsulta('');
      
      // Avisa o App.jsx para mudar de aba
      if (onSuccess) onSuccess(); 
      
    } catch(err) {
       alert(`Erro: ${err.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-in fade-in zoom-in-95 duration-300">
      <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <FaCalendarPlus className="text-sky-700"/> Agendar Consulta / Procedimento
      </h2>
      <p className="text-slate-500 text-sm mb-8">Vincule um atendimento futuro ou passado ao histórico de um paciente.</p>
      
      <form onSubmit={handleSubmitConsulta} className="space-y-5">
        <div className="space-y-1 relative">
          <label className="text-sm font-semibold text-slate-700">Pesquisar Paciente *</label>
          {!consultaPacienteId ? (
            <div className="relative">
              <input type="text" value={buscaTermo} 
                onChange={e => { setBuscaTermo(e.target.value); setMostrarListaBusca(true); }}
                onFocus={() => setMostrarListaBusca(true)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" 
                placeholder="Digite o Nome ou CPF do paciente..." 
              />
              {mostrarListaBusca && buscaTermo.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {pacientesFiltrados.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-slate-500">Nenhum paciente encontrado.</li>
                  ) : (
                    pacientesFiltrados.map(p => (
                      <li key={p.id} onClick={() => selecionarPaciente(p)} className="px-4 py-2.5 hover:bg-sky-50 cursor-pointer border-b border-slate-100 last:border-0">
                        <div className="font-semibold text-slate-800">{p.nome_completo}</div>
                        <div className="text-xs text-slate-500">Doc: {formatarDocumento(p.cpf_cns || '')}</div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-lg px-4 py-2.5">
              <span className="font-semibold text-sky-800">{pacienteSelecionadoNome}</span>
              <button type="button" onClick={deselecionarPaciente} className="text-sky-600 hover:text-red-600 text-sm font-bold cursor-pointer">
                Trocar
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">Tipo de Profissional / Especialidade *</label>
          <select required value={tipoProfissional} onChange={e => setTipoProfissional(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white">
            <option value="MEDICO">Médico(a)</option>
            <option value="ENFERMEIRO">Enfermeiro(a)</option>
            <option value="DENTISTA">Odontologia</option>
            <option value="NUTRICAO">Nutricionista</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Data da Próxima Consulta *</label>
            <input type="date" required value={dataProximaConsulta} onChange={e => setDataProximaConsulta(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" />
            <p className="text-xs text-slate-500">Agendamento futuro (usado para o lembrete azul).</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Data da Última Consulta</label>
            <input type="date" value={dataUltimaConsulta} onChange={e => setDataUltimaConsulta(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" />
              <p className="text-xs text-slate-500">Opcional. Quando foi a última vez na unidade?</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button type="submit" className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition cursor-pointer">
            Salvar Agendamento
          </button>
        </div>
      </form>
    </div>
  );
}