# Geração de Listas → produção no QG Polpa — Brief do Agente de Frontend

Você é um dos dois agentes trabalhando nesta integração. O outro agente cuida do
backend (tRPC + serviço Python) do QG Polpa Brasil. **Vocês não conversam
diretamente** — o usuário (Ramon) relê mensagens de um lado pro outro copiando e
colando. Sempre que precisar de algo do agente de backend, ou tiver algo pronto
que ele precisa saber, escreva um bloco assim no fim da sua resposta:

```
>>> MENSAGEM PARA O AGENTE DE BACKEND >>>
(o que ele precisa saber ou decidir)
<<< FIM DA MENSAGEM <<<
```

Não trave esperando resposta. O backend já vai subir o router `geracaoListas`
com dados **mockados** primeiro (seguindo o contrato abaixo), justamente pra você
poder construir a UI inteira sem depender de ele terminar a integração real com
o Python — comece assumindo que `trpc.geracaoListas.*` já existe e responde os
tipos deste contrato.

---

## Contexto

**Geração de Listas** é uma ferramenta de deduplicação de prospecção pras
vendedoras: descrevem o que querem prospectar num chat, o sistema monta um
prompt pronto pra Manus (já excluindo quem já é cliente/CRM), elas colam de
volta o que a Manus gerou, o sistema classifica cada empresa em **Livre**
(pode prospectar) / **Revisar** (parecido com algo interno, olhar manualmente)
/ **Bloqueada** (já é cliente ou já está no CRM), e no final sai um Excel
pronto pra importar no Bitrix + um histórico de todas as listas já geradas.

Ela já existe **inteira e funcionando** como protótipo standalone em
`c:\DEV\Dahsboard Polpa Brasil\geracao-listas\` (Python/FastAPI, HTML
server-side, rodando em `http://localhost:5090`). Seu trabalho é construir a
**mesma experiência em React**, dentro do QG Polpa Brasil, consumindo os
procedures tRPC que o agente de backend está expondo.

---

## Design system do QG Polpa (siga à risca — não invente estilo novo)

Confirmado no código real do projeto (`client/tailwind.config.js`,
`client/src/index.css`, componentes `client/src/components/ui/*`):

- **Stack de UI**: shadcn/ui (Radix) + Tailwind. Ícones: `lucide-react`.
  Gráficos: `recharts`. Use os componentes já existentes em
  `client/src/components/ui/` (`card.tsx`, `button.tsx`, `badge.tsx`,
  `table.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`) em vez de criar do zero.
- **Dark-only** — não existe modo claro, não crie variante `dark:`.
- **Paleta**: fundo `#0c1828` (slate-900), superfície/card `#122438`
  (slate-800), borda `#1d3a55` (slate-700), verde de marca `#16a34a`
  (`bg-green-600`, hover `#15803d`). Texto quase branco, texto secundário em
  slate claro.
- **Cores semânticas** já usadas no projeto (`src/lib/colors.ts`) pra
  categorias de dados — reaproveite esse mesmo mapeamento pra Livre/Revisar/
  Bloqueada em vez de inventar cores novas:
  - Verde (`VENDA_FIRME`) → **Livre**
  - Âmbar (`FORECAST`) → **Revisar**
  - Vermelho (`DEVOLUCAO`) → **Bloqueada**
- **Layout**: sidebar fixa (`DashboardLayout.tsx`), 240px expandida, logo
  quadrado verde com iniciais + nome do produto, grupos de nav com label
  maiúsculo pequeno, item ativo com fundo `bg-green-600/20 text-green-400`.
- **Cards**: `rounded-xl border bg-card shadow-sm`, título `text-2xl
  font-semibold`. **Botão primário**: `bg-primary` (verde) `rounded-md`.
  **Badges**: `rounded-full px-2.5 py-0.5 text-xs font-semibold`.
- Fonte: Inter (ou `system-ui` como fallback, já que o Inter não está
  hospedado localmente no projeto hoje — confirme se precisa adicionar via
  Google Fonts ou se já basta o fallback).

O protótipo standalone (`geracao-listas/app.py`, função `BASE_CSS`/`_layout()`)
já foi restilizado pra bater com essa paleta, especificamente pra servir de
referência visual — pode abrir `http://localhost:5090` (se estiver rodando) ou
ler o HTML gerado por essas funções pra ver o resultado visual antes de montar
os componentes React equivalentes.

