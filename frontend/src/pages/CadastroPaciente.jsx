import React, { useState } from 'react';
import { FaUserPlus } from 'react-icons/fa';
import { api } from '../api/services';
import { formatarDocumento } from '../utils/formatters';
// 1. CORREÇÃO: Importação apontando para o arquivo correto
import ModalAlerta from '../components/ModalAlerta'; 

export default function CadastroPaciente({ onSuccess }) {
  // Simulação do Banco de Dados de ACS
  const listaACS = [
    "Área Descoberta",
    "Micro 01 - Maria Souza",
    "Micro 02 - João Pedro",
    "Micro 03 - Ana Clara",
    "Micro 04 - Carlos Eduardo",
    "Micro 05 - Luciana Gomes"
  ];

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [nascimento, setNascimento] = useState('');
  // 2. CORREÇÃO: Estado do telefone adicionado
  const [telefone, setTelefone] = useState(''); 
  const [endereco, setEndereco] = useState('');
  const [acs, setAcs] = useState(listaACS[0]);
  const [condicao, setCondicao] = useState('NENHUM');
  const [alerta, setAlerta] = useState({ isOpen: false, tipo: '', titulo: '', mensagem: '' });

  // Lógica da Máscara do Campo
  const handleCpfChange = (e) => {
    setCpf(formatarDocumento(e.target.value));
  };

  const handleSubmitPaciente = async (e) => {
    e.preventDefault();
    
    // Removemos os pontos, traços e espaços antes de mandar para o backend
    const documentoLimpo = cpf.replace(/\D/g, '');

    if (documentoLimpo.length !== 11 && documentoLimpo.length !== 15) {
      setAlerta({
        isOpen: true,
        tipo: 'aviso',
        titulo: 'Documento Inválido',
        mensagem: 'O documento deve ter 11 números (CPF) ou 15 números (Cartão SUS).'
      });
      return;
    }

    const payload = { 
      nome_completo: nome, 
      cpf_cns: documentoLimpo, 
      data_nascimento: nascimento,
      telefone: telefone, 
      endereco, 
      acs, 
      condicao 
    };

    try {
      await api.criarPaciente(payload);
      
      // Limpa os campos após o sucesso
      setNome(''); 
      setCpf(''); 
      setNascimento(''); 
      setTelefone(''); 
      setEndereco(''); 
      setAcs(listaACS[0]);
      setCondicao('NENHUM');
      
      // Apenas abre o modal de sucesso
      setAlerta({
        isOpen: true,
        tipo: 'sucesso',
        titulo: 'Tudo Certo!',
        mensagem: 'Paciente cadastrado com sucesso.'
      });
      
    } catch(err) {
      setAlerta({
        isOpen: true,
        tipo: 'erro',
        titulo: 'Ops! Ocorreu um erro',
        mensagem: err.message
      });
    }
  };

  // 5. CORREÇÃO: Função para fechar o alerta e mudar de aba
  const fecharAlerta = () => {
    setAlerta({ ...alerta, isOpen: false });
    if (alerta.tipo === 'sucesso' && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-in fade-in zoom-in-95 duration-300">
      <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <FaUserPlus className="text-sky-700"/> Novo Paciente
      </h2>
      <p className="text-slate-500 text-sm mb-8">Preencha os dados obrigatórios para inserir no banco de dados.</p>
      
      <form onSubmit={handleSubmitPaciente} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Nome Completo *</label>
            <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" placeholder="Ex: Maria da Silva" />
          </div>
          
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
        
        {/* 3. CORREÇÃO: Input de Telefone adicionado visualmente ao lado do Endereço */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Endereço Completo</label>
            <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" placeholder="Rua, Número, Bairro" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">WhatsApp / Telefone</label>
            <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" placeholder="(84) 99999-9999" />
          </div>
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
            {/* 4. CORREÇÃO: Texto adicionado entre as tags option */}
            <option value="CD">CD: Crescimento e Desenvolvimento</option> 
          </select>
        </div>
        
        <div className="pt-4 border-t border-slate-100">
          <button type="submit" className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition cursor-pointer">
            Salvar Cadastro no Banco
          </button>
        </div>
      </form>

      {/* 5. CORREÇÃO: Modal renderizado na tela e pronto para aparecer */}
      <ModalAlerta 
        isOpen={alerta.isOpen}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensagem={alerta.mensagem}
        onClose={fecharAlerta}
      />
    </div>
  );
}