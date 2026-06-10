# README Técnico — Frontend QG Polpa Brasil

**Projeto:** QG Polpa Brasil  
**Camada:** Frontend  
**Tecnologia principal:** React JS  
**Hospedagem recomendada:** Vercel  
**Integração principal:** API do QG Polpa Brasil

---

## Resumo técnico

Este documento descreve a estrutura técnica recomendada para o **frontend do QG Polpa Brasil**, desenvolvido com **React JS** e organizado para consumo de dados da API do projeto. A camada frontend é responsável por disponibilizar as telas operacionais e gerenciais, incluindo dashboard, vendedores, clientes, produtos, funil de vendas, metas, histórico de clientes, novos projetos, recorrentes e panorama CRM.

A aplicação deve ser mantida como uma interface separada da camada de backend, consumindo os dados por meio de endpoints HTTP ou camada de comunicação equivalente. Essa separação facilita evolução independente entre tela e API, melhora a organização do projeto e permite publicar o frontend em ambiente próprio, como a **Vercel**.[1] [2]

---

## Stack técnica

| Área | Tecnologia | Finalidade |
|---|---|---|
| **Interface** | React JS | Construção das telas, componentes, páginas e experiência do usuário. |
| **Build e desenvolvimento** | Vite | Execução local rápida, empacotamento e geração do build de produção. |
| **Linguagem** | TypeScript | Tipagem dos componentes, respostas da API e estruturas de dados. |
| **Estilização** | Tailwind CSS | Padronização visual, classes utilitárias e responsividade. |
| **Componentes visuais** | Radix UI / componentes próprios | Criação de modais, formulários, layouts e componentes reutilizáveis. |
| **Gráficos** | Recharts | Visualização de indicadores, evolução mensal, funil e comparativos. |
| **Comunicação com backend** | Fetch, React Query ou tRPC | Consumo de dados da API e controle de estados de carregamento. |
| **Hospedagem** | Vercel | Publicação do frontend e integração com repositório GitHub. |
| **Versionamento** | GitHub | Controle de alterações, branches e pull requests. |

---

## Responsabilidades do frontend

O frontend concentra toda a experiência visual e operacional do QG Polpa Brasil. Ele não deve conter regras críticas de negócio nem consultas diretas ao banco de dados. Sua principal responsabilidade é apresentar as informações recebidas da API de forma clara, responsiva e segura.

| Responsabilidade | Descrição |
|---|---|
| **Telas operacionais** | Disponibilizar páginas para vendedores, clientes, produtos, metas e usuários. |
| **Telas analíticas** | Exibir dashboard, funil de vendas, histórico, recorrentes, comparativos e novos projetos. |
| **Filtros globais** | Permitir filtro por data, mercado, vendedor, projeto, produto, tipo de receita e outros critérios. |
| **Consumo da API** | Centralizar chamadas para backend, evitando regras duplicadas nas páginas. |
| **Tratamento de estado** | Controlar carregamento, erros, estados vazios e atualização dos dados. |
| **Autenticação visual** | Controlar navegação conforme login, perfil e permissões retornadas pelo backend. |
| **Publicação web** | Gerar build estático e disponibilizar a aplicação em produção. |

---

## Estrutura recomendada de diretórios

A estrutura abaixo deve ser usada como referência para manter o frontend organizado e reutilizável em novos projetos.

```text
client/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── DashboardLayout.tsx
    │   ├── FiltrosGlobais.tsx
    │   └── MultiSelect.tsx
    ├── hooks/
    │   └── useAuth.ts
    ├── lib/
    │   ├── api.ts
    │   ├── trpc.ts
    │   ├── utils.ts
    │   └── colors.ts
    └── pages/
        ├── Dashboard.tsx
        ├── Vendedores.tsx
        ├── Clientes.tsx
        ├── Produtos.tsx
        ├── FunilVendas.tsx
        ├── HistoricoClientes.tsx
        ├── NovosProjetos.tsx
        ├── RecorrentesRealOrcado.tsx
        ├── PanoramaCrm.tsx
        ├── Metas.tsx
        ├── Usuarios.tsx
        ├── Login.tsx
        └── ChangePassword.tsx
```

---

## Páginas principais

| Página | Objetivo técnico |
|---|---|
| **Dashboard** | Consolidar indicadores gerais, evolução mensal, metas e visão executiva. |
| **Vendedores** | Exibir desempenho por vendedor, clientes atendidos, faturamento, volume e evolução. |
| **Clientes** | Apresentar carteira, histórico, mix de produtos e evolução por cliente. |
| **Produtos** | Mostrar performance de produtos, evolução e participação nos resultados. |
| **Funil de Vendas** | Apresentar etapas comerciais, pipeline, oportunidades e acompanhamento por vendedor. |
| **Histórico de Clientes** | Consultar compras anteriores, recorrência e comportamento por período. |
| **Novos Projetos** | Acompanhar projetos novos, abertos, totais, evolução mensal e detalhamento. |
| **Recorrentes Real x Orçado** | Comparar recorrência, metas, orçamento e realizado. |
| **Panorama CRM** | Visualizar dados consolidados de leads, deals, origem e pipeline comercial. |
| **Metas** | Administrar metas mensais, vendedores e valores planejados. |
| **Usuários** | Gerenciar usuários, papéis, status e redefinição de senha. |
| **Login / Alteração de senha** | Controlar acesso inicial, sessão e troca obrigatória de senha quando aplicável. |