---

## As telas que você precisa construir

Adicione uma nova entrada em `menuGroups` (ou crie um grupo novo) em
`client/src/components/DashboardLayout.tsx`, e registre as rotas em
`client/src/App.tsx` (o roteamento é **wouter**, não react-router — use
`<Route path="..." component={...} />` dentro do `<Switch>` já existente).
Páginas ficam em `client/src/pages/*.tsx`.

Rotas sugeridas:
- `/geracao-listas` → Histórico (lista de cards)
- `/geracao-listas/novo` → Escolha: chat vs. só validar
- `/geracao-listas/novo/chat` → Chat de briefing
- `/geracao-listas/novo/validar` → Form simples (título + criar card direto)
- `/geracao-listas/:id` → Detalhe do card (briefing/prompt OU upload OU resultado, dependendo do status)
- `/geracao-listas/buscar` → Busca avulsa por nome/CNPJ

### 1. Histórico (`listarCards`)

Tabela: Título/segmento, Vendedora, Criado em, Status (badge), Resultado
("X livre / Y revisar / Z bloqueada"), botão excluir por linha (com
confirmação — `window.confirm` ou um `AlertDialog` do shadcn). Botão
"+ Nova lista" no topo levando pra `/geracao-listas/novo`.

### 2. Escolha (nova lista)

Duas opções lado a lado, cada uma um card clicável:
- **Gerar lista com o chat** → `/geracao-listas/novo/chat`
- **Só validar uma lista existente** → `/geracao-listas/novo/validar` (pula
  briefing inteiro, cria o card e vai direto pro upload)

### 3. Chat de briefing (`chatBriefing`, depois `finalizarBriefing`)

