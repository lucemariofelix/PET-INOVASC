# Changelog

## 2026-08-04

### Cancelamento de consultas

- Adicionada efetivação auditável do cancelamento solicitado pelo paciente para todos os perfis autenticados.
- Consultas canceladas deixam as métricas ativas e não recebem novos lembretes.
- Adicionada confirmação final pelo WhatsApp sem reversão do cancelamento em caso de falha do provedor.

## 2026-07-25

### Mensageria e acompanhamento

- Adicionado acompanhamento visual `ENVIADO → ENTREGUE → LIDO` por polling autenticado.
- Removida a dependência do Supabase Realtime no frontend para atualização de mensagens.
- Eliminado falso positivo: respostas 2xx sem identificador da Evolution agora são rejeitadas.
- Adicionados preflight de existência no WhatsApp, validação estrita de celular brasileiro e diagnósticos redigidos.
- Corrigida a correlação de `MESSAGES_UPDATE` por `keyId`/`key.id`.
- Lembretes do Dashboard passaram a usar `sendText` em vez de botões nativos.

### Confirmação de consultas

- Implementado menu textual `1 — Confirmar presença` e `2 — Solicitar cancelamento`.
- Adicionado processamento de `MESSAGES_UPSERT`, incluindo JIDs alternativos e restauração segura do nono dígito brasileiro.
- Adicionadas respostas automáticas correlacionáveis e prazo de 72 horas.
- Implementados estados `PENDENTE`, `CONFIRMADO`, `CANCELAMENTO_SOLICITADO`, `EXPIRADO` e `SUBSTITUIDO`.
- Adicionado bloqueio transacional de reenvios por consulta, com reconciliação de históricos duplicados.
- O Dashboard passou a priorizar a confirmação efetiva, independentemente da mensagem mais recente.

### Interface

- Adicionada busca no Diretório de Pacientes.
- Corrigido overflow horizontal da tabela do Dashboard com colunas fixas e quebra seletiva.
- Ampliado o layout autenticado para até 1600 px, alinhando Header e páginas orientadas a dados.
- Corrigida sobreposição de conteúdo na área de Configurações.

### Segurança e operações

- Endurecido o gerenciamento de usuários e o tratamento de sessões/permissões.
- Corrigidas requisições sem corpo JSON e habilitada exclusão segura de grupos.
- Adicionado tratamento amigável para instância WhatsApp desconectada.
