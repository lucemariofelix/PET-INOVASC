# 🏥 SGR-UBS: Sistema de Gestão e Busca Ativa

![Status do Projeto](https://img.shields.io/badge/Status-Protótipo%20Ativo-success)
![PET-Saúde](https://img.shields.io/badge/Projeto-PET--Saúde%20Digital%20(INOVASC)-blue)

## 📋 Sobre o Projeto
O **SGR-UBS** é uma solução tecnológica desenvolvida para otimizar o fluxo de trabalho das Unidades Básicas de Saúde (Estratégia Saúde da Família). O sistema atua como um "Motor de Busca Ativa", identificando pacientes crônicos (Hipertensos e Diabéticos) que estão fora da janela de acompanhamento ou que possuem agendamentos próximos, visando a redução drástica do absenteísmo.

Este projeto faz parte das iniciativas do **PET-Saúde: Informação e Saúde Digital (PET-INOVASC)**.

## ✨ Principais Funcionalidades

- **Dashboard de Alertas (Busca Ativa):** Motor visual que calcula automaticamente os dias de atraso ou dias faltantes para a consulta, categorizando por cores (Urgente, Alerta, Lembrete).
- **Painel de Métricas:** Gráficos interativos e estatísticos em tempo real sobre a saúde geral da unidade de saúde.
- **Integração WhatsApp:** Disparo direto de notificações para pacientes em atraso utilizando a Evolution API.
- **Segurança Nível de Saúde:** Sistema protegido por Autenticação JWT e Políticas de Segurança em Nível de Linha (RLS - Supabase).
- **Diretório de Pacientes:** Visão geral da unidade com paginação inteligente e tags visuais de condições clínicas.
- **Cadastro Inteligente:** Formulário com máscara dinâmica que identifica automaticamente se o usuário está digitando um CPF (11 dígitos) ou um Cartão Nacional do SUS (15 dígitos).
- **Controle de Território:** Vínculo direto dos pacientes com os Agentes Comunitários de Saúde (ACS) de suas respectivas microáreas.

## 🛠️ Arquitetura e Tecnologias

A aplicação foi construída utilizando uma arquitetura moderna dividida em camadas (Frontend e Backend isolados):

**Frontend (A Interface)**
- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) para estilização rápida e responsiva.
- [Recharts](https://recharts.org/) para a plotagem dos dashboards visuais.
- [React Icons](https://react-icons.github.io/react-icons/) (FontAwesome) para interface intuitiva.

**Backend (O Motor)**
- [Node.js](https://nodejs.org/)
- [Fastify](https://fastify.dev/) para uma API de altíssima performance.
- Integração com Webhooks e Evolution API.

**Banco de Dados**
- [Supabase](https://supabase.com/) (PostgreSQL relacional) com regras RLS ativadas.

## 🚀 Estratégia de Implantação (Deploy)
Pensando em escalabilidade e acesso remoto por qualquer dispositivo da UBS:
- O **Banco de Dados** está hospedado no Supabase.
- A **API (Backend)** é processada no Render.
- A **Interface (Frontend)** é servida pelo Vercel.

---

## 💻 Como Rodar o Projeto Localmente

Este guia é para desenvolvedores e alunos que desejam configurar e executar o ambiente Node.js do sistema SGR-UBS em suas próprias máquinas.

### 📋 Pré-requisitos

Antes de começar, você precisará ter as seguintes ferramentas instaladas no seu computador:
* [Node.js](https://nodejs.org/) (Recomendamos a versão LTS - v18 ou superior)
* [Git](https://git-scm.com/)
* [Yarn](https://yarnpkg.com/) (Gerenciador de pacotes oficial do projeto)

> **Nota para instalação do Yarn:** Caso você já tenha o Node.js instalado, abra o terminal e rode o comando `npm install --global yarn` para habilitar o Yarn globalmente.

### 🛠️ Passo a Passo da Instalação

**1. Clone o repositório**
Abra o seu terminal, escolha a pasta onde deseja salvar o projeto e rode:
```bash
git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
cd seu-repositorio
```

**2. Instale as dependências**
O projeto utiliza diversas bibliotecas tanto no frontend quanto no backend. Entre na pasta raiz do servidor e execute:
```bash
yarn install
```

**3. Configure as Variáveis de Ambiente**
Por questões de segurança (LGPD), as chaves do banco de dados não sobem para o GitHub. Você precisará criar o seu próprio arquivo de configuração local:
* Na raiz do projeto, faça uma cópia do arquivo de exemplo:
  ```bash
  cp .env.example .env
  
```
* Abra o novo arquivo `.env` gerado no seu editor de código e preencha as credenciais com as chaves fornecidas pelo administrador do sistema (Supabase URL e Anon Key).

**4. Rode o Servidor Local**
Com tudo instalado e configurado, inicie o servidor de desenvolvimento:
```bash
yarn dev
```
O backend estará rodando e pronto para receber requisições (por padrão em `http://localhost:3000`).

### 🐛 Resolução de Problemas Comuns
* **Erro `supabaseKey is required` ou `JWT expired`:** Verifique se o seu arquivo `.env` está configurado corretamente com a `SUPABASE_ANON_KEY` e certifique-se de fazer login novamente na interface web para gerar um novo token de acesso válido para as requisições RLS.

---
*Desenvolvido por Lucemario Felix e alunos do programa PET-INOVASC para modernização da saúde pública comunitária.*
