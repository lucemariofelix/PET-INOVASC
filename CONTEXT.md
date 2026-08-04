# Gestão e Busca Ativa na UBS

Este contexto organiza o acompanhamento de pacientes, consultas e comunicações da unidade de saúde sem confundir a situação clínica da consulta com o transporte ou a resposta de uma mensagem.

## Linguagem

**Consulta**:
Registro de um acompanhamento de saúde vinculado a um paciente e a um profissional.
_Evitar_: Mensagem, lembrete

**Consulta realizada**:
Atendimento cuja entrada do paciente na sala foi confirmada visualmente e registrada pela recepção ou administração. Representa cuidado efetivamente iniciado.
_Evitar_: Presença confirmada pelo WhatsApp

**Falta à consulta**:
Desfecho registrado quando o paciente não comparece na data agendada. Não cria nem apaga uma data de atendimento anterior.
_Evitar_: Consulta cancelada

**Agendamento vencido**:
Consulta cuja data passou e que ainda aguarda registro de realização ou falta.
_Evitar_: Data desconhecida

**Lembrete de consulta**:
Comunicação enviada ao paciente sobre uma consulta específica, podendo solicitar uma resposta de presença.
_Evitar_: Confirmação, disparo genérico

**Status de entrega**:
Situação técnica do transporte de uma mensagem: enviado, entregue ou lido. Não representa a resposta do paciente à consulta.
_Evitar_: Confirmação da consulta

**Confirmação de consulta**:
Resposta explícita do paciente informando que pretende comparecer.
_Evitar_: Mensagem lida, mensagem entregue

**Solicitação de cancelamento**:
Pedido do paciente para que a unidade revise o agendamento. Não cancela a consulta automaticamente.
_Evitar_: Consulta cancelada

**Cancelamento efetivado**:
Encerramento da consulta realizado por uma pessoa autenticada da unidade após uma solicitação de cancelamento do paciente. Um novo atendimento exige outro agendamento.
_Evitar_: Solicitação de cancelamento

**Pendência de confirmação**:
Lembrete ainda dentro do prazo e aguardando resposta válida do paciente.
_Evitar_: Mensagem não lida

**Confirmação efetiva**:
Estado que representa a resposta válida da consulta, priorizando permanentemente uma confirmação ou solicitação de cancelamento sobre lembretes posteriores.
_Evitar_: Última mensagem

**Lembrete substituído**:
Registro histórico que deixou de representar a pendência ativa por existir uma resposta terminal ou outro lembrete mais recente.
_Evitar_: Registro excluído
