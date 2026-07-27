# Spec de integração — Placar Funil Comercial (FRONTEND)

Contraparte de `SPEC_BACKEND.md` (mesma pasta). Este documento é sobre layout, componentes e
onde isso entra no QG — não repete as regras de cálculo, só o contrato de dados que o backend
já expõe. Protótipo visual de referência: `funil-scorecard/app.py` (rodando em
`http://localhost:5050`, mesma paleta de cores do `index.css` do próprio QG — pode abrir e
comparar lado a lado).

## Acesso e navegação

- Só visível/habilitado pra usuários **admin** (mesma gate do backend, `adminProcedure`).
- Entra no menu lateral **dentro da seção CRM** (ao lado de Panorama CRM / Funil de Vendas).

## Seletor de período — usar Tabs, NÃO o PeriodoPicker

Isso é importante: o padrão "oficial" de período do QG (`FiltrosGlobais.tsx` / `PeriodoPicker`,
usado em Dashboard/Histórico/Vendedores/etc.) serve pra **range arbitrário de data** (o usuário
escolhe mês/ano livremente). O placar **não é assim** — são 4 recortes fixos e nomeados:

```
[Semana anterior]  [Semana atual]  [Mês atual]  [Mês anterior]
```

Isso é conceitualmente igual ao **segmented control / Tabs** que já existe (duplicado) em
`HistoricoClientes.tsx:752-764`, `PanoramaCrm.tsx:274-281` e `Vendedores.tsx:650-665` — visual
`bg-slate-900/60` no container, pílula ativa `bg-green-600`. Como é a 4ª tela reimplementando o
mesmo padrão, faz sentido extrair um componente `components/ui/tabs.tsx` genérico agora (usar
nesta tela nova; **não** precisa migrar as 3 telas existentes nesta mesma entrega — isso é uma
limpeza separada, deliberada, testada uma tela de cada vez).

**"Semana anterior" é a aba default/inicial** — é a que o usuário lê na reunião de segunda-feira,
por decisão explícita dele ("o veredito do recorte semana anterior é o mais importante").

## Layout das seções (nesta ordem, de cima pra baixo)

### 0. Veredito (hero, acima de tudo)
Card de destaque, cor neutra (não usa verde/amarelo/vermelho no card em si — quem carrega a cor
são os cards de baixo). Label pequeno "VEREDITO — {nome do recorte}" + o texto do veredito em
fonte maior (~16px), legível de longe (é o que o time lê primeiro na reunião).

### 1. Resultado
Duas linhas de 3 cards cada: "Ano {ano}" (Meta / Realizado / % atingido) e "Trimestre atual —
{label}" (mesma estrutura). Só o card de "% atingido" carrega semáforo (ícone + cor); Meta e
Realizado são neutros. Padrão de card: igual ao `KpiCard` que já existe em `Dashboard.tsx` —
label pequeno em caixa alta no topo, chip de ícone colorido no canto oposto (usar
`icon-green`/`icon-amber`/`icon-red` de `index.css`, já existem essas classes), valor grande
embaixo, texto de referência pequeno por último (ex.: "meta: 100%").

### 2. Cadência
4 cards (Abertos, Ganhos, Perdidos, Saldo) do recorte selecionado — todos com semáforo, **exceto**
quando o recorte é "Semana atual" (aí nenhum card tem cor, é só acompanhamento cru). Perdidos
mostra o número absoluto **e** a taxa entre parênteses (ex.: "21 (19,1%)") — a cor segue a taxa,
não o número absoluto (ver spec backend, é proposital: perder 21 de um funil de 300 é normal).
Embaixo dos cards, tabela por vendedora (Vendedor / Abertos / Ganhos / Perdidos / Avançaram /
Saldo) + linha de TOTAL. Quando o recorte tem um par de comparação (semana anterior↔retrasada,
mês atual↔anterior), mostra uma segunda tabela abaixo, com um `h4` de rótulo tipo "Semana
retrasada (referência)" — sem cards, só a tabela, pra contexto.

### 3. Saúde
**Sempre a mesma, não muda com o recorte selecionado** — deixar isso visualmente/textualmente
claro (ex.: nota "foto de agora, igual em qualquer recorte"). Tabela: Vendedor / Ativos / Fora do
SLA / Sem follow-up / Diagnóstico. As colunas "Fora do SLA" e "Sem follow-up" são badges (pill
com fundo tintado 15% de opacidade + texto na cor cheia — reaproveitar o padrão de badge que já
deve existir em algum lugar do design system, senão criar um pequeno). Coluna Diagnóstico é texto
livre, se tiver sido editado manualmente mostra um "✎" ao lado. Linha de TOTAL agregado. Abaixo da
tabela, uma linha só de texto: "⏸ Estagnado: N".

### 4. Ação
Tabela: Negócio / Vendedor / Fase / Dias parado / Follow-up agendado. As duas últimas colunas
sempre em vermelho (por definição, só entra na lista quem está fora do SLA e sem follow-up — não
tem outra cor possível aqui). Título mostra o total (ex.: "onde agir — só as 4 do placar, 16 no
total"). Se a lista vier vazia, mostrar uma linha única "Nenhum negócio nessa situação — bom
sinal." em vez de tabela vazia.

## Paleta e componentes visuais

**Já é a mesma paleta do QG** — o protótipo Python foi construído copiando literalmente
`qg-polpa-brasil/client/src/index.css` (fundo `#0c1828`, card `#122438`, borda `#1d3a55`, ícones
verde/âmbar/vermelho em `oklch`). Ao portar pra React, **usar os tokens/classes Tailwind que já
existem** (`bg-background`, `bg-card`, `border-border`, `icon-green`, `icon-amber`, `icon-red`,
`text-muted-foreground`, etc.) em vez de reintroduzir os valores — o CSS do protótipo é só
referência visual, não é pra copiar como `style={{}}` inline.

## Textos e cópias exatas

Todo o texto em português de cada indicador (o que significa Abertos/Ganhos/Perdidos/Avançaram/
Saldo, o que é perfil A/B, as réguas de semáforo em linguagem de vendedor, a tabela de SLA por
fase) já está escrito e validado — está em `render_ajuda()` dentro de `funil-scorecard/app.py`.
Essa mesma tela ("Como funciona") deveria existir no módulo novo também (uma aba extra, ou um
modal de ajuda) — é conteúdo pronto pra copiar, só adaptar pro componente certo.

## Comportamento com dado ausente

- Vendedora com 0 negócios ativos: `pctSla`/`pctFu` vêm `null` do backend — mostrar "—" em vez de
  "0%" ou de badge colorido (não faz sentido dar semáforo verde pra "sem dado").
- `luzes` vem `null` inteiro quando o recorte é "Semana atual" — todos os 4 cards da Cadência
  renderizam sem ícone/cor nesse caso, e o texto de referência vira "acompanhamento" em vez da
  meta/ritmo normal.

## Contrato de dados esperado (ver `SPEC_BACKEND.md` pra shape completo)

O componente deveria receber algo equivalente a `FunilScorecardResponse` (definido no doc do
backend) via uma query tRPC (ex.: `trpc.funilScorecard.getDashboard.useQuery({ recorte })`),
recarregando quando o usuário troca de aba. Não há filtro adicional (mercado/vendedor/etc.) nesta
tela — os 4 recortes são a única dimensão de navegação.
