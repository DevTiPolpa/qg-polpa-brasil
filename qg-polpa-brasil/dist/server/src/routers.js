"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const server_1 = require("@trpc/server");
const zod_1 = require("zod");
const trpc_1 = require("./trpc");
const auth_1 = require("./auth");
const db_1 = require("./db");
const filtrosSchema = zod_1.z.object({
    mercados: zod_1.z.array(zod_1.z.string()).optional(),
    vendedores: zod_1.z.array(zod_1.z.string()).optional(),
    projetos: zod_1.z.array(zod_1.z.string()).optional(),
    gruposProduto: zod_1.z.array(zod_1.z.string()).optional(),
    tiposReceita: zod_1.z.array(zod_1.z.string()).optional(),
    dataInicio: zod_1.z.string().optional(),
    dataFim: zod_1.z.string().optional(),
    codParc: zod_1.z.number().optional(),
    codProduto: zod_1.z.number().optional(),
    uf: zod_1.z.string().optional(),
});
const COOKIE_OPTS = { httpOnly: true, path: '/', maxAge: 365 * 24 * 60 * 60, sameSite: 'lax' };
exports.appRouter = (0, trpc_1.router)({
    // ─── Auth ──────────────────────────────────────────────────────────────────
    auth: (0, trpc_1.router)({
        me: trpc_1.publicProcedure.query(({ ctx }) => {
            if (!ctx.user)
                return null;
            const u = ctx.user;
            return { id: u.id, name: u.name, email: u.email, role: u.role, mustChangePassword: u.must_change_password };
        }),
        login: trpc_1.publicProcedure
            .input(zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(1) }))
            .mutation(async ({ input, ctx }) => {
            const user = await (0, auth_1.loginWithPassword)(input.email, input.password);
            if (!user)
                throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha inválidos' });
            const token = (0, auth_1.createSessionToken)(user.id, user.role);
            ctx.res.cookie(auth_1.COOKIE_NAME, token, COOKIE_OPTS);
            return { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.must_change_password };
        }),
        logout: trpc_1.publicProcedure.mutation(({ ctx }) => {
            ctx.res.clearCookie(auth_1.COOKIE_NAME, { path: '/' });
            return { success: true };
        }),
        changePassword: trpc_1.protectedProcedure
            .input(zod_1.z.object({ newPassword: zod_1.z.string().min(6, 'Mínimo 6 caracteres') }))
            .mutation(async ({ input, ctx }) => {
            const hash = await (0, auth_1.hashPassword)(input.newPassword);
            await (0, db_1.updatePassword)(ctx.user.id, hash);
            return { success: true };
        }),
    }),
    // ─── Usuários (ADMIN) ──────────────────────────────────────────────────────
    users: (0, trpc_1.router)({
        list: trpc_1.adminProcedure.query(() => (0, db_1.listUsers)()),
        create: trpc_1.adminProcedure
            .input(zod_1.z.object({
            name: zod_1.z.string().min(2),
            email: zod_1.z.string().email(),
            role: zod_1.z.enum(['ADMIN', 'VENDEDOR']),
        }))
            .mutation(async ({ input }) => {
            const tempPass = (0, auth_1.generateRandomPassword)();
            const hash = await (0, auth_1.hashPassword)(tempPass);
            const id = await (0, db_1.createUser)({ name: input.name, email: input.email, passwordHash: hash, role: input.role });
            return { id, tempPassword: tempPass };
        }),
        update: trpc_1.adminProcedure
            .input(zod_1.z.object({
            id: zod_1.z.number(),
            name: zod_1.z.string().min(2).optional(),
            role: zod_1.z.enum(['ADMIN', 'VENDEDOR']).optional(),
            ativo: zod_1.z.boolean().optional(),
        }))
            .mutation(({ input }) => {
            const { id, ...data } = input;
            return (0, db_1.updateUser)(id, data);
        }),
        resetPassword: trpc_1.adminProcedure
            .input(zod_1.z.object({ id: zod_1.z.number() }))
            .mutation(async ({ input }) => {
            const tempPass = (0, auth_1.generateRandomPassword)();
            const hash = await (0, auth_1.hashPassword)(tempPass);
            await (0, db_1.resetUserPassword)(input.id, hash);
            return { tempPassword: tempPass };
        }),
    }),
    // ─── Metas 2026 ───────────────────────────────────────────────────────────
    metas2026: (0, trpc_1.router)({
        list: trpc_1.adminProcedure.query(() => (0, db_1.listMetasAdmin)()),
        upsert: trpc_1.adminProcedure
            .input(zod_1.z.object({
            nomeVendedor: zod_1.z.string().min(1),
            mes: zod_1.z.string().regex(/^\d{4}-\d{2}$/),
            valorMeta: zod_1.z.number().min(0),
            projeto: zod_1.z.string().nullable().optional(),
        }))
            .mutation(({ input }) => (0, db_1.upsertMeta)({
            nomeVendedor: input.nomeVendedor,
            mes: input.mes,
            valorMeta: input.valorMeta,
            projeto: input.projeto ?? null,
        })),
        delete: trpc_1.adminProcedure
            .input(zod_1.z.object({ id: zod_1.z.number() }))
            .mutation(({ input }) => (0, db_1.deleteMeta)(input.id)),
    }),
    // ─── Filtros ───────────────────────────────────────────────────────────────
    filtros: (0, trpc_1.router)({
        disponiveis: trpc_1.publicProcedure.query(() => (0, db_1.getFiltrosDisponiveis)()),
    }),
    // ─── Dashboard ─────────────────────────────────────────────────────────────
    dashboard: (0, trpc_1.router)({
        kpis: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getKpisGlobais)(input)),
        evolucaoMensal: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getEvolucaoMensal)(input)),
        evolucaoMensalAnoAnterior: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getEvolucaoMensalAnoAnterior)(input)),
        kpisAnoAnterior: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getKpisAnoAnterior)(input)),
        orcamentoKpis: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getOrcamentoKpis)(input)),
        orcamentoMensal: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getOrcamentoMensal)(input)),
        kpisPorTipo: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getKpisPorTipoReceita)(input)),
        totalVendas: trpc_1.publicProcedure.query(() => (0, db_1.getTotalVendas)()),
        drillDown: trpc_1.publicProcedure
            .input(zod_1.z.object({ tipoReceita: zod_1.z.string(), filtros: filtrosSchema.optional() }))
            .query(({ input }) => (0, db_1.getDrillDownTipoReceita)(input.tipoReceita, input.filtros ?? {})),
        segmentos: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getDashboardSegmentos)(input)),
        vendedores: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getDashboardVendedores)(input)),
        projetos: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getProjetoRepresentatividade)(input)),
        clientesTop: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getDashboardTopClientes)(input)),
    }),
    // ─── Vendedores ────────────────────────────────────────────────────────────
    vendedores: (0, trpc_1.router)({
        lista: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getPerformanceVendedores)(input)),
        performance: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getPerformanceVendedores)(input)),
        evolucao: trpc_1.publicProcedure
            .input(zod_1.z.object({ nomeVendedor: zod_1.z.string(), filtros: filtrosSchema.optional() }))
            .query(({ input }) => (0, db_1.getEvolucaoVendedor)(input.nomeVendedor, input.filtros ?? {})),
        clientes: trpc_1.publicProcedure
            .input(zod_1.z.object({ nomeVendedor: zod_1.z.string(), filtros: filtrosSchema.optional() }))
            .query(({ input }) => (0, db_1.getClientesVendedor)(input.nomeVendedor, input.filtros)),
        evolucaoConsolidada: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getEvolucaoConsolidada)(input)),
        evolucaoPorTipo: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getVendedoresEvolucaoPorTipo)(input)),
        crmMapping: trpc_1.publicProcedure.query(() => (0, db_1.getFaturamentoCrmMapping)()),
        crmKpis: trpc_1.publicProcedure.query(() => (0, db_1.getCrmKpisPorVendedor)()),
        clientesConsolidados: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getClientesConsolidados)(input)),
        projetos: trpc_1.publicProcedure
            .input(zod_1.z.object({ filtros: filtrosSchema, nomeVendedor: zod_1.z.string().optional() }))
            .query(({ input }) => (0, db_1.getProjetoRepresentatividade)(input.filtros, input.nomeVendedor)),
        metas: trpc_1.publicProcedure.input(filtrosSchema.optional()).query(({ input }) => (0, db_1.getMetasVendedores)(input)),
    }),
    // ─── Clientes ──────────────────────────────────────────────────────────────
    clientes: (0, trpc_1.router)({
        lista: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getListaClientes)(input)),
        historico: trpc_1.publicProcedure
            .input(zod_1.z.object({ codParc: zod_1.z.number(), filtros: filtrosSchema.optional() }))
            .query(({ input }) => (0, db_1.getHistoricoCliente)(input.codParc, input.filtros)),
        mix: trpc_1.publicProcedure
            .input(zod_1.z.object({ codParc: zod_1.z.number(), filtros: filtrosSchema.optional() }))
            .query(({ input }) => (0, db_1.getMixCliente)(input.codParc, input.filtros)),
        saudeCarteira: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getSaudeCarteira)(input)),
        vendasPorEstado: trpc_1.publicProcedure
            .input(zod_1.z.object({ filtros: filtrosSchema.optional(), codParc: zod_1.z.number().optional() }))
            .query(({ input }) => (0, db_1.getVendasPorEstado)(input.filtros ?? {})),
        crescimento: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getClientesCrescimento)(input)),
    }),
    // ─── Produtos ──────────────────────────────────────────────────────────────
    produtos: (0, trpc_1.router)({
        performance: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getPerformanceProdutos)(input)),
        evolucao: trpc_1.publicProcedure
            .input(zod_1.z.object({ codProduto: zod_1.z.number(), filtros: filtrosSchema.optional() }))
            .query(({ input }) => (0, db_1.getEvolucaoProduto)(input.codProduto, input.filtros ?? {})),
        evolucaoConsolidada: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getEvolucaoProdutosConsolidada)(input)),
    }),
    // ─── Segmentos ─────────────────────────────────────────────────────────────
    segmentos: (0, trpc_1.router)({
        performance: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getPerformanceSegmentos)(input)),
        evolucao: trpc_1.publicProcedure
            .input(zod_1.z.object({ segmento: zod_1.z.string() }))
            .query(({ input }) => (0, db_1.getEvolucaoSegmento)(input.segmento)),
    }),
    // ─── Novos Projetos ────────────────────────────────────────────────────────
    novosProjetos: (0, trpc_1.router)({
        kpis: trpc_1.publicProcedure
            .input(filtrosSchema.extend({ modoCard: zod_1.z.enum(['abertos', 'totais']).optional() }))
            .query(({ input }) => (0, db_1.getNovoProjetosKpisV2)(input, input.modoCard)),
        porMes: trpc_1.publicProcedure
            .input(filtrosSchema.extend({ modoCard: zod_1.z.enum(['abertos', 'totais']).optional() }))
            .query(({ input }) => (0, db_1.getNovoProjetosPorMesV2)(input, input.modoCard)),
        lista: trpc_1.publicProcedure
            .input(filtrosSchema.extend({ modoCard: zod_1.z.enum(['abertos', 'totais']).optional() }))
            .query(({ input }) => (0, db_1.getListaNovosProjetos)(input, input.modoCard)),
        drilldown: trpc_1.publicProcedure
            .input(filtrosSchema.extend({ mes: zod_1.z.string() }))
            .query(({ input }) => (0, db_1.getNovoProjetosDrilldown)(input.mes, input)),
    }),
    // ─── Pipeline ──────────────────────────────────────────────────────────────
    pipeline: (0, trpc_1.router)({
        funil: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getPipelineComercial)(input)),
        detalhado: trpc_1.publicProcedure.input(filtrosSchema).query(({ input }) => (0, db_1.getPipelineDetalhado)(input)),
    }),
    // ─── Panorama CRM ──────────────────────────────────────────────────────────
    panoramaCrm: (0, trpc_1.router)({
        vendedores: trpc_1.publicProcedure.query(() => (0, db_1.getCrmVendedores)()),
        leadsSnapshot: trpc_1.publicProcedure.query(() => (0, db_1.getPanoramaLeadsSnapshot)()),
        dealsSnapshot: trpc_1.publicProcedure
            .input(zod_1.z.object({ pipelineId: zod_1.z.number().nullable(), origem: zod_1.z.enum(['leads', 'base', 'total']), userId: zod_1.z.number().optional() }))
            .query(({ input }) => (0, db_1.getPanoramaDealsSnapshot)(input.pipelineId, input.origem, input.userId)),
        leads: trpc_1.publicProcedure
            .input(zod_1.z.object({ dateIni: zod_1.z.string(), dateFim: zod_1.z.string(), visao: zod_1.z.enum(['calendario', 'coorte']) }))
            .query(({ input }) => (0, db_1.getPanoramaLeads)(input.dateIni, input.dateFim, input.visao)),
        deals: trpc_1.publicProcedure
            .input(zod_1.z.object({ dateIni: zod_1.z.string(), dateFim: zod_1.z.string(), visao: zod_1.z.enum(['calendario', 'coorte']), pipelineId: zod_1.z.number().nullable(), origem: zod_1.z.enum(['leads', 'base', 'total']), userId: zod_1.z.number().optional() }))
            .query(({ input }) => (0, db_1.getPanoramaDeals)(input.dateIni, input.dateFim, input.visao, input.pipelineId, input.origem, input.userId)),
    }),
    // ─── Funil de Vendas CRM ───────────────────────────────────────────────────
    funilCrm: (0, trpc_1.router)({
        vendedores: trpc_1.publicProcedure.query(() => (0, db_1.getCrmVendedores)()),
        kpis: trpc_1.publicProcedure.input(zod_1.z.object({ pipelineIds: zod_1.z.array(zod_1.z.number()).optional(), userId: zod_1.z.number().optional() }).optional()).query(({ input }) => (0, db_1.getFunilKpis)(input?.pipelineIds, input?.userId)),
        porEtapa: trpc_1.publicProcedure.input(zod_1.z.object({ pipelineIds: zod_1.z.array(zod_1.z.number()).optional(), userId: zod_1.z.number().optional() }).optional()).query(({ input }) => (0, db_1.getFunilPorEtapa)(input?.pipelineIds, input?.userId)),
        porPipeline: trpc_1.publicProcedure.input(zod_1.z.object({ pipelineIds: zod_1.z.array(zod_1.z.number()).optional(), userId: zod_1.z.number().optional() }).optional()).query(({ input }) => (0, db_1.getFunilPorPipeline)(input?.pipelineIds, input?.userId)),
        topVendedores: trpc_1.publicProcedure.input(zod_1.z.object({ pipelineIds: zod_1.z.array(zod_1.z.number()).optional(), userId: zod_1.z.number().optional() }).optional()).query(({ input }) => (0, db_1.getFunilTopVendedores)(input?.pipelineIds, input?.userId)),
        evolucaoMensal: trpc_1.publicProcedure.input(zod_1.z.object({ pipelineIds: zod_1.z.array(zod_1.z.number()).optional(), userId: zod_1.z.number().optional() }).optional()).query(({ input }) => (0, db_1.getFunilEvolucaoMensal)(input?.pipelineIds, input?.userId)),
    }),
    // ─── Insights de IA ────────────────────────────────────────────────────────
    // ─── Recorrentes Real x Orçado ─────────────────────────────────────────────
    recorrentes: (0, trpc_1.router)({
        filtros: trpc_1.publicProcedure.query(() => (0, db_1.getRecorrentesFiltros)()),
        kpis: trpc_1.publicProcedure
            .input(zod_1.z.object({ dataInicio: zod_1.z.string().optional(), dataFim: zod_1.z.string().optional(), mercados: zod_1.z.array(zod_1.z.string()).optional(), vendedores: zod_1.z.array(zod_1.z.string()).optional(), codParc: zod_1.z.number().optional() }).optional())
            .query(({ input }) => (0, db_1.getRecorrentesKpis)(input ?? {})),
        tabela: trpc_1.publicProcedure
            .input(zod_1.z.object({ dataInicio: zod_1.z.string().optional(), dataFim: zod_1.z.string().optional(), mercados: zod_1.z.array(zod_1.z.string()).optional(), vendedores: zod_1.z.array(zod_1.z.string()).optional(), codParc: zod_1.z.number().optional() }).optional())
            .query(({ input }) => (0, db_1.getRecorrentesTabela)(input ?? {})),
        produtos: trpc_1.publicProcedure
            .input(zod_1.z.object({ codParc: zod_1.z.number(), dataInicio: zod_1.z.string().optional(), dataFim: zod_1.z.string().optional(), mercados: zod_1.z.array(zod_1.z.string()).optional(), vendedores: zod_1.z.array(zod_1.z.string()).optional() }))
            .query(({ input }) => (0, db_1.getRecorrentesProdutos)(input.codParc, input)),
    }),
    insights: (0, trpc_1.router)({
        lista: trpc_1.publicProcedure
            .input(zod_1.z.object({ tipo: zod_1.z.string().optional(), prioridade: zod_1.z.string().optional(), status: zod_1.z.string().optional() }).optional())
            .query(({ input }) => (0, db_1.getInsights)(input ?? {})),
        atualizarStatus: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.number(), status: zod_1.z.enum(['ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'DESCARTADO']) }))
            .mutation(({ input }) => (0, db_1.updateInsightStatus)(input.id, input.status)),
        gerar: trpc_1.protectedProcedure.mutation(async () => {
            const [clientes, produtos, segmentos, pipeline] = await Promise.all([
                (0, db_1.getListaClientes)({}),
                (0, db_1.getPerformanceProdutos)({}),
                (0, db_1.getPerformanceSegmentos)({}),
                (0, db_1.getPipelineComercial)({}),
            ]);
            if (clientes.length === 0)
                return { gerados: 0, mensagem: 'Nenhum dado disponível.' };
            const hoje = new Date();
            const clientesComStatus = clientes.map(c => {
                const ultima = c.ultimaCompra ? new Date(c.ultimaCompra) : null;
                const dias = ultima ? Math.floor((hoje.getTime() - ultima.getTime()) / 86400000) : 999;
                const status = dias <= 180 ? 'ATIVO' : dias <= 365 ? 'EM_RISCO' : 'INATIVO';
                return { ...c, diasSemCompra: dias, status };
            });
            const totalFat = clientes.reduce((s, c) => s + Number(c.faturamento), 0);
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
            };
            // Gera insights locais sem LLM (pode ser substituído por API de IA)
            const novosInsights = [];
            for (const c of clientesComStatus.filter(x => x.status === 'INATIVO').slice(0, 3)) {
                novosInsights.push({ tipoInsight: 'CLIENTE_INATIVO', nomeCliente: c.razaoSocial, descricao: `${c.razaoSocial} está inativo há ${c.diasSemCompra} dias. Último faturamento: R$ ${Number(c.faturamento).toLocaleString('pt-BR')}.`, prioridade: 'ALTA', impactoEstimadoR: Number(c.faturamento) * 0.8, impactoEstimadoKg: Number(c.volume) * 0.8 });
            }
            for (const c of clientesComStatus.filter(x => x.status === 'EM_RISCO').slice(0, 3)) {
                novosInsights.push({ tipoInsight: 'RISCO_QUEDA', nomeCliente: c.razaoSocial, descricao: `${c.razaoSocial} não compra há ${c.diasSemCompra} dias. Risco de inativação.`, prioridade: 'MEDIA', impactoEstimadoR: Number(c.faturamento) * 0.5, impactoEstimadoKg: Number(c.volume) * 0.5 });
            }
            for (const p of produtos.slice(0, 2)) {
                novosInsights.push({ tipoInsight: 'PRODUTO_CRESCIMENTO', nomeProduto: p.nomeProduto, descricao: `${p.nomeProduto} é top produto com ${Number(p.clientes)} clientes ativos.`, prioridade: 'BAIXA', impactoEstimadoR: Number(p.faturamento) * 0.1, impactoEstimadoKg: Number(p.volume) * 0.1 });
            }
            await (0, db_1.deleteAllInsights)();
            for (const ins of novosInsights)
                await (0, db_1.insertInsight)(ins);
            return { gerados: novosInsights.length, mensagem: `${novosInsights.length} insights gerados.` };
        }),
    }),
    // ─── Tarefas ───────────────────────────────────────────────────────────────
    tasks: (0, trpc_1.router)({
        list: trpc_1.publicProcedure
            .input(zod_1.z.object({ status: zod_1.z.string().optional(), prioridade: zod_1.z.string().optional() }).optional())
            .query(({ input }) => (0, db_1.listTasks)(input ?? {})),
        create: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            titulo: zod_1.z.string().min(1),
            descricao: zod_1.z.string().optional(),
            status: zod_1.z.enum(['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional(),
            prioridade: zod_1.z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
            responsavel: zod_1.z.string().optional(),
            prazo: zod_1.z.string().optional(),
        }))
            .mutation(({ input, ctx }) => (0, db_1.createTask)({
            ...input,
            criadoPor: ctx.user.name ?? ctx.user.email,
            criadoPorId: ctx.user.id,
        })),
        update: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            id: zod_1.z.number(),
            titulo: zod_1.z.string().optional(),
            descricao: zod_1.z.string().optional(),
            status: zod_1.z.enum(['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional(),
            prioridade: zod_1.z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
            responsavel: zod_1.z.string().optional(),
            prazo: zod_1.z.string().optional().nullable(),
        }))
            .mutation(({ input }) => {
            const { id, ...rest } = input;
            return (0, db_1.updateTask)(id, rest);
        }),
        delete: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.number() }))
            .mutation(({ input }) => (0, db_1.deleteTask)(input.id)),
    }),
    // ─── Chatbot ───────────────────────────────────────────────────────────────
    chatbot: (0, trpc_1.router)({
        sessions: trpc_1.protectedProcedure
            .query(({ ctx }) => (0, db_1.getChatSessions)(ctx.user.id)),
        history: trpc_1.protectedProcedure
            .input(zod_1.z.object({ sessionId: zod_1.z.string() }))
            .query(({ input }) => (0, db_1.getChatHistory)(input.sessionId)),
        deleteSession: trpc_1.protectedProcedure
            .input(zod_1.z.object({ sessionId: zod_1.z.string() }))
            .mutation(({ input }) => (0, db_1.clearChatHistory)(input.sessionId)),
        send: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            sessionId: zod_1.z.string(),
            message: zod_1.z.string().min(1),
            history: zod_1.z.array(zod_1.z.any()).default([]),
        }))
            .mutation(async ({ input, ctx }) => {
            await (0, db_1.saveChatMessage)(input.sessionId, ctx.user.id, 'user', input.message);
            const pythonUrl = process.env.PYTHON_API_URL ?? 'http://localhost:8000';
            const secret = process.env.INTERNAL_CHAT_SECRET ?? '';
            const res = await fetch(`${pythonUrl}/api/chat-qg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': secret },
                body: JSON.stringify({ message: input.message, history: input.history }),
            });
            if (!res.ok)
                throw new server_1.TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Agente IA indisponível' });
            const data = await res.json();
            await (0, db_1.saveChatMessage)(input.sessionId, null, 'assistant', data.answer);
            return { reply: data.answer, agentHistory: data.history };
        }),
        clear: trpc_1.protectedProcedure
            .input(zod_1.z.object({ sessionId: zod_1.z.string() }))
            .mutation(({ input }) => (0, db_1.clearChatHistory)(input.sessionId)),
    }),
    // ─── Snapshot Semanal ─────────────────────────────────────────────────────
    snapshots: (0, trpc_1.router)({
        info: trpc_1.publicProcedure.query(() => (0, db_1.getSnapshotDates)()),
        comparativo: trpc_1.publicProcedure
            .input(filtrosSchema)
            .query(({ input }) => (0, db_1.getSnapshotComparativo)(input)),
        produtos: trpc_1.publicProcedure
            .input(zod_1.z.object({ codParc: zod_1.z.number(), filtros: filtrosSchema.optional() }))
            .query(({ input }) => (0, db_1.getSnapshotComparativoProdutos)(input.codParc, input.filtros ?? {})),
        trigger: trpc_1.adminProcedure
            .mutation(() => (0, db_1.createForecastSnapshot)()),
        historico: trpc_1.publicProcedure
            .input(filtrosSchema)
            .query(({ input }) => (0, db_1.getSnapshotHistorico)(input)),
        historicoProdutos: trpc_1.publicProcedure
            .input(zod_1.z.object({ codParc: zod_1.z.number(), filtros: filtrosSchema.optional() }))
            .query(({ input }) => (0, db_1.getSnapshotHistoricoProdutos)(input.codParc, input.filtros ?? {})),
    }),
    // ─── Histórico Clientes ────────────────────────────────────────────────────
    historicoClientes: (0, trpc_1.router)({
        filtros: trpc_1.publicProcedure.query(() => (0, db_1.getHistoricoFiltros)()),
        kpis: trpc_1.publicProcedure
            .input(zod_1.z.object({
            anos: zod_1.z.array(zod_1.z.number().int()).min(1),
            meses: zod_1.z.array(zod_1.z.number().int().min(1).max(12)).optional(),
            codParcs: zod_1.z.array(zod_1.z.number().int()).optional(),
            mercados: zod_1.z.array(zod_1.z.string()).optional(),
            gruposProduto: zod_1.z.array(zod_1.z.string()).optional(),
            vendedores: zod_1.z.array(zod_1.z.string()).optional(),
            ufs: zod_1.z.array(zod_1.z.string()).optional(),
            codProdutos: zod_1.z.array(zod_1.z.string()).optional(),
        }))
            .query(({ input }) => (0, db_1.getHistoricoKpis)(input)),
        listaClientes: trpc_1.publicProcedure
            .input(zod_1.z.object({
            anos: zod_1.z.array(zod_1.z.number().int()).min(1),
            meses: zod_1.z.array(zod_1.z.number().int().min(1).max(12)).optional(),
            codParcs: zod_1.z.array(zod_1.z.number().int()).optional(),
            mercados: zod_1.z.array(zod_1.z.string()).optional(),
            gruposProduto: zod_1.z.array(zod_1.z.string()).optional(),
            vendedores: zod_1.z.array(zod_1.z.string()).optional(),
            ufs: zod_1.z.array(zod_1.z.string()).optional(),
            codProdutos: zod_1.z.array(zod_1.z.string()).optional(),
        }))
            .query(({ input }) => (0, db_1.getHistoricoListaClientes)(input)),
        evolucaoMensal: trpc_1.publicProcedure
            .input(zod_1.z.object({
            anos: zod_1.z.array(zod_1.z.number().int()).min(1),
            meses: zod_1.z.array(zod_1.z.number().int().min(1).max(12)).optional(),
            codParcs: zod_1.z.array(zod_1.z.number().int()).optional(),
            mercados: zod_1.z.array(zod_1.z.string()).optional(),
            gruposProduto: zod_1.z.array(zod_1.z.string()).optional(),
            vendedores: zod_1.z.array(zod_1.z.string()).optional(),
            codProdutos: zod_1.z.array(zod_1.z.string()).optional(),
        }))
            .query(({ input }) => (0, db_1.getHistoricoEvolucaoMensal)(input)),
        topProdutos: trpc_1.publicProcedure
            .input(zod_1.z.object({
            anos: zod_1.z.array(zod_1.z.number().int()).min(1),
            meses: zod_1.z.array(zod_1.z.number().int().min(1).max(12)).optional(),
            codParcs: zod_1.z.array(zod_1.z.number().int()).optional(),
            mercados: zod_1.z.array(zod_1.z.string()).optional(),
            gruposProduto: zod_1.z.array(zod_1.z.string()).optional(),
            vendedores: zod_1.z.array(zod_1.z.string()).optional(),
            codProdutos: zod_1.z.array(zod_1.z.string()).optional(),
        }))
            .query(({ input }) => (0, db_1.getHistoricoTopProdutos)(input)),
        porEstado: trpc_1.publicProcedure
            .input(zod_1.z.object({
            anos: zod_1.z.array(zod_1.z.number().int()).min(1),
            meses: zod_1.z.array(zod_1.z.number().int().min(1).max(12)).optional(),
            codParcs: zod_1.z.array(zod_1.z.number().int()).optional(),
            mercados: zod_1.z.array(zod_1.z.string()).optional(),
            gruposProduto: zod_1.z.array(zod_1.z.string()).optional(),
            vendedores: zod_1.z.array(zod_1.z.string()).optional(),
            ufs: zod_1.z.array(zod_1.z.string()).optional(),
            codProdutos: zod_1.z.array(zod_1.z.string()).optional(),
        }))
            .query(({ input }) => (0, db_1.getHistoricoPorEstado)(input)),
        porSegmento: trpc_1.publicProcedure
            .input(zod_1.z.object({
            anos: zod_1.z.array(zod_1.z.number().int()).min(1),
            meses: zod_1.z.array(zod_1.z.number().int().min(1).max(12)).optional(),
            codParcs: zod_1.z.array(zod_1.z.number().int()).optional(),
            mercados: zod_1.z.array(zod_1.z.string()).optional(),
            gruposProduto: zod_1.z.array(zod_1.z.string()).optional(),
            vendedores: zod_1.z.array(zod_1.z.string()).optional(),
            ufs: zod_1.z.array(zod_1.z.string()).optional(),
            codProdutos: zod_1.z.array(zod_1.z.string()).optional(),
        }))
            .query(({ input }) => (0, db_1.getHistoricoPorSegmento)(input)),
        clienteProdutos: trpc_1.publicProcedure
            .input(zod_1.z.object({
            anos: zod_1.z.array(zod_1.z.number().int()).min(1),
            meses: zod_1.z.array(zod_1.z.number().int().min(1).max(12)).optional(),
            codParcs: zod_1.z.array(zod_1.z.number().int()).optional(),
            mercados: zod_1.z.array(zod_1.z.string()).optional(),
            gruposProduto: zod_1.z.array(zod_1.z.string()).optional(),
            vendedores: zod_1.z.array(zod_1.z.string()).optional(),
            codParcDetalhe: zod_1.z.number().int(),
        }))
            .query(({ input }) => {
            const { codParcDetalhe, ...rest } = input;
            return (0, db_1.getHistoricoClienteProdutos)({ ...rest, codParcs: [codParcDetalhe] });
        }),
    }),
    // ─── Uploads ───────────────────────────────────────────────────────────────
    uploads: (0, trpc_1.router)({
        lista: trpc_1.publicProcedure.query(() => (0, db_1.getUploads)()),
        reclassificar: trpc_1.adminProcedure
            .mutation(() => (0, db_1.reclassificarTipoReceita)()),
        processar: trpc_1.adminProcedure
            .input(zod_1.z.object({ nomeArquivo: zod_1.z.string(), conteudoBase64: zod_1.z.string() }))
            .mutation(async ({ input, ctx }) => {
            const uploadId = await (0, db_1.createUpload)(input.nomeArquivo, ctx.user.id);
            try {
                await (0, db_1.updateUpload)(uploadId, { status: 'processando' });
                const { processarExcel } = await Promise.resolve().then(() => __importStar(require('./excel-processor')));
                const result = await processarExcel(input.conteudoBase64, uploadId);
                await (0, db_1.updateUpload)(uploadId, {
                    status: 'concluido',
                    totalRegistros: result.total,
                    registrosImportados: result.importados,
                    registrosErro: result.erros,
                });
                return result;
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                await (0, db_1.updateUpload)(uploadId, { status: 'erro', erroMensagem: msg });
                throw new server_1.TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: msg });
            }
        }),
    }),
});