---

## Variáveis de ambiente do frontend

O frontend deve utilizar variáveis de ambiente para diferenciar execução local, homologação e produção. Em projetos com Vite, as variáveis expostas ao navegador devem utilizar o prefixo `VITE_`.[2]

| Variável | Exemplo | Finalidade |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | URL base da API utilizada pelo frontend em ambiente local. |
| `VITE_APP_ENV` | `local`, `homolog`, `production` | Identificação do ambiente em execução. |
| `VITE_APP_NAME` | `QG Polpa Brasil` | Nome exibido ou usado em logs visuais da aplicação. |

Exemplo de arquivo `.env.local`:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_ENV=local
VITE_APP_NAME=QG Polpa Brasil
```

Quando o frontend e o backend estiverem publicados no mesmo domínio, a aplicação pode usar chamadas relativas, como `/api` ou `/trpc`, dependendo do padrão implementado no backend.

---

## Instalação local

Antes de executar o frontend, é necessário ter **Node.js** instalado e acesso ao repositório do projeto.

```bash
git clone <url-do-repositorio>
cd qg-polpa-brasil
npm install
```

Para executar somente o frontend em ambiente local:

```bash
npm run dev:client
```

Quando o projeto estiver configurado para executar frontend e backend juntos, o comando principal pode ser:

```bash
npm run dev
```

---

## Build de produção

O build de produção gera os arquivos estáticos que serão publicados na hospedagem.

```bash
npm run build
```

Após o build, a pasta de distribuição do frontend deve ser enviada para o ambiente de hospedagem ou utilizada pelo servidor da aplicação, conforme a arquitetura adotada.

---

## Integração com a API

O frontend deve centralizar chamadas de API em arquivos próprios, como `client/src/lib/api.ts` ou `client/src/lib/trpc.ts`. Essa prática evita duplicação de URL, headers e tratamento de erro em várias páginas.

| Padrão | Aplicação recomendada |
|---|---|
| **Arquivo de serviços** | Concentrar funções como `getUsers`, `login`, `getDashboard`, `getClientes` e demais chamadas. |
| **Tipagem das respostas** | Criar tipos TypeScript para evitar inconsistência entre frontend e backend. |
| **Tratamento de erro** | Exibir mensagem clara quando a API retornar erro ou estiver indisponível. |
| **Credenciais** | Utilizar `credentials: 'include'` quando a autenticação usar cookies de sessão. |
| **Headers adicionais** | Incluir headers necessários para ambientes temporários, como testes com ngrok. |

---

## Configuração para Vercel

A Vercel deve ser conectada ao repositório GitHub para permitir deploy automático após alterações na branch principal. Para aplicações React SPA, é importante configurar fallback para `index.html`, evitando erro ao recarregar uma rota interna diretamente no navegador.[1]

Exemplo de `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Essa configuração garante que rotas como `/dashboard`, `/clientes` ou `/panorama-crm` sejam tratadas pelo roteador do React.

---

## Fluxo de versionamento

| Etapa | Padrão recomendado |
|---|---|
| **Branch principal** | Manter `main` ou `master` como branch estável de produção. |
| **Branches de feature** | Criar branches por tela, correção ou melhoria, como `feature/panorama-crm`. |
| **Pull request** | Abrir PR para registrar alteração, revisar código e manter histórico. |
| **Merge controlado** | Publicar somente após validação visual e teste de integração com a API. |
| **Deploy automático** | Permitir que a Vercel publique a branch principal após merge aprovado. |

---

## Checklist de validação do frontend

| Item | Critério de validação |
|---|---|
| **Login** | Usuário consegue autenticar e acessar a aplicação. |
| **Sessão** | Sessão persiste corretamente após atualização da página. |
| **Rotas internas** | Recarregar páginas internas não gera erro 404. |
| **Dashboard** | Indicadores carregam e respeitam filtros aplicados. |
| **Telas analíticas** | Gráficos, tabelas e cards exibem dados coerentes. |
| **Responsividade** | Layout funciona em resoluções comuns de notebook e desktop. |
| **Erros de API** | Mensagens são exibidas quando backend está indisponível. |
| **Build** | `npm run build` finaliza sem erro. |
| **Deploy** | Ambiente de produção carrega sem erro no navegador. |

---

## Observações técnicas

O frontend deve permanecer desacoplado das consultas SQL e das regras de negócio. Toda regra sensível deve estar no backend. O frontend deve se limitar a enviar filtros, receber respostas estruturadas e apresentar os dados em telas claras e consistentes.

Também é recomendado manter a documentação de telas atualizada sempre que uma nova página for criada ou quando uma página existente passar a consumir novos endpoints.

---

## Referências

[1]: https://vercel.com/docs/rewrites "Vercel — Rewrites"  
[2]: https://vite.dev/guide/env-and-mode "Vite — Env Variables and Modes"  
[3]: https://react.dev/ "React — Official Documentation"  
[4]: https://recharts.org/en-US/ "Recharts — Official Documentation"
