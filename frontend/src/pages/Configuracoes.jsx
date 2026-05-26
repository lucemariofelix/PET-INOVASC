import React, { useState, useEffect } from 'react';
import { FaQrcode, FaCheckCircle, FaExclamationTriangle, FaCog } from 'react-icons/fa';
import { api } from '../api/services';

export default function Configuracoes() {
  const [status, setStatus] = useState('loading'); // loading, connected, qrcode, error, unconfigured
  const [qrCodeBase64, setQrCodeBase64] = useState('');

  const checarConexao = async () => {
    try {
      const data = await api.getWhatsAppStatus();
      setStatus(data.status);
      if (data.status === 'qrcode') {
        setQrCodeBase64(data.qrcode);
      }
    } catch (error) {
      setStatus('error');
    }
  };

  useEffect(() => {
    // Checa imediatamente ao abrir a tela
    checarConexao();

    // Cria um "loop" que verifica a conexão a cada 5 segundos
    // Assim que o usuário ler o QR Code, a tela atualiza sozinha para "Conectado"
    const intervalo = setInterval(() => {
      checarConexao();
    }, 5000);

    // Limpa o loop se o usuário sair da aba de configurações
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <FaCog className="text-sky-700" /> Configurações do Sistema
        </h2>
        <p className="text-slate-500 text-sm sm:text-base mt-1">
          Gerenciamento do servidor de mensagens e parâmetros da unidade.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
          Servidor de WhatsApp (Evolution API)
        </h3>

        <div className="flex flex-col items-center justify-center py-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-700"></div>
              <p className="text-slate-500 font-medium">Verificando status do servidor...</p>
            </div>
          )}

          {status === 'connected' && (
            <div className="flex flex-col items-center gap-3 text-center bg-emerald-50 p-6 rounded-xl border border-emerald-100 w-full max-w-md">
              <FaCheckCircle className="text-emerald-500 text-5xl" />
              <h4 className="font-bold text-emerald-800 text-lg">WhatsApp Conectado</h4>
              <p className="text-emerald-600 text-sm">
                A sessão está ativa e o SGR está pronto para realizar os disparos automáticos para os pacientes.
              </p>
            </div>
          )}

          {status === 'qrcode' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border border-amber-200">
                <FaQrcode /> Aguardando leitura do QR Code
              </div>
              <p className="text-slate-500 text-sm max-w-sm">
                Abra o WhatsApp no aparelho da unidade, vá em <b>Aparelhos Conectados</b> e aponte a câmera para o código abaixo:
              </p>
              <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl">
                {/* O Base64 injetado diretamente na tag da imagem */}
                <img src={qrCodeBase64} alt="QR Code WhatsApp" className="w-64 h-64 object-contain" />
              </div>
            </div>
          )}

          {(status === 'error' || status === 'unconfigured') && (
            <div className="flex flex-col items-center gap-3 text-center bg-red-50 p-6 rounded-xl border border-red-100 w-full max-w-md">
              <FaExclamationTriangle className="text-red-500 text-4xl" />
              <h4 className="font-bold text-red-800">Falha de Conexão</h4>
              <p className="text-red-600 text-sm">
                Não foi possível conectar ao servidor da Evolution API. Verifique se o servidor está online e se as variáveis de ambiente estão corretas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
