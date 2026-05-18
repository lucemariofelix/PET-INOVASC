import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

export default function ModalAlerta({ isOpen, tipo, titulo, mensagem, onClose }) {
  if (!isOpen) return null;

  // Define os ícones baseados no tipo de alerta
  const icones = {
    sucesso: <FaCheckCircle className="text-green-500 text-5xl drop-shadow-sm" />,
    erro: <FaExclamationCircle className="text-red-500 text-5xl drop-shadow-sm" />,
    aviso: <FaInfoCircle className="text-yellow-500 text-5xl drop-shadow-sm" />
  };

  // Define as cores do botão
  const coresBotao = {
    sucesso: "bg-green-600 hover:bg-green-700 text-white",
    erro: "bg-red-600 hover:bg-red-700 text-white",
    aviso: "bg-yellow-500 hover:bg-yellow-600 text-white"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-80 p-6 text-center animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-center mb-4">
          {icones[tipo] || icones.aviso}
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2">{titulo}</h3>
        <p className="text-slate-600 text-sm mb-6">{mensagem}</p>
        
        <button
          onClick={onClose}
          className={`w-full py-2.5 font-bold rounded-lg transition-colors shadow-sm cursor-pointer ${coresBotao[tipo] || coresBotao.aviso}`}
        >
          Entendi
        </button>
      </div>
    </div>
  );
}