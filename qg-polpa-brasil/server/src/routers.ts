import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, publicProcedure, protectedProcedure, adminProcedure } from './trpc'
import { COOKIE_NAME, loginWithPassword, createSessionToken, hashPassword, generateRandomPassword } from './auth'
import {
  getFiltrosDisponiveis,
  getKpisGlobais, getEvolucaoMensal, getEvolucaoMensalAnoAnterior, getKpisAnoAnterior,
  getOrcamentoKpis, getOrcamentoMensal, getKpisPorTipoReceita,
  getPerformanceVendedores, getEvolucaoVendedor, getClientesVendedor,
  getEvolucaoConsolidada, getVendedoresEvolucaoPorTipo, getClientesConsolidados,
  getFaturamentoCrmMapping, getCrmKpisPorVendedor,
  getRecorrentesKpis, getRecorrentesTabela, getRecorrentesProdutos, getRecorrentesFiltros,
  getListaClientes, getHistoricoCliente, getMixCliente, getSaudeCarteira, getVendasPorEstado, getClientesCrescimento,
  getPerformanceProdutos, getEvolucaoProduto, getEvolucaoProdutosConsolidada,
  getPerformanceSegmentos, getEvolucaoSegmento,
  getProjetoRepresentatividade, getClientesRepresentatividade,
  getPipelineComercial, getPipelineDetalhado,
  getDrillDownTipoReceita, getTotalVendas, reclassificarTipoReceita,
  getDashboardVendedores, getDashboardSegmentos, getDashboardTopClientes, getMetasVendedores,
  listMetasAdmin, upsertMeta, deleteMeta,
  getInsights, insertInsight, updateInsightStatus, deleteAllInsights,
  listTasks, createTask, updateTask, deleteTask,
  getChatHistory, saveChatMessage, clearChatHistory, getChatSessions,
  getUploads, createUpload, updateUpload, importarVendas,
  listUsers, createUser, updateUser, resetUserPassword, updatePassword,
  getNovoProjetosKpisV2, getNovoProjetosPorMesV2, getListaNovosProjetos, getNovoProjetosDrilldown,
  getFunilKpis, getFunilPorEtapa, getFunilPorPipeline, getFunilTopVendedores, getFunilEvolucaoMensal,
  getPanoramaLeads, getPanoramaDeals, getPanoramaLeadsSnapshot, getPanoramaDealsSnapshot,
  getCrmVendedores,
  createForecastSnapshot, getSnapshotDates, getSnapshotComparativo, getSnapshotComparativoProdutos,
  getSnapshotHistorico, getSnapshotHistoricoProdutos,
  getHistoricoFiltros, getHistoricoKpis, getHistoricoListaClientes,
  getHistoricoEvolucaoMensal, getHistoricoTopProdutos, getHistoricoPorEstado, getHistoricoPorSegmento,
  getHistoricoClienteProdutos,
} from './db'

const filtrosSchema = z.object({
  mercados: z.array(z.string()).optional(),
  vendedores: z.array(z.string()).optional(),
  projetos: z.array(z.string()).optional(),
  gruposProduto: z.array(z.string()).optional(),
  tiposReceita: z.array(z.string()).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  codParc: z.number().optional(),
  codProduto: z.number().optional(),
  uf: z.string().optional(),
})

const COOKIE_OPTS = { httpOnly: true, path: '/', maxAge: 365 * 24 * 60 * 60, sameSite: 'lax' as const }

