# Confirmação de consultas por menu textual

Adotamos mensagens de texto enviadas por `sendText`, com respostas exatas `1` para confirmar presença e `2` para solicitar cancelamento, em vez de botões nativos via sessão QR Code. Na Evolution API v2.3.x, o texto simples apresentou entrega e interação mais confiáveis entre aparelhos; o pedido de cancelamento permanece sujeito à revisão humana e nunca altera automaticamente a consulta.

## Consequências

- O webhook deve receber `MESSAGES_UPSERT` além de `MESSAGES_UPDATE`.
- Apenas respostas individuais, recebidas do paciente e dentro do prazo são consideradas.
- O código legado de botões permanece compatível no backend, mas não é usado pelo Dashboard.
