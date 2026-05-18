# 🏥 SGR-UBS: Sistema de Gestão e Busca Ativa

![Status do Projeto](https://img.shields.io/badge/Status-Protótipo%20Ativo-success)
![PET-Saúde](https://img.shields.io/badge/Projeto-PET--Saúde%20Digital%20(INOVASC)-blue)

## 📋 Sobre o Projeto
O **SGR-UBS** é uma solução tecnológica desenvolvida para otimizar o fluxo de trabalho das Unidades Básicas de Saúde (Estratégia Saúde da Família). O sistema atua como um "Motor de Busca Ativa", identificando pacientes crônicos (Hipertensos e Diabéticos) que estão fora da janela de acompanhamento ou que possuem agendamentos próximos, visando a redução drástica do absenteísmo.

Este projeto faz parte das iniciativas do **PET-Saúde: Informação e Saúde Digital (PET-INOVASC)**.

## ✨ Principais Funcionalidades

- **Dashboard de Alertas (Busca Ativa):** Motor visual que calcula automaticamente os dias de atraso ou dias faltantes para a consulta, categorizando por cores (Urgente, Alerta, Lembrete).
- **Diretório de Pacientes:** Visão geral da unidade com paginação e tags visuais de condições clínicas.
- **Cadastro Inteligente:** Formulário com máscara dinâmica que identifica automaticamente se o usuário está digitando um CPF (11 dígitos) ou um Cartão Nacional do SUS (15 dígitos).
- **Agendamento Dinâmico:** Componente de Auto-complete para buscar milhares de pacientes em tempo real sem travar a interface.
- **Controle de Território:** Vínculo direto dos pacientes com os Agentes Comunitários de Saúde (ACS) de suas respectivas microáreas.

## 🛠️ Arquitetura e Tecnologias

A aplicação foi construída utilizando uma arquitetura moderna dividida em camadas (Frontend e Backend isolados):

**Frontend (A Interface)**
- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) para estilização rápida e responsiva.
- [React Icons](https://react-icons.github.io/react-icons/) (FontAwesome) para interface intuitiva.

**Backend (O Motor)**
- [Node.js](https://nodejs.org/)
- [Fastify](https://fastify.dev/) para uma API de altíssima performance.
- Integração e regras de negócio para cálculo de datas.

**Banco de Dados**
- [Supabase](https://supabase.com/) (PostgreSQL relacional).

## 🚀 Estratégia de Implantação (Deploy)
Pensando em escalabilidade e acesso remoto por qualquer dispositivo da UBS:
- O **Banco de Dados** está hospedado no Supabase.
- A **API (Backend)** é processada no Render.
- A **Interface (Frontend)** é servida pelo Vercel.

## 🚀 Como Rodar o Projeto Localmente

Este guia é para desenvolvedores e alunos que desejam configurar e executar o ambiente Node.js do sistema SGR-UBS em suas próprias máquinas.

### 📋 Pré-requisitos

Antes de começar, você precisará ter as seguintes ferramentas instaladas no seu computador:
* [Node.js](https://nodejs.org/) (Recomendamos a versão LTS - v18 ou superior)
* [Git](https://git-scm.com/)
* [Yarn](https://yarnpkg.com/) (Gerenciador de pacotes oficial do projeto)

> **Nota para instalação do Yarn:** Caso você já tenha o Node.js instalado, abra o terminal e rode o comando `npm install --global yarn` para habilitar o Yarn globalmente.

---

### 🛠️ Passo a Passo da Instalação

**1. Clone o repositório**
Abra o seu terminal, escolha a pasta onde deseja salvar o projeto e rode:
```bash
git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
cd seu-repositorio

---
*Desenvolvido por Lucemario Felix e alunos do programa PET-INOVASC para modernização da saúde pública comunitária.*
