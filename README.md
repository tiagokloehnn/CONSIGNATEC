# 💼 Consignatec — Central de Ferramentas & Gestão Financeira

<div align="center">

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20&%20Firestore-FFCA28?style=for-the-badge&logo=firebase)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=google)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge)

<p align="center">
  <strong>Plataforma corporativa e financeira da Consignatec: Gestão orçamentária inteligente, simuladores de crédito consignado, análise de investimentos e consultoria assistida por Inteligência Artificial (Google Gemini).</strong>
</p>

</div>

---

## 📌 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Ferramentas Integradas](#-ferramentas-integradas)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Rodar Localmente](#-como-rodar-localmente)
- [Configuração do Firebase](#-configuração-do-firebase)
- [Deploy na Vercel](#-deploy-na-vercel)
- [Como Embutir em Sites (iFrame)](#-como-embutir-em-sites-iframe)
- [Licença](#-licença)

---

## 🌟 Visão Geral

O **Consignatec — Central de Ferramentas** é uma solução completa desenvolvida para oferecer controle financeiro pessoal e utilitários de crédito de alta performance para clientes e parceiros. 

O sistema conta com sincronização em nuvem em tempo real (multi-dispositivo: PC, tablet e smartphone), modo PWA instalável, autenticação segura via Firebase (E-mail/Senha e Google) e diagnósticos orçamentários gerados via inteligência artificial.

---

## ⚡ Funcionalidades Principais

- 🔐 **Autenticação Segura & Isolamento:**
  - Login via E-mail e Senha ou Conta Google através do Firebase Authentication.
  - Segurança a nível de banco de dados com regras estritas no Firestore (`firestore.rules`).
  - Modo Visitante para teste e demonstração rápida sem cadastro.

- 📊 **Orçamento Mensal Inteligente:**
  - Metodologia **Regra 50/30/20** (Necessidades Básicas, Desejos Pessoais e Investimentos/Reserva).
  - Categorias customizáveis com definição de tetos de gastos e alertas visuais de estouro.
  - Lançamentos com forma de pagamento (PIX, Crédito, Débito, Boleto, etc.) e status (Pago, Pendente, Agendado).
  - Histórico multimeses com cálculo automático de saldo e taxa de economia.

- 🤖 **Consultor Financeiro com IA (Google Gemini):**
  - **Diagnóstico CFP® em 1 Clique:** Analisa receitas, gargalos e hábitos de consumo, fornecendo *Health Score* (0 a 100) e recomendações práticas.
  - **Reconhecimento Inteligente de Despesas:** Digite em texto natural (ex: *"Almoço de R$ 45 no débito hoje"*) e a IA categoriza e preenche o lançamento automaticamente.

- 📱 **Progressive Web App (PWA):**
  - Instalável diretamente no Android, iOS (Safari) ou Desktop (Chrome/Edge).
  - Suporte a cache e operação resiliente com service workers.

- 🌓 **Interface Moderna & Temas:**
  - Alternância fluida entre Modo Escuro (*Dark Mode*) e Modo Claro (*Light Mode*).
  - Layout totalmente responsivo otimizado para celulares e telas widescreen.

---

## 🛠️ Ferramentas Integradas

Na central, os usuários têm acesso direto a múltiplas ferramentas complementares:

1. **Gestão Orçamentária & Despesas:** O painel principal com fluxo de caixa, métricas e metas.
2. **Simulador de Empréstimo Consignado:** Cálculo exato de parcelas, margem consignável (35% / 40%), taxas mensais e cronograma de amortização (Tabela Price / SAC).
3. **Calculadora de Juros Compostos & Investimentos:** Projeção patrimonial com aportes mensais, curva de rendimento e comparador com taxas Selic/CDI.
4. **Radar de Mercado & Ações:** Consulta e acompanhamento de ativos com análise de tendências.

---

## 💻 Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion.
- **Backend / Serverless:** Express (dev local) e Vercel Serverless Functions (`/api/*`).
- **Banco de Dados & Auth:** Firebase Authentication & Cloud Firestore.
- **Inteligência Artificial:** SDK Oficial `@google/genai` (Google Gemini 3.8 Flash).
- **PWA:** `vite-plugin-pwa` com suporte a Service Worker e Web App Manifest.

---

## 📂 Estrutura do Projeto

```text
├── api/                       # Funções Serverless para produção na Vercel
│   ├── diagnostico.ts         # Endpoint de diagnóstico via Gemini
│   ├── parse-expense.ts       # Endpoint de extração de despesa via IA
│   └── stock-analysis.ts      # Endpoint de cotação/análise de mercado
├── public/                    # Ícones, manifest e favicons do PWA
├── src/
│   ├── components/            # Componentes visuais modulares
│   │   ├── AuthScreen.tsx     # Tela de login e cadastro
│   │   ├── ConsignadoSimulator.tsx # Simulador de Crédito
│   │   ├── CompoundInterestCalculator.tsx # Juros Compostos
│   │   ├── ExpenseModal.tsx   # Modal de inclusão de despesas
│   │   ├── FinancialDiagnosisModal.tsx # Diagnóstico via IA
│   │   └── ...
│   ├── services/
│   │   ├── firebase.ts        # Integração e listeners com Firestore & Auth
│   │   └── gemini.ts          # Chamadas à API Gemini
│   ├── types.ts               # Tipagens TypeScript do sistema
│   ├── App.tsx                # Roteamento de telas e estado global
│   └── main.tsx               # Ponto de entrada do React
├── firestore.rules            # Regras de segurança do Firestore
├── firebase-applet-config.json # Configurações da instância Firebase
├── server.ts                  # Servidor local Node/Express + Vite Middleware
├── vercel.json                # Configuração de rotas e build para a Vercel
└── vite.config.ts             # Configurações do Vite, Tailwind e PWA
```

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior.
- Gerenciador de pacotes `npm` ou `bun`.

### 2. Instalação
Clone o repositório e instale as dependências:
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o modelo de variáveis:
```bash
cp .env.example .env
```

Abra o arquivo `.env` e configure sua chave da API Google Gemini:
```env
GEMINI_API_KEY="AIzaSy..."
# ou CONSIGNATEC_GEMINI_KEY="AIzaSy..."
```

### 4. Executar em Desenvolvimento
```bash
npm run dev
```
Abra o navegador no endereço: [http://localhost:3000](http://localhost:3000)

---

## 🔥 Configuração do Firebase

1. No [Firebase Console](https://console.firebase.google.com/), crie um projeto ou utilize o existente.
2. Em **Authentication > Método de login**, ative os provedores:
   - **E-mail/senha**
   - **Google** (opcional, para login rápido com conta Google).
3. Em **Firestore Database**, garanta que o banco esteja criado.
4. As credenciais de conexão do projeto ficam registradas em `firebase-applet-config.json` e inicializadas em `src/services/firebase.ts`.

---

## 🌐 Deploy na Vercel

O projeto já contém o arquivo `vercel.json` configurado para compilar o Vite e mapear as rotas da SPA e as Serverless Functions (`/api/*`).

### Passo a Passo:

1. Faça o commit e envie seu projeto para o GitHub:
   ```bash
   git add .
   git commit -m "feat: configuracoes para producao e vercel"
   git push origin main
   ```
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New > Project**.
3. Importe o repositório do GitHub.
4. Em **Environment Variables**, adicione:
   - **Key:** `GEMINI_API_KEY` (ou `CONSIGNATEC_GEMINI_KEY`)
   - **Value:** *Sua chave da API Google Gemini*
5. Clique em **Deploy**.
6. (Opcional) Em **Settings > Domains**, vincule seu domínio personalizado (ex.: `app.consignatec.com.br`).

---

## 💻 Como Embutir em Sites (iFrame)

Você pode incorporar o sistema diretamente dentro de qualquer página institucional (WordPress, Wix ou HTML puro) colando o código abaixo:

```html
<div style="width: 100%; min-height: 90vh; position: relative; overflow: hidden; background: #0f172a;">
  <iframe
    src="https://SEU-DOMINIO-VERCEL.app"
    title="Consignatec - Gestão Financeira & Central de Ferramentas"
    style="width: 100%; height: 92vh; border: none; display: block;"
    allow="clipboard-write; camera; microphone"
    loading="lazy">
  </iframe>
</div>
```

---

## 📄 Licença

Este projeto é de uso exclusivo e corporativo da **Consignatec**. Todos os direitos reservados.
