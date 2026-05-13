import React, { useState, useEffect } from 'react';
// IMPORTANDO OS ÍCONES DO FONT AWESOME
import { FaHeartbeat, FaUserPlus, FaCalendarPlus, FaList, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function App() {
  // ============================================================================
  // VARIÁVEL DE AMBIENTE: O segredo da Nuvem!
  // ============================================================================
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [pacientesOptions, setPacientesOptions] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);

  // SIMULAÇÃO DO BANCO DE DADOS DE ACS (A lista fixa!)
  const listaACS = [
    "Área Descoberta",
    "Micro 01 - Maria Souza",
    "Micro 02 - João Pedro",
    "Micro 03 - Ana Clara",
    "Micro 04 - Carlos Eduardo",
    "Micro 05 - Luciana Gomes"
  ];

  // Estados do Formulário de Paciente
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [acs, setAcs] = useState(listaACS[0]);
  const [condicao, setCondicao] = useState('NENHUM');

  // Estados do Formulário de Consulta
  const [consultaPacienteId, setConsultaPacienteId] = useState('');
  const [tipoProfissional, setTipoProfissional] = useState('MEDICO');
  const [dataUltimaConsulta, setDataUltimaConsulta] = useState('');
  const [dataProximaConsulta, setDataProximaConsulta] = useState('');

  // Estados da Busca Dinâmica
  const [buscaTermo, setBuscaTermo] = useState('');
  const [pacienteSelecionadoNome, setPacienteSelecionadoNome] = useState('');
  const [mostrarListaBusca, setMostrarListaBusca] = useState(false);

  // Estados da Paginação (Aba Todos os Pacientes)
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  // ============================================================================
  // NOVA FUNÇÃO: MÁSCARA DINÂMICA PARA CPF OU SUS
  // ============================================================================
  const formatarDocumento = (valor) => {
    // Remove tudo que não for número
    const apenasNumeros = valor.replace(/\D/g, '');

    // Se tiver até 11 dígitos, aplica a máscara de CPF (000.000.000-00)
    if (apenasNumeros.length <= 11) {
      return apenasNumeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1'); // Trava no tamanho do CPF
    }

    // Se passou de 11 dígitos, muda para a máscara do CNS (000 0000 0000 0000)
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/( \d{4})\d+?$/, '$1'); // Trava no tamanho máximo do CNS (15 números)
  };

  // Lógica de lidar com a digitação do campo
  const handleCpfChange = (e) => {
    setCpf(formatarDocumento(e.target.value));
  };

  // ============================================================================
  // BUSCA DADOS INICIAIS E PESQUISA
  // ============================================================================
  const fetchConsultas = async () => {
    setLoading(true);
    try {
      // CORREÇÃO: Usando a variável de ambiente
      const res = await fetch(`${API_URL}/consultas/atrasadas`);
      const data = await res.json();
      setConsultas(data.consultas || []);
    } catch (err) {
      console.error("Erro ao conectar com o backend:", err);
    }
    setLoading(false);
  };

  const fetchPacientes = async () => {
    setLoadingPacientes(true);
    try {
      // CORREÇÃO: Usando a variável de ambiente
      const res = await fetch(`${API_URL}/pacientes`);
      const data = await res.json();
      const lista = data.pacientes || data || [];
      setPacientesOptions(lista);
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err);
    }
    setLoadingPacientes(false);
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchConsultas();
    } else if (activeTab === 'consulta' || activeTab === 'pacientes') {
      fetchPacientes();
      setPaginaAtual(1);
    }
  }, [activeTab]);

  // LÓGICA DE FILTRO DA BUSCA DINÂMICA
  const pacientesFiltrados = pacientesOptions.filter(p => {
    const termoLower = buscaTermo.toLowerCase();
    const nomeLower = (p.nome_completo || '').toLowerCase();
    const cpfString = (p.cpf_cns || '');
    return nomeLower.includes(termoLower) || cpfString.includes(termoLower);
  });

  const selecionarPaciente = (paciente) => {
    setConsultaPacienteId(paciente.id);
    // Aqui usamos uma pequena máscara visual na hora de exibir na busca
    setPacienteSelecionadoNome(`${paciente.nome_completo} (Doc: ${paciente.cpf_cns})`);
    setBuscaTermo('');
    setMostrarListaBusca(false);
  };

  const deselecionarPaciente = () => {
    setConsultaPacienteId('');
    setPacienteSelecionadoNome('');
    setBuscaTermo('');
  };

  // PAGINAÇÃO
  const indexOfLastItem = paginaAtual * itensPorPagina;
  const indexOfFirstItem = indexOfLastItem - itensPorPagina;
  const pacientesAtuais = pacientesOptions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPaginas = Math.ceil(pacientesOptions.length / itensPorPagina);

  const irParaProximaPagina = () => { if (paginaAtual < totalPaginas) setPaginaAtual(paginaAtual + 1); };
  const irParaPaginaAnterior = () => { if (paginaAtual > 1) setPaginaAtual(paginaAtual - 1); };

  // ============================================================================
  // CADASTRO DE PACIENTE E CONSULTA
  // ============================================================================
  const handleSubmitPaciente = async (e) => {
    e.preventDefault();
    
    // ATENÇÃO AQUI: Removemos os pontos, traços e espaços antes de mandar para o backend!
    const documentoLimpo = cpf.replace(/\D/g, '');

    if (documentoLimpo.length !== 11 && documentoLimpo.length !== 15) {
      alert("O documento deve ter 11 números (CPF) ou 15 números (Cartão SUS).");
      return;
    }

    const payload = { 
      nome_completo: nome, 
      cpf_cns: documentoLimpo, 
      data_nascimento: nascimento, 
      endereco, 
      acs, 
      condicao 
    };

    try {
      // CORREÇÃO: Usando a variável de ambiente
      const res = await fetch(`${API_URL}/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        alert('Paciente cadastrado com sucesso!');
        setNome(''); setCpf(''); setNascimento(''); setEndereco(''); 
        setAcs(listaACS[0]);
        setCondicao('NENHUM');
        setActiveTab('consulta'); 
      } else {
        const errorData = await res.json();
        alert('Erro do Servidor: ' + errorData.erro);
      }
    } catch(err) {
       alert('Erro de conexão com o backend Fastify.');
    }
  };

  const handleSubmitConsulta = async (e) => {
    e.preventDefault();
    if (!consultaPacienteId) return alert("Por favor, pesquise e selecione um paciente primeiro.");

    const payload = { paciente_id: consultaPacienteId, tipo_profissional: tipoProfissional, data_ultima_consulta: dataUltimaConsulta || null, data_proxima_consulta: dataProximaConsulta, status_consulta: 'AGENDADA' };
    try {
      // CORREÇÃO: Usando a variável de ambiente
      const res = await fetch(`${API_URL}/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        alert('Consulta agendada com sucesso!');
        deselecionarPaciente();
        setTipoProfissional('MEDICO'); setDataUltimaConsulta(''); setDataProximaConsulta('');
        setActiveTab('dashboard'); 
      } else {
        const errorData = await res.json();
        alert('Erro do Servidor: ' + errorData.erro);
      }
    } catch(err) {
       alert('Erro de conexão com o backend Fastify.');
    }
  };

  // ============================================================================
  // MOTOR VISUAL E BADGES
  // ============================================================================
  const calcularAtraso = (dataUltima) => {
    if (!dataUltima) return 0;
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const data = new Date(dataUltima); data.setHours(0,0,0,0);
    return Math.ceil(Math.abs(hoje - data) / (1000 * 60 * 60 * 24));
  };

  const getBadgeInfo = (consulta) => {
    if (consulta.data_proxima_consulta) {
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      const dataProx = new Date(consulta.data_proxima_consulta); dataProx.setHours(0,0,0,0);
      const diffTime = (dataProx - hoje) / (1000 * 60 * 60 * 24);
      if (diffTime >= 0 && diffTime <= 2) {
         return { label: "LEMBRETE", color: "bg-blue-100 text-blue-800 border-blue-200", textoDias: diffTime === 0 ? "É Hoje!" : `Faltam ${diffTime} dias` };
      }
    }
    const dias = calcularAtraso(consulta.data_ultima_consulta);
    const textoDias = `${dias} dias`;
    if (dias > 180) return { label: "URGENTE", color: "bg-red-100 text-red-800 border-red-200", textoDias };
    if (dias >= 150) return { label: "ALERTA", color: "bg-yellow-100 text-yellow-800 border-yellow-200", textoDias };
    return { label: "OK", color: "bg-green-100 text-green-800 border-green-200", textoDias };
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* HEADER COM ÍCONES */}
      <header className="bg-sky-800 shadow-md py-4 px-8 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-800 font-bold text-xl">
            <FaHeartbeat />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl leading-tight">SGR-UBS</h1>
            <p className="text-sky-200 text-xs">Gestão e Busca Ativa</p>
          </div>
        </div>
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
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4">
        
        {/* TELA 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Motor de Busca Ativa</h2>
                <p className="text-slate-500 text-sm mt-1">Pacientes fora do intervalo de acompanhamento ou com lembretes pendentes.</p>
              </div>
              <button onClick={fetchConsultas} className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer">
                Atualizar Dados
              </button>
            </div>

            <div className="p-0 overflow-x-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-700 mb-4"></div>
                  <p className="text-slate-500">Cruzando dados no Supabase...</p>
                </div>
              ) : consultas.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-slate-500 text-lg">Nenhum alerta de acompanhamento pendente. Excelente!</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Paciente</th>
                      <th className="px-6 py-4">Agente (ACS)</th>
                      <th className="px-6 py-4">Condição</th>
                      <th className="px-6 py-4">Profissional</th>
                      <th className="px-6 py-4 text-center">Tempo</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consultas.map((consulta, index) => {
                      const paciente = consulta.pacientes;
                      const badge = getBadgeInfo(consulta);
                      
                      return (
                        <tr key={index} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{paciente.nome_completo}</p>
                            <p className="text-xs text-slate-400">{paciente.telefone || 'Sem contato'}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{paciente.acs || 'Não inf.'}</td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                              {paciente.condicao}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{consulta.tipo_profissional}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">
                            {badge.textoDias}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-md text-xs font-bold border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer opacity-90 group-hover:opacity-100">
                              Disparar Msg
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TELA 2: TODOS OS PACIENTES COM PAGINAÇÃO */}
        {activeTab === 'pacientes' && (
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
                <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700"></div></div>
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
        )}

        {/* TELA 3: CADASTRO DE PACIENTE */}
        {activeTab === 'cadastro' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2"><FaUserPlus className="text-sky-700"/> Novo Paciente</h2>
            <p className="text-slate-500 text-sm mb-8">Preencha os dados obrigatórios para inserir no banco de dados.</p>
            
            <form onSubmit={handleSubmitPaciente} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Nome Completo *</label>
                  <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" placeholder="Ex: Maria da Silva" />
                </div>
                
                {/* CAMPO CPF/CNS COM MÁSCARA DINÂMICA */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">CPF ou CNS *</label>
                  <input type="text" required value={cpf} onChange={handleCpfChange} maxLength={18}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" placeholder="000.000.000-00" />
                </div>

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Data de Nascimento *</label>
                  <input type="date" required value={nascimento} onChange={e => setNascimento(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" />
                </div>
                
                {/* CAMPO SELECT DE ACS */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Agente de Saúde (ACS)</label>
                  <select value={acs} onChange={e => setAcs(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white">
                    {listaACS.map((agente, idx) => (
                      <option key={idx} value={agente}>{agente}</option>
                    ))}
                  </select>
                </div>

              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Endereço Completo</label>
                <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" placeholder="Rua, Número, Bairro" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Condição de Saúde</label>
                <select value={condicao} onChange={e => setCondicao(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white">
                  <option value="NENHUM">Nenhum / Não informado</option>
                  <option value="HIPERTENSO">Hipertenso</option>
                  <option value="DIABETICO">Diabético</option>
                  <option value="AMBOS">Hipertenso e Diabético</option>
                  <option value="GESTANTE">Gestante</option>
                </select>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <button type="submit" className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition cursor-pointer">
                  Salvar Cadastro no Banco
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TELA 4: AGENDAR CONSULTA (Com a sua Busca Dinâmica Preservada) */}
        {activeTab === 'consulta' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2"><FaCalendarPlus className="text-sky-700"/> Agendar Consulta / Procedimento</h2>
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
        )}

      </main>
    </div>
  );
}