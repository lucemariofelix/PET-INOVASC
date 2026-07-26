# 🏥 SGBA-UBS: Sistema de Gestão e Busca Ativa para UBS

![Status do Projeto](https://img.shields.io/badge/Status-Protótipo%20Ativo-success)
![PET-Saúde](https://img.shields.io/badge/Projeto-PET--Saúde%20Digital%20(INOVASC)-blue)

## 📋 Sobre o Projeto

O **SGBA-UBS** é uma plataforma digital de apoio às Unidades Básicas de Saúde e às equipes da Estratégia Saúde da Família. O sistema integra gestão de pacientes, busca ativa, acompanhamento territorial, agendamento de consultas e comunicação assistida via WhatsApp em um fluxo único para apoiar o cuidado contínuo na atenção primária.

A proposta é transformar dados cadastrais e clínicos em ações práticas para a equipe: identificar pacientes com acompanhamento pendente, organizar grupos prioritários, registrar consentimento de comunicação, enviar lembretes e manter um histórico auditável das interações realizadas.

Este projeto faz parte das iniciativas do **PET-Saúde: Informação e Saúde Digital (PET-INOVASC)**, com foco na modernização da saúde pública comunitária.

## ✨ Principais Funcionalidades

- **Busca ativa de pacientes:** identificação visual de pacientes com consultas atrasadas, próximas ou em acompanhamento pendente.
- **Dashboard de alertas:** classificação por prioridade, com filtros por status, paciente, ACS, condição de saúde e profissional.
- **Painel de métricas:** indicadores e gráficos sobre situação geral da unidade, distribuição por profissional e status dos acompanhamentos.
- **Diretório de pacientes:** listagem paginada com dados cadastrais, condição clínica, agente responsável, grupos e status de consentimento.
- **Cadastro completo de pacientes:** registro de CPF/CNS, telefone, endereço, condição de saúde, ACS, grupos de acompanhamento e contato de emergência.
- **Consentimento para WhatsApp:** controle explícito de autorização para envio de mensagens, com bloqueio de disparos quando o paciente não autorizou.
- **Agendamento de consultas:** criação de consultas vinculadas ao paciente, com verificação de conflitos e envio opcional de mensagem de agendamento.
- **Mensageria via WhatsApp:** envio validado de lembretes, mensagens de agendamento, avisos gerais e comunicações por grupo via Evolution API.
- **Rastreio de entrega:** acompanhamento monotônico de mensagens como Enviado, Entregue e Lido, atualizado por webhook e polling autenticado.
- **Confirmação textual:** lembretes solicitam resposta `1` para presença ou `2` para cancelamento, sem depender de botões nativos do WhatsApp.
- **Bloqueio de reenvios:** uma reserva transacional por consulta impede disparos duplicados quando existe pendência ou resposta registrada.
- **Grupos de acompanhamento:** organização de pacientes por linhas de cuidado, condições, campanhas ou ações territoriais.
- **Controle de território:** vínculo entre pacientes e Agentes Comunitários de Saúde para apoiar a rotina das microáreas.
- **Auditoria e histórico:** registro de ações relevantes, mensagens enviadas, status de entrega e eventos recebidos por webhook.
- **Perfis de acesso:** separação entre ADMIN, RECEPCAO e ACS, respeitando as responsabilidades de cada equipe.
- **Segurança em dados de saúde:** autenticação, cookies HttpOnly, políticas RLS no Supabase e permissões ajustadas por função.

## 🔁 Fluxos Principais do Sistema

- **Cadastro e atualização do paciente:** a equipe registra dados cadastrais, contato principal, contato de emergência, ACS responsável, condição de saúde, grupos e consentimento para comunicação.
- **Acompanhamento e busca ativa:** o painel calcula atrasos, próximas consultas e prioridades para orientar a atuação da equipe.
- **Agendamento e comunicação:** ao criar uma consulta, o sistema pode registrar e enviar uma mensagem de agendamento ao paciente autorizado.
- **Lembretes e avisos:** pacientes com consentimento podem receber lembretes de consulta, avisos gerais ou mensagens direcionadas por grupo de acompanhamento.
- **Confirmação pelo paciente:** respostas textuais `1` e `2` são recebidas por webhook; a opção `2` solicita revisão humana e nunca cancela a consulta automaticamente.
- **Acompanhamento da mensagem:** eventos da Evolution atualizam entrega e leitura sem confundir esses estados com a resposta do paciente.
- **Auditoria:** ações administrativas e eventos relevantes ficam disponíveis para acompanhamento e rastreabilidade.

## 🔐 Segurança e Privacidade

O SGBA-UBS foi estruturado considerando a sensibilidade dos dados de saúde e a necessidade de rastreabilidade das ações realizadas pela equipe.

- Autenticação com sessão protegida por cookies HttpOnly.
- Controle de acesso por perfis funcionais.
- Políticas de Row Level Security (RLS) no Supabase.
- Redução de permissões públicas em tabelas sensíveis.
- Uso de consentimento explícito para mensagens via WhatsApp.
- Histórico de mensagens com tipo, status de entrega, confirmação e vínculo com paciente/consulta.
- Segredo dedicado no webhook da Evolution e logs diagnósticos com dados sensíveis mascarados.
- Validação do número, existência no WhatsApp e identificador real do provedor antes de registrar um envio.
- Auditoria de operações relevantes do sistema.

## 👥 Perfis de Usuário

- **ADMIN:** gerencia usuários, configurações, auditoria e possui acesso amplo aos fluxos administrativos.
- **RECEPCAO:** cadastra e atualiza pacientes, agenda consultas e apoia a comunicação com pacientes autorizados.
- **ACS:** acompanha pacientes, grupos, território e informações necessárias para busca ativa.

## 🛠️ Arquitetura e Tecnologias

A aplicação utiliza uma arquitetura web separada em frontend, backend e banco de dados relacional.

**Frontend**
- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) para interface responsiva
- [Recharts](https://recharts.org/) para indicadores e gráficos
- [React Icons](https://react-icons.github.io/react-icons/) para apoio visual
- Code splitting por rotas e módulos de API separados por domínio

**Backend**
- [Node.js](https://nodejs.org/)
- [Fastify](https://fastify.dev/) para API HTTP
- Módulo centralizado de mensageria
- Integração com Evolution API e webhooks
- Tratamento padronizado de erros e auditoria

**Banco de Dados e Infraestrutura**
- [Supabase](https://supabase.com/) com PostgreSQL e RLS
- Histórico de mensagens, pacientes, consultas, grupos e perfis de usuários
- Migrations versionadas para evolução do schema

## 📚 Documentação

- [Glossário do domínio](./CONTEXT.md)
- [Mensageria e confirmação via WhatsApp](./docs/MENSAGERIA_WHATSAPP.md)
- [Interface e comportamento responsivo](./docs/INTERFACE.md)
- [Implantação e validação](./docs/IMPLANTACAO.md)
- [Decisão: confirmação por menu textual](./docs/adr/0001-confirmacao-textual-via-whatsapp.md)
- [Mudanças recentes](./CHANGELOG.md)
- [Handoff técnico e testes](./backend/docs/AI_HANDOFF.md)

## 💻 Desenvolvimento local

Copie os arquivos `.env.example` de `backend` e `frontend`, preencha as variáveis do ambiente e execute os projetos separadamente.

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
pnpm install
pnpm dev
```

Validação completa:

```bash
cd backend && npm test
cd ../frontend && pnpm test && pnpm lint && pnpm build
```

## 🚀 Estratégia de Implantação

O projeto foi pensado para acesso remoto por equipes de UBS, com separação clara entre interface, API e banco de dados.

- **Frontend:** hospedagem web via Vercel.
- **Backend:** API Node.js processada no Render.
- **Banco de Dados:** Supabase/PostgreSQL.
- **Mensageria:** Evolution API para integração com WhatsApp.

As migrations devem ser aplicadas antes do backend, e o backend antes do frontend. Consulte o [guia de implantação](./docs/IMPLANTACAO.md) para a configuração do webhook e o roteiro de aceitação.

## 📌 Status do Projeto

O SGBA-UBS está em fase de **protótipo ativo e evolução contínua**. A base atual já cobre os principais fluxos de gestão, busca ativa, comunicação e auditoria, servindo como ponto de partida para validação em contexto real de atenção primária e para novas melhorias orientadas pela equipe de saúde.

---

*Desenvolvido por Lucemario Felix e alunos do programa PET-INOVASC para modernização da saúde pública comunitária.*