UI de chat simples: histórico de mensagens (bolha do usuário à direita, do
agente à esquerda), input de texto + botão enviar. Mantenha o `history`
(array opaco — não tente tipar o conteúdo, só repasse de ida e volta pro
backend) em estado local, reenviando ele inteiro a cada mensagem (é assim que
o backend espera, sem sessão de servidor). O chat manda uma mensagem inicial
automática assim que a tela abre ("Oi, quero criar uma lista de prospecção
nova."), igual o protótipo faz.

Quando a resposta do `chatBriefing` vier com `briefing` preenchido (não-null),
o chat encerra (esconde o input), e você chama `finalizarBriefing` passando
esse `briefing` + o `history` acumulado. A resposta traz `{ cardId, prompt,
exclusionCount, truncado }` — mostre o prompt num `<textarea readonly>` (ou
componente de código) com botão "Copiar", um aviso se `truncado` for true
("lista de exclusão atingiu o limite, segmento bem coberto"), e um botão/link
pra ir pro card (`/geracao-listas/{cardId}`).

**Perguntas obrigatórias do briefing** (o agente pergunta uma de cada vez,
você só precisa exibir a conversa, não validar campo por campo): segmento,
aplicação, quantidade de empresas desejada, profundidade de pesquisa (profunda
vs ampla), matriz-só ou matriz+filiais. Opcionais: região, porte, look-alike.

### 4. Validar lista existente (`criarCardValidacao`)

Form simples: campo texto "Título da lista" (opcional). Ao enviar, chama
`criarCardValidacao`, recebe `{ cardId }`, redireciona pro card — que vai cair
direto na tela de upload (mesma do fluxo do chat, só que sem seção de
briefing/prompt acima).

### 5. Card / detalhe (`obterCard`, `classificarLista`, `exportarExcel`, `excluirCard`)

Renderização condicional pelo `status`:

- Se `status` é `BRIEFING`, `PROMPT_GERADO` ou `AGUARDANDO_UPLOAD` → mostra
  (quando existirem) o briefing e o prompt gerado, e um **formulário de
  upload/colagem**: `<input type="file" accept=".xlsx">` + `<textarea>` pra
  colar texto/tabela. Ao enviar: se for arquivo, leia com `FileReader.
  readAsDataURL()`, tire o prefixo `data:...;base64,`, e mande em
  `arquivoBase64` + `nomeArquivo`; se for texto colado, mande em
  `textoColado`. Chama `classificarLista({ cardId, ... })`.
- Se `status` é `LISTA_CLASSIFICADA` → mostra a **avaliação** (stat tiles:
  total gerado, livre, revisar, bloqueada — considere usar a skill `dataviz`
  se for montar algo visual tipo gráfico/medidor, não só números crus),
  banner de alerta vermelho se `saturacaoAlerta` for true ("mais de 60-70% da
  lista já é bloqueada/revisar — segmento pode estar saturado"), e a
  **tabela de itens classificados**: Nome, Cidade, UF, badge da Classe,
  Motivo, Responsável, Possível duplicado (`matchRefNome`). Botão "Baixar
  Excel" chamando `exportarExcel({ cardId })` — a resposta vem
  `{ nomeArquivo, conteudoBase64 }`; decodifique o base64 pra um `Blob`
  (`atob` + `Uint8Array`, ou `fetch(\`data:...;base64,${conteudoBase64}\`)`) e
  dispare o download via um `<a>` temporário com `download={nomeArquivo}` e
  `URL.createObjectURL(blob)`. **Não existe endpoint REST de download neste
  projeto** — confirmado que não há precedente de `Content-Disposition`/GET
  binário em lugar nenhum do QG Polpa hoje, então essa é a primeira vez isso
  é implementado; siga o padrão base64-via-tRPC do contrato, não peça uma
  rota REST pro backend a menos que o base64 realmente não funcione na
  prática (arquivo real é pequeno, não deve ser problema).
- Botão "Excluir" (com confirmação) chamando `excluirCard`.

### 6. Busca avulsa (`buscarEmpresa`)

Form com campo "Nome da empresa" + campo opcional "CNPJ" + botão buscar.
Resultado: card do **Veredito** (badge da classe + motivo + fonte encontrada
+ nome no cadastro + responsável) e uma **tabela de candidatos parecidos**
(nome, fonte, responsável, % de similaridade) — isso é uma consulta pontual,
não cria card nenhum no histórico.

---

## Contrato de API (fonte da verdade — mesmo texto está no doc do backend)

### Tipos compartilhados

```ts
type Classe = "LIVRE" | "REVISAR" | "BLOQUEADA"
type StatusCard = "BRIEFING" | "PROMPT_GERADO" | "AGUARDANDO_UPLOAD" | "LISTA_CLASSIFICADA"

type Briefing = {
  segmento: string
  segmentoCanonico: string | null
  aplicacao: string
  quantidade: string
  profundidadePesquisa: "profunda" | "ampla"
  tipoEmpresa: "somente_matriz" | "matriz_e_filiais"
  regiao: string | null
  porte: string | null
  lookAlike: string | null
  observacoes: string | null
}

type CardResumo = {
  id: number
  titulo: string | null
  createdBy: string | null
  createdAt: string        // ISO 8601
  status: StatusCard
  segmento: string | null
  totalManus: number | null
  totalLivre: number | null
  totalRevisar: number | null
  totalBloqueada: number | null
}

type ItemClassificado = {
  nome: string
  cidade: string | null
  uf: string | null
  cnpj: string | null
  site: string | null
  telefone: string | null
  email: string | null
  classe: Classe
  motivo: string
  fonteBloqueio: "FATO_VENDAS" | "CRM_LEAD" | "CRM_DEAL" | "CRM_COMPANY" | null
  matchRefNome: string | null
  matchScore: number | null
  responsavel: string | null
}

type Avaliacao = {
  totalManus: number
  totalLivre: number
  totalRevisar: number
  totalBloqueada: number
  bloqueadaClienteAtivo: number
  bloqueadaCrmLead: number
  bloqueadaCrmDeal: number
  pctAderencia: number       // 0-1
  pctCnpjPresente: number    // 0-1
  pctContatoPresente: number // 0-1
  saturacaoAlerta: boolean
}

type CardDetalhado = CardResumo & {
  briefing: Briefing | null
  promptTexto: string | null
  exclusionCount: number | null
  truncado: boolean | null
  itens: ItemClassificado[]
  avaliacao: Avaliacao | null
}

type Candidato = {
  nomeOriginal: string
  fonte: "FATO_VENDAS" | "CRM_LEAD" | "CRM_DEAL" | "CRM_COMPANY"
  score: number              // 0-100
  cnpjBate: boolean
  responsavel: string | null
}

type Veredito = {
  classe: Classe
  motivo: string
  fonteBloqueio: string | null
  matchRefNome: string | null
  matchScore: number | null
  responsavel: string | null
}
```

### Procedures tRPC (`trpc.geracaoListas.*`)

| Procedure | Input | Output |
|---|---|---|
| `listarCards` | — | `CardResumo[]` |
| `obterCard` | `{ cardId: number }` | `CardDetalhado` |
| `criarCardValidacao` | `{ titulo?: string }` | `{ cardId: number }` |
| `chatBriefing` | `{ message: string, history: unknown[] }` | `{ resposta: string, history: unknown[], briefing: Briefing \| null }` |
| `finalizarBriefing` | `{ briefing: Briefing, conversa: unknown[] }` | `{ cardId: number, prompt: string, exclusionCount: number, truncado: boolean }` |
| `classificarLista` | `{ cardId: number, arquivoBase64?: string, nomeArquivo?: string, textoColado?: string }` | `{ itens: ItemClassificado[], avaliacao: Avaliacao }` |
| `exportarExcel` | `{ cardId: number }` | `{ nomeArquivo: string, conteudoBase64: string }` |
| `excluirCard` | `{ cardId: number }` | `{ ok: true }` |
| `buscarEmpresa` | `{ nome: string, cnpj?: string }` | `{ veredito: Veredito, candidatos: Candidato[] }` |

Todos requerem usuário logado (`protectedProcedure` do lado do backend) — o
`created_by`/dono da lista é resolvido automaticamente pelo backend a partir da
sessão, você **não precisa e não deve** mandar isso no input.

---

## Detalhes de UX a preservar do protótipo

- **Badges de classe**: Livre = verde, Revisar = âmbar, Bloqueada = vermelho —
  use as mesmas cores semânticas do resto do QG Polpa (`src/lib/colors.ts`),
  não invente uma paleta paralela só pra essa feature.
- **Alerta de saturação**: quando `avaliacao.saturacaoAlerta` é true, mostrar
  um banner chamativo (vermelho/laranja) acima da tabela de resultado, texto
  tipo "Mais de 60-70% da lista já é bloqueada ou precisa revisão — esse
  segmento pode estar saturado, considere mudar de segmento ou aplicação."
- **Truncamento do prompt**: se `truncado` for true na geração do prompt,
  avisar que a lista de exclusão bateu no teto (60 nomes) e que o segmento já
  tem bastante cobertura.
- **Responsável**: sempre que aparecer uma empresa já conhecida (bloqueada,
  revisar, ou candidato na busca avulsa), mostrar quem é o responsável
  (vendedor no faturamento ou dono no CRM) — é uma informação que o Ramon
  pediu explicitamente que aparecesse em toda visualização de match.

---

## Perguntas em aberto (avisar o Ramon, não decidir sozinho)

1. Histórico deveria filtrar por vendedora logada por padrão, com opção de
   "ver todas" pra quem for admin? Ou mostra tudo pra todo mundo desde já?
   (mesma pergunta que está no doc do backend — resposta impacta os dois lados:
   se for filtrado, o backend precisa de um parâmetro/contexto a mais em
   `listarCards`.)
2. Vale a pena reaproveitar a skill `dataviz` pra os stat tiles/alerta de
   saturação, ou um layout simples de cards com número grande já resolve? Sem
   volume de dados temporal (não é série histórica), pode não precisar de
   gráfico de verdade — avaliar caso a caso ao construir a tela 5.

---

## Como coordenar com o agente de backend

1. Comece direto pela UI usando o router mockado que o backend vai subir
   primeiro (dados fake seguindo os tipos do contrato acima) — não espere a
   integração real com o Python estar pronta.
2. Se durante a construção você perceber que falta algum campo no contrato ou
   que algum tipo devia ser diferente, escreva o bloco de mensagem pro
   backend explicando exatamente o que mudar e por quê, e já ajuste o seu lado
   assumindo a mudança (documentando a suposição) em vez de travar esperando.
3. Avise o backend quando terminar cada tela, pra ele saber que pode trocar o
   mock daquele procedure específico pela integração real sem quebrar nada
   visualmente.
