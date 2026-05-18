import React from 'react';

export default function ModalConfirmacao({ isOpen, titulo, mensagem, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    // CORREÇÃO AQUI: Trocamos o bg-black bg-opacity-50 por bg-slate-900/20
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 transition-all">
      
      <div className="bg-white rounded-lg shadow-xl w-96 p-6 animate-fade-in-up">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{titulo}</h3>
        <p className="text-gray-600 mb-6">{mensagem}</p>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          
          {/* Mantive o seu botão Confirmar vermelho (ótimo padrão para ações de disparo/alerta) */}
          <button 
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors cursor-pointer"
          >
            Confirmar
          </button>
        </div>
      </div>

    </div>
  );
}