export const appRouter = router({
  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) return null
      const u = ctx.user
      return { id: u.id, name: u.name, email: u.email, role: u.role, mustChangePassword: u.must_change_password }
    }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await loginWithPassword(input.email, input.password)
        if (!user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha inválidos' })
        const token = createSessionToken(user.id, user.role)
        ctx.res.cookie(COOKIE_NAME, token, COOKIE_OPTS)
        return { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.must_change_password }
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { path: '/' })
      return { success: true }
    }),

    changePassword: protectedProcedure
      .input(z.object({ newPassword: z.string().min(6, 'Mínimo 6 caracteres') }))
      .mutation(async ({ input, ctx }) => {
        const hash = await hashPassword(input.newPassword)
        await updatePassword(ctx.user.id, hash)
        return { success: true }
      }),
  }),

  // ─── Usuários (ADMIN) ──────────────────────────────────────────────────────
  users: router({
    list: adminProcedure.query(() => listUsers()),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        role: z.enum(['ADMIN', 'VENDEDOR']),
      }))
      .mutation(async ({ input }) => {
        const tempPass = generateRandomPassword()
        const hash = await hashPassword(tempPass)
        const id = await createUser({ name: input.name, email: input.email, passwordHash: hash, role: input.role })
        return { id, tempPassword: tempPass }
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(2).optional(),
        role: z.enum(['ADMIN', 'VENDEDOR']).optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input
        return updateUser(id, data)
      }),

    resetPassword: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const tempPass = generateRandomPassword()
        const hash = await hashPassword(tempPass)
        await resetUserPassword(input.id, hash)
        return { tempPassword: tempPass }
      }),
  }),

  // ─── Metas 2026 ───────────────────────────────────────────────────────────
  metas2026: router({
    list:   adminProcedure.query(() => listMetasAdmin()),
    upsert: adminProcedure
      .input(z.object({
        nomeVendedor: z.string().min(1),
        mes:          z.string().regex(/^\d{4}-\d{2}$/),
        valorMeta:    z.number().min(0),
        projeto:      z.string().nullable().optional(),
      }))
      .mutation(({ input }) => upsertMeta({
        nomeVendedor: input.nomeVendedor,
        mes:          input.mes,
        valorMeta:    input.valorMeta,
        projeto:      input.projeto ?? null,
      })),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteMeta(input.id)),
  }),

  // ─── Filtros ───────────────────────────────────────────────────────────────
  filtros: router({
    disponiveis: publicProcedure.query(() => getFiltrosDisponiveis()),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    kpis: publicProcedure.input(filtrosSchema).query(({ input }) => getKpisGlobais(input)),
    evolucaoMensal: publicProcedure.input(filtrosSchema).query(({ input }) => getEvolucaoMensal(input)),
    evolucaoMensalAnoAnterior: publicProcedure.input(filtrosSchema).query(({ input }) => getEvolucaoMensalAnoAnterior(input)),
    kpisAnoAnterior: publicProcedure.input(filtrosSchema).query(({ input }) => getKpisAnoAnterior(input)),
    orcamentoKpis: publicProcedure.input(filtrosSchema).query(({ input }) => getOrcamentoKpis(input)),
    orcamentoMensal: publicProcedure.input(filtrosSchema).query(({ input }) => getOrcamentoMensal(input)),
    kpisPorTipo: publicProcedure.input(filtrosSchema).query(({ input }) => getKpisPorTipoReceita(input)),
    totalVendas: publicProcedure.query(() => getTotalVendas()),
    drillDown: publicProcedure
      .input(z.object({ tipoReceita: z.string(), filtros: filtrosSchema.optional() }))
      .query(({ input }) => getDrillDownTipoReceita(input.tipoReceita, input.filtros ?? {})),
    segmentos: publicProcedure.input(filtrosSchema).query(({ input }) => getDashboardSegmentos(input)),
    vendedores: publicProcedure.input(filtrosSchema).query(({ input }) => getDashboardVendedores(input)),
    projetos: publicProcedure.input(filtrosSchema).query(({ input }) => getProjetoRepresentatividade(input)),
    clientesTop: publicProcedure.input(filtrosSchema).query(({ input }) => getDashboardTopClientes(input)),
  }),

  // ─── Vendedores ────────────────────────────────────────────────────────────
  vendedores: router({
    lista: publicProcedure.input(filtrosSchema).query(({ input }) => getPerformanceVendedores(input)),
    performance: publicProcedure.input(filtrosSchema).query(({ input }) => getPerformanceVendedores(input)),
    evolucao: publicProcedure
      .input(z.object({ nomeVendedor: z.string(), filtros: filtrosSchema.optional() }))
      .query(({ input }) => getEvolucaoVendedor(input.nomeVendedor, input.filtros ?? {})),
    clientes: publicProcedure
      .input(z.object({ nomeVendedor: z.string(), filtros: filtrosSchema.optional() }))
      .query(({ input }) => getClientesVendedor(input.nomeVendedor, input.filtros)),
    evolucaoConsolidada: publicProcedure.input(filtrosSchema).query(({ input }) => getEvolucaoConsolidada(input)),
    evolucaoPorTipo: publicProcedure.input(filtrosSchema).query(({ input }) => getVendedoresEvolucaoPorTipo(input)),
    crmMapping: publicProcedure.query(() => getFaturamentoCrmMapping()),
    crmKpis: publicProcedure.query(() => getCrmKpisPorVendedor()),
    clientesConsolidados: publicProcedure.input(filtrosSchema).query(({ input }) => getClientesConsolidados(input)),
    projetos: publicProcedure
      .input(z.object({ filtros: filtrosSchema, nomeVendedor: z.string().optional() }))
      .query(({ input }) => getProjetoRepresentatividade(input.filtros, input.nomeVendedor)),
    metas: publicProcedure.input(filtrosSchema.optional()).query(({ input }) => getMetasVendedores(input)),
  }),

  // ─── Clientes ──────────────────────────────────────────────────────────────
  clientes: router({
    lista: publicProcedure.input(filtrosSchema).query(({ input }) => getListaClientes(input)),
    historico: publicProcedure
      .input(z.object({ codParc: z.number(), filtros: filtrosSchema.optional() }))
      .query(({ input }) => getHistoricoCliente(input.codParc, input.filtros)),
    mix: publicProcedure
      .input(z.object({ codParc: z.number(), filtros: filtrosSchema.optional() }))
      .query(({ input }) => getMixCliente(input.codParc, input.filtros)),
    saudeCarteira: publicProcedure.input(filtrosSchema).query(({ input }) => getSaudeCarteira(input)),
    vendasPorEstado: publicProcedure
      .input(z.object({ filtros: filtrosSchema.optional(), codParc: z.number().optional() }))
      .query(({ input }) => getVendasPorEstado(input.filtros ?? {})),
    crescimento: publicProcedure.input(filtrosSchema).query(({ input }) => getClientesCrescimento(input)),
  }),

  // ─── Produtos ──────────────────────────────────────────────────────────────
  produtos: router({
    performance: publicProcedure.input(filtrosSchema).query(({ input }) => getPerformanceProdutos(input)),
    evolucao: publicProcedure
      .input(z.object({ codProduto: z.number(), filtros: filtrosSchema.optional() }))
      .query(({ input }) => getEvolucaoProduto(input.codProduto, input.filtros ?? {})),
    evolucaoConsolidada: publicProcedure.input(filtrosSchema).query(({ input }) => getEvolucaoProdutosConsolidada(input)),
  }),

  // ─── Segmentos ─────────────────────────────────────────────────────────────
  segmentos: router({
    performance: publicProcedure.input(filtrosSchema).query(({ input }) => getPerformanceSegmentos(input)),
    evolucao: publicProcedure
      .input(z.object({ segmento: z.string() }))
      .query(({ input }) => getEvolucaoSegmento(input.segmento)),
  }),

  // ─── Novos Projetos ────────────────────────────────────────────────────────
  novosProjetos: router({
    kpis: publicProcedure
      .input(filtrosSchema.extend({ modoCard: z.enum(['abertos', 'totais']).optional() }))
      .query(({ input }) => getNovoProjetosKpisV2(input, input.modoCard)),
    porMes: publicProcedure
      .input(filtrosSchema.extend({ modoCard: z.enum(['abertos', 'totais']).optional() }))
      .query(({ input }) => getNovoProjetosPorMesV2(input, input.modoCard)),
    lista: publicProcedure
      .input(filtrosSchema.extend({ modoCard: z.enum(['abertos', 'totais']).optional() }))
      .query(({ input }) => getListaNovosProjetos(input, input.modoCard)),
    drilldown: publicProcedure
      .input(filtrosSchema.extend({ mes: z.string() }))
      .query(({ input }) => getNovoProjetosDrilldown(input.mes, input)),
  }),

  // ─── Pipeline ──────────────────────────────────────────────────────────────
  pipeline: router({
    funil: publicProcedure.input(filtrosSchema).query(({ input }) => getPipelineComercial(input)),
    detalhado: publicProcedure.input(filtrosSchema).query(({ input }) => getPipelineDetalhado(input)),
  }),

  // ─── Panorama CRM ──────────────────────────────────────────────────────────
  panoramaCrm: router({
    vendedores:    publicProcedure.query(() => getCrmVendedores()),
    leadsSnapshot: publicProcedure.query(() => getPanoramaLeadsSnapshot()),
    dealsSnapshot: publicProcedure
      .input(z.object({ pipelineId: z.number().nullable(), origem: z.enum(['leads','base','total']), userId: z.number().optional() }))
      .query(({ input }) => getPanoramaDealsSnapshot(input.pipelineId, input.origem, input.userId)),
    leads: publicProcedure
      .input(z.object({ dateIni: z.string(), dateFim: z.string(), visao: z.enum(['calendario','coorte']) }))
      .query(({ input }) => getPanoramaLeads(input.dateIni, input.dateFim, input.visao)),
    deals: publicProcedure
      .input(z.object({ dateIni: z.string(), dateFim: z.string(), visao: z.enum(['calendario','coorte']), pipelineId: z.number().nullable(), origem: z.enum(['leads','base','total']), userId: z.number().optional() }))
      .query(({ input }) => getPanoramaDeals(input.dateIni, input.dateFim, input.visao, input.pipelineId, input.origem, input.userId)),
  }),

  // ─── Funil de Vendas CRM ───────────────────────────────────────────────────
  funilCrm: router({
    vendedores:    publicProcedure.query(() => getCrmVendedores()),
    kpis:          publicProcedure.input(z.object({ pipelineIds: z.array(z.number()).optional(), userId: z.number().optional() }).optional()).query(({ input }) => getFunilKpis(input?.pipelineIds, input?.userId)),
    porEtapa:      publicProcedure.input(z.object({ pipelineIds: z.array(z.number()).optional(), userId: z.number().optional() }).optional()).query(({ input }) => getFunilPorEtapa(input?.pipelineIds, input?.userId)),
    porPipeline:   publicProcedure.input(z.object({ pipelineIds: z.array(z.number()).optional(), userId: z.number().optional() }).optional()).query(({ input }) => getFunilPorPipeline(input?.pipelineIds, input?.userId)),
    topVendedores: publicProcedure.input(z.object({ pipelineIds: z.array(z.number()).optional(), userId: z.number().optional() }).optional()).query(({ input }) => getFunilTopVendedores(input?.pipelineIds, input?.userId)),
    evolucaoMensal:publicProcedure.input(z.object({ pipelineIds: z.array(z.number()).optional(), userId: z.number().optional() }).optional()).query(({ input }) => getFunilEvolucaoMensal(input?.pipelineIds, input?.userId)),
  }),

  // ─── Insights de IA ────────────────────────────────────────────────────────
  // ─── Recorrentes Real x Orçado ─────────────────────────────────────────────
  recorrentes: router({
    filtros: publicProcedure.query(() => getRecorrentesFiltros()),
    kpis: publicProcedure
      .input(z.object({ dataInicio: z.string().optional(), dataFim: z.string().optional(), mercados: z.array(z.string()).optional(), vendedores: z.array(z.string()).optional(), codParc: z.number().optional() }).optional())
      .query(({ input }) => getRecorrentesKpis(input ?? {})),
    tabela: publicProcedure
      .input(z.object({ dataInicio: z.string().optional(), dataFim: z.string().optional(), mercados: z.array(z.string()).optional(), vendedores: z.array(z.string()).optional(), codParc: z.number().optional() }).optional())
      .query(({ input }) => getRecorrentesTabela(input ?? {})),
    produtos: publicProcedure
      .input(z.object({ codParc: z.number(), dataInicio: z.string().optional(), dataFim: z.string().optional(), mercados: z.array(z.string()).optional(), vendedores: z.array(z.string()).optional() }))
      .query(({ input }) => getRecorrentesProdutos(input.codParc, input)),
  }),

  insights: router({
    lista: publicProcedure
      .input(z.object({ tipo: z.string().optional(), prioridade: z.string().optional(), status: z.string().optional() }).optional())
      .query(({ input }) => getInsights(input ?? {})),

    atualizarStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(['ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'DESCARTADO']) }))
      .mutation(({ input }) => updateInsightStatus(input.id, input.status)),

    gerar: protectedProcedure.mutation(async () => {
      const [clientes, produtos, segmentos, pipeline] = await Promise.all([
        getListaClientes({}),
        getPerformanceProdutos({}),
        getPerformanceSegmentos({}),
        getPipelineComercial({}),
      ])
      if (clientes.length === 0) return { gerados: 0, mensagem: 'Nenhum dado disponível.' }

      const hoje = new Date()
      const clientesComStatus = clientes.map(c => {
        const ultima = c.ultimaCompra ? new Date(c.ultimaCompra) : null
        const dias = ultima ? Math.floor((hoje.getTime() - ultima.getTime()) / 86400000) : 999
        const status = dias <= 180 ? 'ATIVO' : dias <= 365 ? 'EM_RISCO' : 'INATIVO'
        return { ...c, diasSemCompra: dias, status }
      })

      const totalFat = clientes.reduce((s, c) => s + Number(c.faturamento), 0)
      const contexto = {
        totalClientes: clientes.length,
        clientesAtivos: clientesComStatus.filter(c => c.status === 'ATIVO').length,
        clientesEmRisco: clientesComStatus.filter(c => c.status === 'EM_RISCO').length,
        clientesInativos: clientesComStatus.filter(c => c.status === 'INATIVO').length,
        mediaFaturamentoCliente: totalFat / clientes.length,
        topClientes: clientesComStatus.slice(0, 10).map(c => ({ nome: c.razaoSocial, faturamento: Number(c.faturamento), status: c.status, diasSemCompra: c.diasSemCompra })),
        topProdutos: produtos.slice(0, 10).map(p => ({ nome: p.nomeProduto, faturamento: Number(p.faturamento), clientes: Number(p.clientes) })),
        segmentos: segmentos.map(s => ({ nome: s.segmento, faturamento: Number(s.faturamento), clientes: Number(s.clientes) })),
        pipeline: pipeline.map(p => ({ tipo: p.tipoReceita, faturamento: Number(p.faturamento), clientes: Number(p.clientes) })),
      }

      // Gera insights locais sem LLM (pode ser substituído por API de IA)
      const novosInsights = []
      for (const c of clientesComStatus.filter(x => x.status === 'INATIVO').slice(0, 3)) {
        novosInsights.push({ tipoInsight: 'CLIENTE_INATIVO', nomeCliente: c.razaoSocial, descricao: `${c.razaoSocial} está inativo há ${c.diasSemCompra} dias. Último faturamento: R$ ${Number(c.faturamento).toLocaleString('pt-BR')}.`, prioridade: 'ALTA', impactoEstimadoR: Number(c.faturamento) * 0.8, impactoEstimadoKg: Number(c.volume) * 0.8 })
      }
      for (const c of clientesComStatus.filter(x => x.status === 'EM_RISCO').slice(0, 3)) {
        novosInsights.push({ tipoInsight: 'RISCO_QUEDA', nomeCliente: c.razaoSocial, descricao: `${c.razaoSocial} não compra há ${c.diasSemCompra} dias. Risco de inativação.`, prioridade: 'MEDIA', impactoEstimadoR: Number(c.faturamento) * 0.5, impactoEstimadoKg: Number(c.volume) * 0.5 })
      }
      for (const p of produtos.slice(0, 2)) {
        novosInsights.push({ tipoInsight: 'PRODUTO_CRESCIMENTO', nomeProduto: p.nomeProduto, descricao: `${p.nomeProduto} é top produto com ${Number(p.clientes)} clientes ativos.`, prioridade: 'BAIXA', impactoEstimadoR: Number(p.faturamento) * 0.1, impactoEstimadoKg: Number(p.volume) * 0.1 })
      }

      await deleteAllInsights()
      for (const ins of novosInsights) await insertInsight(ins as Parameters<typeof insertInsight>[0])
      return { gerados: novosInsights.length, mensagem: `${novosInsights.length} insights gerados.` }
    }),
  }),

  // ─── Tarefas ───────────────────────────────────────────────────────────────
  tasks: router({
    list: publicProcedure
      .input(z.object({ status: z.string().optional(), prioridade: z.string().optional() }).optional())
      .query(({ input }) => listTasks(input ?? {})),

    create: protectedProcedure
      .input(z.object({
        titulo: z.string().min(1),
        descricao: z.string().optional(),
        status: z.enum(['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional(),
        prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
        responsavel: z.string().optional(),
        prazo: z.string().optional(),
      }))
      .mutation(({ input, ctx }) => createTask({
        ...input,
        criadoPor: ctx.user.name ?? ctx.user.email,
        criadoPorId: ctx.user.id,
      })),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().optional(),
        descricao: z.string().optional(),
        status: z.enum(['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional(),
        prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
        responsavel: z.string().optional(),
        prazo: z.string().optional().nullable(),
      }))
      .mutation(({ input }) => {
        const { id, ...rest } = input
        return updateTask(id, rest as Parameters<typeof updateTask>[1])
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteTask(input.id)),
  }),

  // ─── Chatbot ───────────────────────────────────────────────────────────────
  chatbot: router({
    sessions: protectedProcedure
      .query(({ ctx }) => getChatSessions(ctx.user.id)),

    history: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => getChatHistory(input.sessionId)),

    deleteSession: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => clearChatHistory(input.sessionId)),

    send: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        message: z.string().min(1),
        history: z.array(z.any()).default([]),
      }))
      .mutation(async ({ input, ctx }) => {
        await saveChatMessage(input.sessionId, ctx.user.id, 'user', input.message)

        const pythonUrl = process.env.PYTHON_API_URL ?? 'http://localhost:8000'
        const secret = process.env.INTERNAL_CHAT_SECRET ?? ''

        const res = await fetch(`${pythonUrl}/api/chat-qg`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': secret },
          body: JSON.stringify({ message: input.message, history: input.history }),
        })

        if (!res.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Agente IA indisponível' })

        const data = await res.json() as { answer: string; history: unknown[] }
        await saveChatMessage(input.sessionId, null, 'assistant', data.answer)
        return { reply: data.answer, agentHistory: data.history }
      }),

    clear: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => clearChatHistory(input.sessionId)),
  }),

  // ─── Snapshot Semanal ─────────────────────────────────────────────────────
  snapshots: router({
    info: publicProcedure.query(() => getSnapshotDates()),

    comparativo: publicProcedure
      .input(filtrosSchema)
      .query(({ input }) => getSnapshotComparativo(input)),

    produtos: publicProcedure
      .input(z.object({ codParc: z.number(), filtros: filtrosSchema.optional() }))
      .query(({ input }) => getSnapshotComparativoProdutos(input.codParc, input.filtros ?? {})),

    trigger: adminProcedure
      .mutation(() => createForecastSnapshot()),

    historico: publicProcedure
      .input(filtrosSchema)
      .query(({ input }) => getSnapshotHistorico(input)),

    historicoProdutos: publicProcedure
      .input(z.object({ codParc: z.number(), filtros: filtrosSchema.optional() }))
      .query(({ input }) => getSnapshotHistoricoProdutos(input.codParc, input.filtros ?? {})),
  }),

  // ─── Histórico Clientes ────────────────────────────────────────────────────
  historicoClientes: router({
    filtros: publicProcedure.query(() => getHistoricoFiltros()),

    kpis: publicProcedure
      .input(z.object({
        anos: z.array(z.number().int()).min(1),
        meses: z.array(z.number().int().min(1).max(12)).optional(),
        codParcs: z.array(z.number().int()).optional(),
        mercados: z.array(z.string()).optional(),
        gruposProduto: z.array(z.string()).optional(),
        vendedores: z.array(z.string()).optional(),
        ufs: z.array(z.string()).optional(),
        codProdutos: z.array(z.string()).optional(),
      }))
      .query(({ input }) => getHistoricoKpis(input)),

    listaClientes: publicProcedure
      .input(z.object({
        anos: z.array(z.number().int()).min(1),
        meses: z.array(z.number().int().min(1).max(12)).optional(),
        codParcs: z.array(z.number().int()).optional(),
        mercados: z.array(z.string()).optional(),
        gruposProduto: z.array(z.string()).optional(),
        vendedores: z.array(z.string()).optional(),
        ufs: z.array(z.string()).optional(),
        codProdutos: z.array(z.string()).optional(),
      }))
      .query(({ input }) => getHistoricoListaClientes(input)),

    evolucaoMensal: publicProcedure
      .input(z.object({
        anos: z.array(z.number().int()).min(1),
        meses: z.array(z.number().int().min(1).max(12)).optional(),
        codParcs: z.array(z.number().int()).optional(),
        mercados: z.array(z.string()).optional(),
        gruposProduto: z.array(z.string()).optional(),
        vendedores: z.array(z.string()).optional(),
        codProdutos: z.array(z.string()).optional(),
      }))
      .query(({ input }) => getHistoricoEvolucaoMensal(input)),

    topProdutos: publicProcedure
      .input(z.object({
        anos: z.array(z.number().int()).min(1),
        meses: z.array(z.number().int().min(1).max(12)).optional(),
        codParcs: z.array(z.number().int()).optional(),
        mercados: z.array(z.string()).optional(),
        gruposProduto: z.array(z.string()).optional(),
        vendedores: z.array(z.string()).optional(),
        codProdutos: z.array(z.string()).optional(),
      }))
      .query(({ input }) => getHistoricoTopProdutos(input)),

    porEstado: publicProcedure
      .input(z.object({
        anos: z.array(z.number().int()).min(1),
        meses: z.array(z.number().int().min(1).max(12)).optional(),
        codParcs: z.array(z.number().int()).optional(),
        mercados: z.array(z.string()).optional(),
        gruposProduto: z.array(z.string()).optional(),
        vendedores: z.array(z.string()).optional(),
        ufs: z.array(z.string()).optional(),
        codProdutos: z.array(z.string()).optional(),
      }))
      .query(({ input }) => getHistoricoPorEstado(input)),

    porSegmento: publicProcedure
      .input(z.object({
        anos: z.array(z.number().int()).min(1),
        meses: z.array(z.number().int().min(1).max(12)).optional(),
        codParcs: z.array(z.number().int()).optional(),
        mercados: z.array(z.string()).optional(),
        gruposProduto: z.array(z.string()).optional(),
        vendedores: z.array(z.string()).optional(),
        ufs: z.array(z.string()).optional(),
        codProdutos: z.array(z.string()).optional(),
      }))
      .query(({ input }) => getHistoricoPorSegmento(input)),

    clienteProdutos: publicProcedure
      .input(z.object({
        anos: z.array(z.number().int()).min(1),
        meses: z.array(z.number().int().min(1).max(12)).optional(),
        codParcs: z.array(z.number().int()).optional(),
        mercados: z.array(z.string()).optional(),
        gruposProduto: z.array(z.string()).optional(),
        vendedores: z.array(z.string()).optional(),
        codParcDetalhe: z.number().int(),
      }))
      .query(({ input }) => {
        const { codParcDetalhe, ...rest } = input
        return getHistoricoClienteProdutos({ ...rest, codParcs: [codParcDetalhe] })
      }),
  }),

  // ─── Uploads ───────────────────────────────────────────────────────────────
  uploads: router({
    lista: publicProcedure.query(() => getUploads()),

    reclassificar: adminProcedure
      .mutation(() => reclassificarTipoReceita()),

    processar: adminProcedure
      .input(z.object({ nomeArquivo: z.string(), conteudoBase64: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const uploadId = await createUpload(input.nomeArquivo, ctx.user.id)
        try {
          await updateUpload(uploadId, { status: 'processando' })
          const { processarExcel } = await import('./excel-processor')
          const result = await processarExcel(input.conteudoBase64, uploadId)
          await updateUpload(uploadId, {
            status: 'concluido',
            totalRegistros: result.total,
            registrosImportados: result.importados,
            registrosErro: result.erros,
          })
          return result
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          await updateUpload(uploadId, { status: 'erro', erroMensagem: msg })
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: msg })
        }
      }),
  }),
})

export type AppRouter = typeof appRouter

