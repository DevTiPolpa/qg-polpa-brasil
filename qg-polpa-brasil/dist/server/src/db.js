"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SELLER_ALIASES = void 0;
exports.getPool = getPool;
exports.getUserByEmail = getUserByEmail;
exports.getUserById = getUserById;
exports.updateLastSignedIn = updateLastSignedIn;
exports.updatePassword = updatePassword;
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.resetUserPassword = resetUserPassword;
exports.getKpisGlobais = getKpisGlobais;
exports.getKpisAnoAnterior = getKpisAnoAnterior;
exports.getOrcamentoKpis = getOrcamentoKpis;
exports.getOrcamentoMensal = getOrcamentoMensal;
exports.getRecorrentesKpis = getRecorrentesKpis;
exports.getRecorrentesTabela = getRecorrentesTabela;
exports.getRecorrentesProdutos = getRecorrentesProdutos;
exports.getRecorrentesFiltros = getRecorrentesFiltros;
exports.getEvolucaoMensal = getEvolucaoMensal;
exports.getEvolucaoMensalAnoAnterior = getEvolucaoMensalAnoAnterior;
exports.getKpisPorTipoReceita = getKpisPorTipoReceita;
exports.getPerformanceVendedores = getPerformanceVendedores;
exports.getEvolucaoVendedor = getEvolucaoVendedor;
exports.getClientesVendedor = getClientesVendedor;
exports.getEvolucaoConsolidada = getEvolucaoConsolidada;
exports.getVendedoresEvolucaoPorTipo = getVendedoresEvolucaoPorTipo;
exports.getClientesConsolidados = getClientesConsolidados;
exports.getListaClientes = getListaClientes;
exports.getHistoricoCliente = getHistoricoCliente;
exports.getMixCliente = getMixCliente;
exports.getSaudeCarteira = getSaudeCarteira;
exports.getVendasPorEstado = getVendasPorEstado;
exports.getClientesCrescimento = getClientesCrescimento;
exports.getPerformanceProdutos = getPerformanceProdutos;
exports.getEvolucaoProduto = getEvolucaoProduto;
exports.getEvolucaoProdutosConsolidada = getEvolucaoProdutosConsolidada;
exports.getPerformanceSegmentos = getPerformanceSegmentos;
exports.getEvolucaoSegmento = getEvolucaoSegmento;
exports.getPipelineComercial = getPipelineComercial;
exports.getPipelineDetalhado = getPipelineDetalhado;
exports.normalizeSellerName = normalizeSellerName;
exports.getFaturamentoCrmMapping = getFaturamentoCrmMapping;
exports.getCrmKpisPorVendedor = getCrmKpisPorVendedor;
exports.getCrmVendedores = getCrmVendedores;
exports.getFunilKpis = getFunilKpis;
exports.getFunilPorEtapa = getFunilPorEtapa;
exports.getFunilPorPipeline = getFunilPorPipeline;
exports.getFunilTopVendedores = getFunilTopVendedores;
exports.getFunilEvolucaoMensal = getFunilEvolucaoMensal;
exports.getPanoramaLeadsSnapshot = getPanoramaLeadsSnapshot;
exports.getPanoramaDealsSnapshot = getPanoramaDealsSnapshot;
exports.getPanoramaLeads = getPanoramaLeads;
exports.getPanoramaDeals = getPanoramaDeals;
exports.getClientesRepresentatividade = getClientesRepresentatividade;
exports.getProjetoRepresentatividade = getProjetoRepresentatividade;
exports.getDrillDownTipoReceita = getDrillDownTipoReceita;
exports.getFiltrosDisponiveis = getFiltrosDisponiveis;
exports.getTotalVendas = getTotalVendas;
exports.reclassificarTipoReceita = reclassificarTipoReceita;
exports.getInsights = getInsights;
exports.insertInsight = insertInsight;
exports.updateInsightStatus = updateInsightStatus;
exports.deleteAllInsights = deleteAllInsights;
exports.getUploads = getUploads;
exports.createUpload = createUpload;
exports.updateUpload = updateUpload;
exports.importarVendas = importarVendas;
exports.listTasks = listTasks;
exports.createTask = createTask;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.getChatHistory = getChatHistory;
exports.saveChatMessage = saveChatMessage;
exports.clearChatHistory = clearChatHistory;
exports.getChatSessions = getChatSessions;
exports.getDashboardVendedores = getDashboardVendedores;
exports.getDashboardSegmentos = getDashboardSegmentos;
exports.getDashboardTopClientes = getDashboardTopClientes;
exports.getNovoProjetosKpisV2 = getNovoProjetosKpisV2;
exports.getNovoProjetosPorMesV2 = getNovoProjetosPorMesV2;
exports.getListaNovosProjetos = getListaNovosProjetos;
exports.getNovoProjetosDrilldown = getNovoProjetosDrilldown;
exports.listMetasAdmin = listMetasAdmin;
exports.upsertMeta = upsertMeta;
exports.deleteMeta = deleteMeta;
exports.getMetasVendedores = getMetasVendedores;
exports.createForecastSnapshot = createForecastSnapshot;
exports.getSnapshotDates = getSnapshotDates;
exports.getSnapshotComparativo = getSnapshotComparativo;
exports.getSnapshotComparativoProdutos = getSnapshotComparativoProdutos;
exports.getSnapshotHistorico = getSnapshotHistorico;
exports.getSnapshotHistoricoProdutos = getSnapshotHistoricoProdutos;
exports.getHistoricoFiltros = getHistoricoFiltros;
exports.getHistoricoKpis = getHistoricoKpis;
exports.getHistoricoListaClientes = getHistoricoListaClientes;
exports.getHistoricoEvolucaoMensal = getHistoricoEvolucaoMensal;
exports.getHistoricoTopProdutos = getHistoricoTopProdutos;
exports.getHistoricoPorEstado = getHistoricoPorEstado;
exports.getHistoricoPorSegmento = getHistoricoPorSegmento;
exports.getHistoricoClienteProdutos = getHistoricoClienteProdutos;
const mssql_1 = __importDefault(require("mssql"));
const useWindowsAuth = !process.env.DB_USER;
const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'FaturamentoComercial',
    ...(useWindowsAuth ? {} : { user: process.env.DB_USER, password: process.env.DB_PASSWORD }),
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true,
        trustedConnection: useWindowsAuth,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};
let pool = null;
async function getPool() {
    if (!pool) {
        try {
            pool = await new mssql_1.default.ConnectionPool(config).connect();
        }
        catch (err) {
            console.warn('[Database] Failed to connect:', err);
            pool = null;
        }
    }
    return pool;
}
async function query(text, inputs) {
    const p = await getPool();
    if (!p)
        return [];
    const req = p.request();
    for (const inp of inputs ?? [])
        req.input(inp.name, inp.type, inp.value);
    const result = await req.query(text);
    return result.recordset;
}
function buildWhere(f, alias = 'fv') {
    const parts = [];
    const inputs = [];
    const addIn = (col, vals, prefix) => {
        if (!vals.length)
            return;
        const params = vals.map((v, i) => {
            const pname = `${prefix}${i}`;
            inputs.push({ name: pname, type: mssql_1.default.NVarChar(100), value: v });
            return `@${pname}`;
        });
        parts.push(`${alias}.${col} IN (${params.join(',')})`);
    };
    addIn('mercado_vendas', f.mercados ?? [], 'merc');
    addIn('nome_vendedor', f.vendedores ?? [], 'vend');
    addIn('projeto', f.projetos ?? [], 'proj');
    addIn('grupo_produto', f.gruposProduto ?? [], 'grup');
    // Quando VENDA_FIRME é filtrado, inclui DEVOLUCAO para que o resultado líquido
    // coincida com o card (que já soma DEVOLUCAO dentro de VENDA_FIRME)
    const tiposFilter = (f.tiposReceita ?? []).includes('VENDA_FIRME')
        ? [...new Set([...(f.tiposReceita ?? []), 'DEVOLUCAO'])]
        : (f.tiposReceita ?? []);
    addIn('tipo_receita', tiposFilter, 'trec');
    if (f.dataInicio) {
        inputs.push({ name: 'dtIni', type: mssql_1.default.Date, value: f.dataInicio });
        parts.push(`${alias}.dt_entrega_cliente >= @dtIni`);
    }
    if (f.dataFim) {
        inputs.push({ name: 'dtFim', type: mssql_1.default.Date, value: f.dataFim });
        parts.push(`${alias}.dt_entrega_cliente <= @dtFim`);
    }
    if (f.codParc) {
        inputs.push({ name: 'codParc', type: mssql_1.default.Int, value: f.codParc });
        parts.push(`${alias}.cod_parc = @codParc`);
    }
    if (f.codProduto) {
        inputs.push({ name: 'codProduto', type: mssql_1.default.BigInt, value: f.codProduto });
        parts.push(`${alias}.cod_produto = @codProduto`);
    }
    if (f.uf) {
        inputs.push({ name: 'uf', type: mssql_1.default.NVarChar(2), value: f.uf });
        parts.push(`${alias}.uf = @uf`);
    }
    // Exclui TOP 1023 (PEDIDO DE VENDA - MÃE ESTOQUE MÍNIMO) de todas as queries
    // Nota: coluna "top" precisa de colchetes pois é palavra reservada no SQL Server
    parts.push(`(${alias}.cod_top IS NULL OR ${alias}.cod_top != 1023)`);
    parts.push(`(${alias}.[top] IS NULL OR ${alias}.[top] NOT LIKE '%ESTOQUE MINIM%')`);
    return {
        clause: parts.length ? 'WHERE ' + parts.join(' AND ') : '',
        inputs,
    };
}
function shiftYear(iso, delta = -1) {
    if (!iso)
        return undefined;
    const d = new Date(iso + 'T00:00:00Z');
    d.setUTCFullYear(d.getUTCFullYear() + delta);
    return d.toISOString().split('T')[0];
}
// ─── Auth / Users ─────────────────────────────────────────────────────────────
async function getUserByEmail(email) {
    const rows = await query(`SELECT id, name, email, password_hash, role, ativo, must_change_password, last_signed_in FROM users WHERE email = @email`, [{ name: 'email', type: mssql_1.default.NVarChar(320), value: email }]);
    return rows[0] ?? null;
}
async function getUserById(id) {
    const rows = await query(`SELECT id, name, email, password_hash, role, ativo, must_change_password FROM users WHERE id = @id`, [{ name: 'id', type: mssql_1.default.Int, value: id }]);
    return rows[0] ?? null;
}
async function updateLastSignedIn(id) {
    const p = await getPool();
    if (!p)
        return;
    await p.request().input('id', mssql_1.default.Int, id).query(`UPDATE users SET last_signed_in = GETDATE() WHERE id = @id`);
}
async function updatePassword(id, hash) {
    const p = await getPool();
    if (!p)
        return;
    await p.request()
        .input('id', mssql_1.default.Int, id)
        .input('hash', mssql_1.default.NVarChar(255), hash)
        .query(`UPDATE users SET password_hash = @hash, must_change_password = 0, updated_at = GETDATE() WHERE id = @id`);
}
async function listUsers() {
    return query(`SELECT id, name, email, role, ativo, must_change_password, created_at, last_signed_in FROM users ORDER BY name`);
}
async function createUser(data) {
    const p = await getPool();
    if (!p)
        throw new Error('DB unavailable');
    const res = await p.request()
        .input('name', mssql_1.default.NVarChar(255), data.name)
        .input('email', mssql_1.default.NVarChar(320), data.email)
        .input('hash', mssql_1.default.NVarChar(255), data.passwordHash)
        .input('role', mssql_1.default.NVarChar(20), data.role)
        .query(`INSERT INTO users (name, email, password_hash, role, ativo, must_change_password)
            OUTPUT INSERTED.id
            VALUES (@name, @email, @hash, @role, 1, 1)`);
    return res.recordset[0].id;
}
async function updateUser(id, data) {
    const p = await getPool();
    if (!p)
        return;
    const sets = ['updated_at = GETDATE()'];
    const req = p.request().input('id', mssql_1.default.Int, id);
    if (data.name !== undefined) {
        req.input('name', mssql_1.default.NVarChar(255), data.name);
        sets.push('name = @name');
    }
    if (data.role !== undefined) {
        req.input('role', mssql_1.default.NVarChar(20), data.role);
        sets.push('role = @role');
    }
    if (data.ativo !== undefined) {
        req.input('ativo', mssql_1.default.Bit, data.ativo ? 1 : 0);
        sets.push('ativo = @ativo');
    }
    await req.query(`UPDATE users SET ${sets.join(', ')} WHERE id = @id`);
}
async function resetUserPassword(id, hash) {
    const p = await getPool();
    if (!p)
        return;
    await p.request()
        .input('id', mssql_1.default.Int, id)
        .input('hash', mssql_1.default.NVarChar(255), hash)
        .query(`UPDATE users SET password_hash = @hash, must_change_password = 1, updated_at = GETDATE() WHERE id = @id`);
}
// ─── Dashboard KPIs ───────────────────────────────────────────────────────────
async function getKpisGlobais(f) {
    const { clause, inputs } = buildWhere(f);
    const rows = await query(`
    SELECT
      COALESCE(SUM(valor_pendente), 0)    AS faturamentoBruto,
      COALESCE(SUM(qtd_pendente_kg), 0)   AS volumeBruto,
      0                                   AS faturamentoDevolucao,
      0                                   AS volumeDevolucao,
      COUNT(DISTINCT cod_parc)            AS clientesUnicos,
      COUNT(DISTINCT cod_produto)         AS produtosUnicos,
      COUNT(*)                            AS totalRegistros
    FROM fato_vendas fv ${clause}
  `, inputs);
    const r = rows[0];
    if (!r)
        return null;
    const faturamentoBruto = Number(r.faturamentoBruto);
    const faturamentoDevolucao = Number(r.faturamentoDevolucao);
    const volumeBruto = Number(r.volumeBruto);
    const volumeDevolucao = Number(r.volumeDevolucao);
    const faturamentoLiquido = faturamentoBruto - faturamentoDevolucao;
    const volumeLiquido = volumeBruto - volumeDevolucao;
    return {
        faturamentoTotal: faturamentoLiquido,
        volumeTotal: volumeLiquido,
        precoMedio: volumeLiquido > 0 ? faturamentoLiquido / volumeLiquido : 0,
        faturamentoDevolucao,
        volumeDevolucao,
        clientesAtivos: Number(r.clientesUnicos),
        produtosVendidos: Number(r.produtosUnicos),
        totalRegistros: Number(r.totalRegistros),
    };
}
async function getKpisAnoAnterior(f) {
    return getKpisGlobais({ ...f, dataInicio: shiftYear(f.dataInicio), dataFim: shiftYear(f.dataFim) });
}
function buildOrcamentoWhere(f) {
    const parts = [];
    const inputs = [];
    if (f?.dataInicio) {
        inputs.push({ name: 'dtIni', type: mssql_1.default.Date, value: f.dataInicio });
        parts.push('dt_prev_entrega_embarque >= @dtIni');
    }
    if (f?.dataFim) {
        inputs.push({ name: 'dtFim', type: mssql_1.default.Date, value: f.dataFim });
        parts.push('dt_prev_entrega_embarque <= @dtFim');
    }
    if (f?.projetos?.length) {
        parts.push(`projeto IN (${f.projetos.map((_, i) => `@oproj${i}`).join(',')})`);
        f.projetos.forEach((p, i) => inputs.push({ name: `oproj${i}`, type: mssql_1.default.NVarChar(100), value: p }));
    }
    if (f?.mercados?.length) {
        parts.push(`mercado_vendas IN (${f.mercados.map((_, i) => `@omerc${i}`).join(',')})`);
        f.mercados.forEach((m, i) => inputs.push({ name: `omerc${i}`, type: mssql_1.default.NVarChar(100), value: m }));
    }
    if (f?.gruposProduto?.length) {
        parts.push(`grupo_produto IN (${f.gruposProduto.map((_, i) => `@ogrp${i}`).join(',')})`);
        f.gruposProduto.forEach((g, i) => inputs.push({ name: `ogrp${i}`, type: mssql_1.default.NVarChar(100), value: g }));
    }
    return { clause: parts.length ? 'WHERE ' + parts.join(' AND ') : '', inputs };
}
async function getOrcamentoKpis(f) {
    const { clause, inputs } = buildOrcamentoWhere(f);
    const rows = await query(`SELECT COALESCE(SUM(valor_pendente),0) AS faturamentoTotal, COALESCE(SUM(qtd_pendente_kg),0) AS volumeTotal,
     COUNT(*) AS totalRegistros, COUNT(DISTINCT cod_parc) AS clientesUnicos, COUNT(DISTINCT cod_produto) AS produtosUnicos
     FROM orcamento_2026 ${clause}`, inputs);
    return rows[0] ? { faturamentoTotal: Number(rows[0].faturamentoTotal), volumeTotal: Number(rows[0].volumeTotal), totalRegistros: Number(rows[0].totalRegistros), clientesUnicos: Number(rows[0].clientesUnicos), produtosUnicos: Number(rows[0].produtosUnicos) } : null;
}
async function getOrcamentoMensal(f) {
    const { clause, inputs } = buildOrcamentoWhere(f);
    const rows = await query(`SELECT FORMAT(dt_prev_entrega_embarque,'yyyy-MM') AS mes,
     COALESCE(SUM(valor_pendente),0) AS faturamento, COALESCE(SUM(qtd_pendente_kg),0) AS volume
     FROM orcamento_2026 ${clause}
     GROUP BY FORMAT(dt_prev_entrega_embarque,'yyyy-MM')
     ORDER BY FORMAT(dt_prev_entrega_embarque,'yyyy-MM')`, inputs);
    return rows.map(r => ({ mes: r.mes, faturamento: Number(r.faturamento), volume: Number(r.volume) }));
}
function buildRecRealWhere(f) {
    const inputs = [];
    const conds = [
        "fv.projeto = 'RECORRENTES'",
        '(fv.cod_top IS NULL OR fv.cod_top != 1023)',
        "(fv.[top] IS NULL OR fv.[top] NOT LIKE '%ESTOQUE MINIM%')",
    ];
    if (f.dataInicio) {
        inputs.push({ name: 'rdtIni', type: mssql_1.default.Date, value: f.dataInicio });
        conds.push('fv.dt_entrega_cliente >= @rdtIni');
    }
    if (f.dataFim) {
        inputs.push({ name: 'rdtFim', type: mssql_1.default.Date, value: f.dataFim });
        conds.push('fv.dt_entrega_cliente <= @rdtFim');
    }
    if (f.mercados?.length) {
        f.mercados.forEach((m, i) => { inputs.push({ name: `rmerc${i}`, type: mssql_1.default.NVarChar(100), value: m }); });
        conds.push(`fv.mercado_vendas IN (${f.mercados.map((_, i) => `@rmerc${i}`).join(',')})`);
    }
    if (f.vendedores?.length) {
        f.vendedores.forEach((v, i) => { inputs.push({ name: `rvend${i}`, type: mssql_1.default.NVarChar(100), value: v }); });
        conds.push(`fv.nome_vendedor IN (${f.vendedores.map((_, i) => `@rvend${i}`).join(',')})`);
    }
    if (f.codParc != null) {
        inputs.push({ name: 'rcodParc', type: mssql_1.default.Int, value: f.codParc });
        conds.push('fv.cod_parc = @rcodParc');
    }
    return { conds, inputs };
}
function buildRecOrcWhere(f) {
    const inputs = [];
    const conds = ["o.projeto = 'RECORRENTES'"];
    if (f.dataInicio) {
        inputs.push({ name: 'odtIni', type: mssql_1.default.Date, value: f.dataInicio });
        conds.push('o.dt_prev_entrega_embarque >= @odtIni');
    }
    if (f.dataFim) {
        inputs.push({ name: 'odtFim', type: mssql_1.default.Date, value: f.dataFim });
        conds.push('o.dt_prev_entrega_embarque <= @odtFim');
    }
    if (f.mercados?.length) {
        f.mercados.forEach((m, i) => { inputs.push({ name: `omerc${i}`, type: mssql_1.default.NVarChar(100), value: m }); });
        conds.push(`o.mercado_vendas IN (${f.mercados.map((_, i) => `@omerc${i}`).join(',')})`);
    }
    if (f.codParc != null) {
        inputs.push({ name: 'ocodParc', type: mssql_1.default.Int, value: f.codParc });
        conds.push('o.cod_parc = @ocodParc');
    }
    return { conds, inputs };
}
async function getRecorrentesKpis(f) {
    const real = buildRecRealWhere(f);
    const orc = buildRecOrcWhere(f);
    const [realRows, orcRows] = await Promise.all([
        query(`
      SELECT COALESCE(SUM(fv.valor_pendente),0) AS fatAtual, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volAtual
      FROM fato_vendas fv WHERE ${real.conds.join(' AND ')}
    `, real.inputs),
        query(`
      SELECT COALESCE(SUM(o.valor_pendente),0) AS orcVal, COALESCE(SUM(o.qtd_pendente_kg),0) AS orcKg
      FROM orcamento_2026 o WHERE ${orc.conds.join(' AND ')}
    `, orc.inputs),
    ]);
    return {
        fatAtual: Number(realRows[0]?.fatAtual ?? 0),
        volAtual: Number(realRows[0]?.volAtual ?? 0),
        orcVal: Number(orcRows[0]?.orcVal ?? 0),
        orcKg: Number(orcRows[0]?.orcKg ?? 0),
    };
}
async function getRecorrentesTabela(f) {
    const real = buildRecRealWhere(f);
    const orc = buildRecOrcWhere(f);
    return query(`
    WITH real_data AS (
      SELECT fv.cod_parc,
        MAX(COALESCE(dcr.razao_social, fv.RAZAOSOCIAL)) AS razaoSocial,
        SUM(fv.valor_pendente) AS fatAtual, SUM(fv.qtd_pendente_kg) AS volAtual
      FROM fato_vendas fv LEFT JOIN dim_cliente dcr ON fv.cod_parc = dcr.cod_parc
      WHERE ${real.conds.join(' AND ')}
      GROUP BY fv.cod_parc
    ),
    orc_data AS (
      SELECT o.cod_parc,
        MAX(COALESCE(dco.razao_social, fany.RAZAOSOCIAL)) AS orcRazaoSocial,
        SUM(o.valor_pendente) AS orcVal, SUM(o.qtd_pendente_kg) AS orcKg
      FROM orcamento_2026 o
      LEFT JOIN dim_cliente dco ON o.cod_parc = dco.cod_parc
      LEFT JOIN (SELECT DISTINCT cod_parc, MAX(RAZAOSOCIAL) AS RAZAOSOCIAL FROM fato_vendas WHERE RAZAOSOCIAL IS NOT NULL GROUP BY cod_parc) fany ON o.cod_parc = fany.cod_parc
      WHERE ${orc.conds.join(' AND ')}
      GROUP BY o.cod_parc
    )
    SELECT
      COALESCE(r.cod_parc, od.cod_parc)                                                                          AS codParc,
      COALESCE(dc.razao_social, r.razaoSocial, od.orcRazaoSocial, 'Cliente ' + CAST(COALESCE(r.cod_parc, od.cod_parc) AS VARCHAR)) AS razaoSocial,
      COALESCE(r.volAtual, 0) AS volAtual, COALESCE(od.orcKg,  0) AS orcKg,
      COALESCE(r.fatAtual, 0) AS fatAtual, COALESCE(od.orcVal, 0) AS orcVal
    FROM real_data r
    FULL OUTER JOIN orc_data od ON r.cod_parc = od.cod_parc
    LEFT JOIN dim_cliente dc ON COALESCE(r.cod_parc, od.cod_parc) = dc.cod_parc
    ORDER BY COALESCE(r.volAtual, 0) DESC
  `, [...real.inputs, ...orc.inputs]);
}
async function getRecorrentesProdutos(codParc, f) {
    const realF = { ...f, codParc };
    const orcF = { ...f, codParc };
    const real = buildRecRealWhere(realF);
    const orc = buildRecOrcWhere(orcF);
    return query(`
    WITH real_p AS (
      SELECT fv.cod_produto,
        MAX(COALESCE(dp.nome_produto, fv.nome_produto, CAST(fv.cod_produto AS VARCHAR))) AS nomeProduto,
        SUM(fv.valor_pendente) AS fatAtual, SUM(fv.qtd_pendente_kg) AS volAtual
      FROM fato_vendas fv LEFT JOIN dim_produto dp ON fv.cod_produto = dp.cod_produto
      WHERE ${real.conds.join(' AND ')}
      GROUP BY fv.cod_produto
    ),
    orc_p AS (
      SELECT o.cod_produto,
        MAX(COALESCE(dp.nome_produto, fany.nome_produto)) AS orcNomeProduto,
        SUM(o.valor_pendente) AS orcVal, SUM(o.qtd_pendente_kg) AS orcKg
      FROM orcamento_2026 o
      LEFT JOIN dim_produto dp ON o.cod_produto = dp.cod_produto
      LEFT JOIN (SELECT DISTINCT cod_produto, MAX(nome_produto) AS nome_produto FROM fato_vendas WHERE nome_produto IS NOT NULL GROUP BY cod_produto) fany ON o.cod_produto = fany.cod_produto
      WHERE ${orc.conds.join(' AND ')}
      GROUP BY o.cod_produto
    )
    SELECT
      COALESCE(r.cod_produto, op.cod_produto)   AS codProduto,
      COALESCE(r.nomeProduto, op.orcNomeProduto, 'Produto ' + CAST(COALESCE(r.cod_produto, op.cod_produto) AS VARCHAR)) AS nomeProduto,
      COALESCE(r.volAtual, 0) AS volAtual, COALESCE(op.orcKg,  0) AS orcKg,
      COALESCE(r.fatAtual, 0) AS fatAtual, COALESCE(op.orcVal, 0) AS orcVal
    FROM real_p r
    FULL OUTER JOIN orc_p op ON r.cod_produto = op.cod_produto
    ORDER BY COALESCE(r.volAtual, 0) DESC
  `, [...real.inputs, ...orc.inputs]);
}
async function getRecorrentesFiltros() {
    const [vendedores, mercados] = await Promise.all([
        query(`SELECT DISTINCT nome_vendedor AS nome FROM fato_vendas WHERE projeto = 'RECORRENTES' AND nome_vendedor IS NOT NULL ORDER BY nome_vendedor`),
        query(`SELECT DISTINCT mercado_vendas AS nome FROM fato_vendas WHERE projeto = 'RECORRENTES' AND mercado_vendas IS NOT NULL ORDER BY mercado_vendas`),
    ]);
    return { vendedores: vendedores.map(r => r.nome), mercados: mercados.map(r => r.nome) };
}
async function getEvolucaoMensal(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT FORMAT(fv.dt_entrega_cliente,'yyyy-MM') AS mes,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento,
      COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COALESCE(SUM(CASE WHEN fv.tipo_receita IN ('VENDA_FIRME','DEVOLUCAO') THEN fv.valor_pendente ELSE 0 END),0) AS vendaFirme,
      COALESCE(SUM(CASE WHEN fv.tipo_receita='FORECAST' THEN fv.valor_pendente ELSE 0 END),0) AS forecast,
      COALESCE(SUM(CASE WHEN fv.tipo_receita='NOVO_PROJETO' THEN fv.valor_pendente ELSE 0 END),0) AS novoProjeto
    FROM fato_vendas fv ${clause}
    GROUP BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
    ORDER BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
  `, inputs);
}
async function getEvolucaoMensalAnoAnterior(f) {
    const fAnt = { ...f, dataInicio: shiftYear(f.dataInicio), dataFim: shiftYear(f.dataFim) };
    const { clause, inputs } = buildWhere(fAnt);
    const anoAtual = f.dataInicio ? new Date(f.dataInicio + 'T00:00:00Z').getUTCFullYear() : null;
    const rows = await query(`SELECT FORMAT(fv.dt_entrega_cliente,'yyyy-MM') AS mes,
     COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume
     FROM fato_vendas fv ${clause}
     GROUP BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
     ORDER BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')`, inputs);
    return rows.map(r => ({
        mes: r.mes,
        faturamento: Number(r.faturamento),
        volume: Number(r.volume),
        mesAlinhado: anoAtual && r.mes ? `${anoAtual}-${r.mes.split('-')[1]}` : r.mes,
        mesOriginal: r.mes,
    }));
}
async function getKpisPorTipoReceita(f) {
    // Não filtra por tiposReceita no WHERE — o agrupamento por CASE já trata DEVOLUCAO
    // corretamente (somando-o como VENDA_FIRME negativo). Filtrar por tipo no WHERE
    // excluiria o DEVOLUCAO e tornaria o valor de VENDA_FIRME incorreto (bruto).
    const { clause, inputs } = buildWhere({ ...f, tiposReceita: undefined });
    return query(`
    SELECT
      CASE WHEN fv.tipo_receita = 'DEVOLUCAO' THEN 'VENDA_FIRME' ELSE fv.tipo_receita END AS tipoReceita,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento,
      COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_parc) AS clientes,
      COUNT(*) AS registros
    FROM fato_vendas fv ${clause}
    GROUP BY CASE WHEN fv.tipo_receita = 'DEVOLUCAO' THEN 'VENDA_FIRME' ELSE fv.tipo_receita END
  `, inputs);
}
// ─── Vendedores ───────────────────────────────────────────────────────────────
async function getPerformanceVendedores(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT fv.nome_vendedor AS nomeVendedor,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento,
      COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_parc) AS clientes,
      COUNT(DISTINCT fv.cod_produto) AS produtos,
      COALESCE(SUM(CASE WHEN fv.tipo_receita IN ('VENDA_FIRME','DEVOLUCAO') THEN fv.valor_pendente ELSE 0 END),0) AS vendaFirme,
      COALESCE(SUM(CASE WHEN fv.tipo_receita='FORECAST' THEN fv.valor_pendente ELSE 0 END),0) AS forecast,
      COALESCE(SUM(CASE WHEN fv.tipo_receita='NOVO_PROJETO' THEN fv.valor_pendente ELSE 0 END),0) AS novoProjeto,
      COALESCE(SUM(CASE WHEN fv.projeto='Novo Projeto' THEN fv.valor_pendente ELSE 0 END),0) AS fatNovoProjeto,
      COALESCE(SUM(CASE WHEN fv.projeto='Recorrente' THEN fv.valor_pendente ELSE 0 END),0) AS fatRecorrente
    FROM fato_vendas fv ${clause}
    GROUP BY fv.nome_vendedor
    ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
async function getEvolucaoVendedor(vendedor, f) {
    const parts = ['fv.nome_vendedor = @vend', '(fv.cod_top IS NULL OR fv.cod_top != 1023)', "(fv.[top] IS NULL OR fv.[top] NOT LIKE '%ESTOQUE MINIM%')"];
    const inputs = [{ name: 'vend', type: mssql_1.default.NVarChar(100), value: vendedor }];
    if (f.dataInicio) {
        inputs.push({ name: 'dtIni', type: mssql_1.default.Date, value: f.dataInicio });
        parts.push('fv.dt_entrega_cliente >= @dtIni');
    }
    if (f.dataFim) {
        inputs.push({ name: 'dtFim', type: mssql_1.default.Date, value: f.dataFim });
        parts.push('fv.dt_entrega_cliente <= @dtFim');
    }
    const clause = 'WHERE ' + parts.join(' AND ');
    return query(`
    SELECT FORMAT(fv.dt_entrega_cliente,'yyyy-MM') AS mes,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento,
      COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_parc) AS clientes
    FROM fato_vendas fv ${clause}
    GROUP BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
    ORDER BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
  `, inputs);
}
async function getClientesVendedor(vendedor, extraFiltros) {
    const { clause: extraClause, inputs: extraInputs } = extraFiltros ? buildWhere({ ...extraFiltros, vendedores: [] }) : { clause: '', inputs: [] };
    const inputs = [{ name: 'vend', type: mssql_1.default.NVarChar(100), value: vendedor }, ...extraInputs];
    const whereBase = 'WHERE fv.nome_vendedor = @vend';
    const clause = extraClause ? whereBase + ' AND ' + extraClause.replace('WHERE ', '') : whereBase;
    return query(`
    SELECT fv.cod_parc AS codParc, COALESCE(dc.razao_social, fv.RAZAOSOCIAL) AS razaoSocial, fv.perfil_parceiro AS perfilParceiro,
      fv.uf, COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      MAX(CONVERT(VARCHAR,fv.dt_entrega_cliente,23)) AS ultimaCompra
    FROM fato_vendas fv LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
    ${clause}
    GROUP BY fv.cod_parc, dc.razao_social, fv.RAZAOSOCIAL, fv.perfil_parceiro, fv.uf
    ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
async function getEvolucaoConsolidada(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT FORMAT(fv.dt_entrega_cliente,'yyyy-MM') AS mes,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento,
      COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_parc) AS clientes
    FROM fato_vendas fv ${clause}
    GROUP BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
    ORDER BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
  `, inputs);
}
async function getVendedoresEvolucaoPorTipo(f) {
    const { clause, inputs } = buildWhere({ ...f, tiposReceita: undefined });
    return query(`
    SELECT
      FORMAT(fv.dt_entrega_cliente,'yyyy-MM') AS mes,
      CASE WHEN fv.tipo_receita = 'DEVOLUCAO' THEN 'VENDA_FIRME' ELSE fv.tipo_receita END AS tipoReceita,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento
    FROM fato_vendas fv ${clause}
    AND fv.tipo_receita IN ('VENDA_FIRME','FORECAST','NOVO_PROJETO','DEVOLUCAO')
    GROUP BY
      FORMAT(fv.dt_entrega_cliente,'yyyy-MM'),
      CASE WHEN fv.tipo_receita = 'DEVOLUCAO' THEN 'VENDA_FIRME' ELSE fv.tipo_receita END
    ORDER BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
  `, inputs);
}
async function getClientesConsolidados(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT fv.cod_parc AS codParc, COALESCE(dc.razao_social, fv.RAZAOSOCIAL) AS razaoSocial, fv.perfil_parceiro AS perfilParceiro,
      fv.uf,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      MAX(CONVERT(VARCHAR,fv.dt_entrega_cliente,23)) AS ultimaCompra
    FROM fato_vendas fv LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
    ${clause}
    GROUP BY fv.cod_parc, dc.razao_social, fv.RAZAOSOCIAL, fv.perfil_parceiro, fv.uf
    ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
// ─── Clientes ─────────────────────────────────────────────────────────────────
async function getListaClientes(f) {
    const { clause, inputs } = buildWhere(f);
    // gd usa datas GLOBAIS (sem filtro de período) para calcular status real do cliente
    return query(`
    WITH gd AS (
      SELECT cod_parc,
        MAX(CONVERT(VARCHAR, dt_entrega_cliente, 23)) AS ultimaCompra,
        MIN(CONVERT(VARCHAR, dt_entrega_cliente, 23)) AS primeiraCompra
      FROM fato_vendas GROUP BY cod_parc
    )
    SELECT fv.cod_parc AS codParc, COALESCE(dc.razao_social, fv.RAZAOSOCIAL) AS razaoSocial, fv.perfil_parceiro AS perfilParceiro,
      fv.nome_vendedor AS nomeVendedor, fv.uf,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_produto) AS produtos, COUNT(DISTINCT fv.nro_unico) AS pedidos,
      MAX(gd.ultimaCompra) AS ultimaCompra,
      MAX(gd.primeiraCompra) AS primeiraCompra
    FROM fato_vendas fv
    LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
    LEFT JOIN gd ON fv.cod_parc = gd.cod_parc
    ${clause}
    GROUP BY fv.cod_parc, dc.razao_social, fv.RAZAOSOCIAL, fv.perfil_parceiro, fv.nome_vendedor, fv.uf
    ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
async function getHistoricoCliente(codParc, filtros) {
    const extra = filtros ? buildWhere({ ...filtros, codParc: undefined }) : { clause: '', inputs: [] };
    const inputs = [{ name: 'codParc', type: mssql_1.default.Int, value: codParc }, ...extra.inputs];
    const addCond = extra.clause ? extra.clause.replace('WHERE ', ' AND ') : '';
    return query(`
    SELECT FORMAT(fv.dt_entrega_cliente,'yyyy-MM') AS mes,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_produto) AS produtos, fv.tipo_receita AS tipoReceita
    FROM fato_vendas fv
    WHERE fv.cod_parc = @codParc ${addCond}
    GROUP BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM'), fv.tipo_receita
    ORDER BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
  `, inputs);
}
async function getMixCliente(codParc, filtros) {
    const extra = filtros ? buildWhere({ ...filtros, codParc: undefined }) : { clause: '', inputs: [] };
    const inputs = [{ name: 'codParc', type: mssql_1.default.Int, value: codParc }, ...extra.inputs];
    const addCond = extra.clause ? extra.clause.replace('WHERE ', ' AND ') : '';
    return query(`
    SELECT fv.cod_produto AS codProduto, COALESCE(dp.nome_produto, fv.nome_produto) AS nomeProduto, fv.grupo_produto AS grupoProduto,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.nro_unico) AS pedidos, MAX(CONVERT(VARCHAR,fv.dt_entrega_cliente,23)) AS ultimaCompra
    FROM fato_vendas fv LEFT JOIN dim_produto dp ON fv.cod_produto = dp.cod_produto
    WHERE fv.cod_parc = @codParc AND fv.flag_devolucao = 0 ${addCond}
    GROUP BY fv.cod_produto, dp.nome_produto, fv.nome_produto, fv.grupo_produto
    ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
async function getSaudeCarteira(f) {
    const { clause, inputs } = buildWhere(f);
    // gd fornece datas GLOBAIS de cada cliente — o filtro de período define QUAIS clientes analisar,
    // mas o status de saúde usa a data real da última compra (sem recorte)
    const rows = await query(`
    WITH gd AS (
      SELECT cod_parc,
        MAX(CONVERT(VARCHAR, dt_entrega_cliente, 23)) AS ultimaCompra,
        MIN(CONVERT(VARCHAR, dt_entrega_cliente, 23)) AS primeiraCompra
      FROM fato_vendas GROUP BY cod_parc
    )
    SELECT fv.cod_parc AS codParc, MAX(gd.ultimaCompra) AS ultimaCompra, MAX(gd.primeiraCompra) AS primeiraCompra
    FROM fato_vendas fv
    LEFT JOIN gd ON fv.cod_parc = gd.cod_parc
    ${clause}
    GROUP BY fv.cod_parc
  `, inputs);
    const now = new Date();
    let novos = 0, ativos = 0, emRisco = 0, inativos = 0;
    for (const r of rows) {
        const ultima = new Date(r.ultimaCompra);
        const primeira = new Date(r.primeiraCompra);
        const diasUltima = (now.getTime() - ultima.getTime()) / 86400000;
        const diasPrimeira = (now.getTime() - primeira.getTime()) / 86400000;
        if (diasPrimeira <= 60)
            novos++;
        else if (diasUltima <= 75)
            ativos++; // ≤ 75 dias (≈ 2,5 meses) = comprou recentemente
        else if (diasUltima <= 180)
            emRisco++; // 75-180 dias = em risco de esfriamento
        else
            inativos++;
    }
    const total = rows.length;
    const score = total > 0 ? Math.round(((novos + ativos) * 100 + emRisco * 50) / total) : 0;
    return { score, novos, ativos, emRisco, inativos, total };
}
async function getVendasPorEstado(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT fv.uf, COALESCE(SUM(fv.valor_pendente),0) AS faturamento,
      COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume, COUNT(DISTINCT fv.cod_parc) AS clientes
    FROM fato_vendas fv ${clause}
    GROUP BY fv.uf ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
async function getClientesCrescimento(f) {
    const dtIni = f.dataInicio || '2026-01-01';
    const dtFim = f.dataFim || '2026-12-31';
    const nonDate = { ...f, dataInicio: undefined, dataFim: undefined, codParc: undefined };
    const { clause: baseClause, inputs: baseInputs } = buildWhere(nonDate);
    const addCond = baseClause ? baseClause.replace(/^WHERE\s+/i, ' AND ') : '';
    const inputs = [
        { name: 'dtIni', type: mssql_1.default.Date, value: dtIni },
        { name: 'dtFim', type: mssql_1.default.Date, value: dtFim },
        ...baseInputs,
    ];
    // effEnd = menor entre @dtFim e hoje — evita comparar com dados futuros inexistentes
    return query(`
    WITH eff AS (
      SELECT CAST(CASE WHEN @dtFim > CAST(GETDATE() AS DATE)
                       THEN CAST(GETDATE() AS DATE) ELSE @dtFim END AS DATE) AS effEnd
    ),
    mid_cte AS (
      SELECT effEnd,
        CAST(DATEADD(day, DATEDIFF(day, @dtIni, effEnd) / 2, @dtIni) AS DATE) AS midDate
      FROM eff
    ),
    pm AS (
      SELECT fv.cod_parc, COALESCE(SUM(fv.valor_pendente),0) AS fat
      FROM fato_vendas fv CROSS JOIN mid_cte
      WHERE fv.dt_entrega_cliente >= @dtIni AND fv.dt_entrega_cliente < mid_cte.midDate ${addCond}
      GROUP BY fv.cod_parc
    ),
    sm AS (
      SELECT fv.cod_parc,
        COALESCE(MAX(dc.razao_social), MAX(fv.RAZAOSOCIAL)) AS razaoSocial,
        MAX(fv.perfil_parceiro) AS perfilParceiro,
        COALESCE(SUM(fv.valor_pendente),0) AS fat
      FROM fato_vendas fv
      LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
      CROSS JOIN mid_cte
      WHERE fv.dt_entrega_cliente >= mid_cte.midDate AND fv.dt_entrega_cliente <= mid_cte.effEnd ${addCond}
      GROUP BY fv.cod_parc
    )
    SELECT TOP 5
      sm.cod_parc AS codParc, sm.razaoSocial, sm.perfilParceiro,
      sm.fat AS fatAtual, COALESCE(pm.fat,0) AS fatAnterior,
      CASE WHEN COALESCE(pm.fat,0) = 0 THEN 100
           ELSE CAST((sm.fat - pm.fat) AS FLOAT) / pm.fat * 100
      END AS crescimentoPct
    FROM sm LEFT JOIN pm ON sm.cod_parc = pm.cod_parc
    WHERE sm.fat > COALESCE(pm.fat,0) AND sm.fat > 0
    ORDER BY crescimentoPct DESC
  `, inputs);
}
// ─── Produtos ─────────────────────────────────────────────────────────────────
async function getPerformanceProdutos(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT fv.cod_produto AS codProduto, COALESCE(dp.nome_produto, fv.nome_produto) AS nomeProduto, fv.grupo_produto AS grupoProduto,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_parc) AS clientes, COUNT(DISTINCT fv.nro_unico) AS pedidos
    FROM fato_vendas fv LEFT JOIN dim_produto dp ON fv.cod_produto = dp.cod_produto
    ${clause}
    GROUP BY fv.cod_produto, dp.nome_produto, fv.nome_produto, fv.grupo_produto
    ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
async function getEvolucaoProduto(codProduto, f) {
    const parts = ['fv.cod_produto = @codProduto', 'fv.flag_devolucao = 0', '(fv.cod_top IS NULL OR fv.cod_top != 1023)', "(fv.[top] IS NULL OR fv.[top] NOT LIKE '%ESTOQUE MINIM%')"];
    const inputs = [{ name: 'codProduto', type: mssql_1.default.BigInt, value: codProduto }];
    if (f.dataInicio) {
        inputs.push({ name: 'dtIni', type: mssql_1.default.Date, value: f.dataInicio });
        parts.push('fv.dt_entrega_cliente >= @dtIni');
    }
    if (f.dataFim) {
        inputs.push({ name: 'dtFim', type: mssql_1.default.Date, value: f.dataFim });
        parts.push('fv.dt_entrega_cliente <= @dtFim');
    }
    return query(`
    SELECT FORMAT(fv.dt_entrega_cliente,'yyyy-MM') AS mes,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_parc) AS clientes
    FROM fato_vendas fv WHERE ${parts.join(' AND ')}
    GROUP BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
    ORDER BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
  `, inputs);
}
async function getEvolucaoProdutosConsolidada(f) {
    return getEvolucaoConsolidada(f);
}
// ─── Segmentos ────────────────────────────────────────────────────────────────
async function getPerformanceSegmentos(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT fv.perfil_parceiro AS segmento,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_parc) AS clientes, COUNT(DISTINCT fv.cod_produto) AS produtos
    FROM fato_vendas fv ${clause}
    GROUP BY fv.perfil_parceiro ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
async function getEvolucaoSegmento(segmento) {
    return query(`
    SELECT FORMAT(fv.dt_entrega_cliente,'yyyy-MM') AS mes,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume
    FROM fato_vendas fv WHERE fv.perfil_parceiro = @seg AND fv.flag_devolucao = 0 AND (fv.cod_top IS NULL OR fv.cod_top != 1023) AND (fv.[top] IS NULL OR fv.[top] NOT LIKE '%ESTOQUE MINIM%')
    GROUP BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
    ORDER BY FORMAT(fv.dt_entrega_cliente,'yyyy-MM')
  `, [{ name: 'seg', type: mssql_1.default.NVarChar(100), value: segmento }]);
}
// ─── Pipeline ─────────────────────────────────────────────────────────────────
async function getPipelineComercial(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT
      CASE WHEN fv.tipo_receita = 'DEVOLUCAO' THEN 'VENDA_FIRME' ELSE fv.tipo_receita END AS tipoReceita,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_parc) AS clientes, COUNT(*) AS registros
    FROM fato_vendas fv ${clause}
    GROUP BY CASE WHEN fv.tipo_receita = 'DEVOLUCAO' THEN 'VENDA_FIRME' ELSE fv.tipo_receita END
  `, inputs);
}
async function getPipelineDetalhado(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT fv.tipo_receita AS tipoReceita, fv.projeto, fv.cod_parc AS codParc,
      COALESCE(dc.razao_social, fv.RAZAOSOCIAL) AS razaoSocial, fv.nome_vendedor AS nomeVendedor,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      MAX(CONVERT(VARCHAR,fv.dt_entrega_cliente,23)) AS dtPrevista
    FROM fato_vendas fv LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
    ${clause}
    GROUP BY fv.tipo_receita, fv.projeto, fv.cod_parc, dc.razao_social, fv.RAZAOSOCIAL, fv.nome_vendedor
    ORDER BY fv.tipo_receita, SUM(fv.valor_pendente) DESC
  `, inputs);
}
// ─── Funil de Vendas CRM ──────────────────────────────────────────────────────
// ─── Normalização de nomes de vendedor ────────────────────────────────────────
// Faturamento: "73 - MARIA BAY"  →  "MARIA BAY"
// CRM:         "Maria Bay"       →  "MARIA BAY"
// Aliases: casos onde o nome no Faturamento difere do nome no CRM.
// Adicionar aqui quando surgir nova divergência.
exports.SELLER_ALIASES = {
    'ANDRESSA MEIRA': 'ANDRESSA LAIZA MEIRA',
};
function normalizeSellerName(name) {
    const base = name
        .replace(/^\d+\s*-\s*/, '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .trim()
        .replace(/\s+/g, ' ');
    return exports.SELLER_ALIASES[base] ?? base;
}
// Gera CASE WHEN SQL para aplicar aliases sobre uma expressão normalizada
function sqlApplyAliases(expr) {
    const entries = Object.entries(exports.SELLER_ALIASES);
    if (entries.length === 0)
        return expr;
    const whens = entries.map(([from, to]) => `WHEN '${from}' THEN '${to}'`).join(' ');
    return `CASE ${expr} ${whens} ELSE ${expr} END`;
}
const SQL_NORM_FAT_BASE = `UPPER(LTRIM(RTRIM(CASE WHEN fv.nome_vendedor LIKE '[0-9]%' THEN LTRIM(SUBSTRING(fv.nome_vendedor, CHARINDEX('-', fv.nome_vendedor) + 1, LEN(fv.nome_vendedor))) ELSE fv.nome_vendedor END)))`;
const SQL_NORM_FAT = sqlApplyAliases(SQL_NORM_FAT_BASE);
const SQL_NORM_CRM = `UPPER(LTRIM(RTRIM(u.name + ' ' + COALESCE(u.last_name, ''))))`;
async function getFaturamentoCrmMapping() {
    return query(`
    SELECT DISTINCT
      fv.nome_vendedor                             AS nomeFaturamento,
      ${SQL_NORM_FAT} COLLATE Latin1_General_CI_AI AS nomeNormalizado,
      u.id                                         AS crmUserId,
      LTRIM(RTRIM(u.name + ' ' + COALESCE(u.last_name, ''))) AS crmNome
    FROM fato_vendas fv
    LEFT JOIN crm_users u
      ON ${SQL_NORM_FAT} COLLATE Latin1_General_CI_AI
       = ${SQL_NORM_CRM} COLLATE Latin1_General_CI_AI
    WHERE fv.nome_vendedor IS NOT NULL
    ORDER BY fv.nome_vendedor
  `, []);
}
// Pipelines sempre excluídos (Projetos Inovação, Mercado Público, Internacional)
const PIPELINE_BLACKLIST = [15, 23, 25];
function pipelineWhereClause(col, ids) {
    if (ids && ids.length > 0) {
        const safe = ids.filter(id => !PIPELINE_BLACKLIST.includes(id));
        if (safe.length > 0)
            return `AND ${col} IN (${safe.join(',')})`;
    }
    return `AND ${col} NOT IN (${PIPELINE_BLACKLIST.join(',')})`;
}
function userWhereClause(col, userId) {
    return userId != null ? `AND ${col} = ${userId}` : '';
}
async function getCrmKpisPorVendedor() {
    const bl = PIPELINE_BLACKLIST.join(',');
    return query(`
    SELECT
      assigned_by_id AS crmUserId,
      SUM(CASE WHEN stage_semantic_id = 'P' THEN 1 ELSE 0 END)                                              AS emAndamento,
      COALESCE(SUM(CASE WHEN stage_semantic_id = 'P' THEN opportunity ELSE 0 END), 0)                       AS valorAndamento,
      SUM(CASE WHEN stage_semantic_id = 'S' THEN 1 ELSE 0 END)                                              AS ganhos,
      COALESCE(SUM(CASE WHEN stage_semantic_id = 'S' THEN opportunity ELSE 0 END), 0)                       AS valorGanho,
      SUM(CASE WHEN stage_semantic_id = 'F' THEN 1 ELSE 0 END)                                              AS perdidos,
      CASE
        WHEN SUM(CASE WHEN stage_semantic_id IN ('S','F') THEN 1 ELSE 0 END) = 0 THEN 0
        ELSE CAST(SUM(CASE WHEN stage_semantic_id = 'S' THEN 1 ELSE 0 END) AS FLOAT)
           / SUM(CASE WHEN stage_semantic_id IN ('S','F') THEN 1 ELSE 0 END) * 100
      END AS taxaConversao,
      COALESCE(AVG(CASE
        WHEN stage_semantic_id = 'S' AND closedate IS NOT NULL AND date_create IS NOT NULL
        THEN DATEDIFF(day, TRY_CAST(date_create AS DATE), TRY_CAST(closedate AS DATE))
        ELSE NULL
      END), 0) AS cicloGanhos
    FROM crm_deals
    WHERE CAST(COALESCE(category_id, '0') AS INT) NOT IN (${bl})
      AND assigned_by_id IS NOT NULL
    GROUP BY assigned_by_id
  `);
}
async function getCrmVendedores() {
    return query(`
    SELECT DISTINCT u.id, LTRIM(RTRIM(u.name + ' ' + COALESCE(u.last_name, ''))) AS nome
    FROM crm_users u
    JOIN crm_deals d ON d.assigned_by_id = u.id
    WHERE CAST(COALESCE(d.category_id,'0') AS INT) NOT IN (${PIPELINE_BLACKLIST.join(',')})
    ORDER BY nome
  `);
}
async function getFunilKpis(pipelineIds, userId) {
    const filter = pipelineWhereClause('CAST(COALESCE(category_id, \'0\') AS INT)', pipelineIds);
    const userF = userWhereClause('assigned_by_id', userId);
    return query(`
    SELECT
      SUM(CASE WHEN stage_semantic_id = 'P' THEN 1 ELSE 0 END) AS emAndamento,
      COALESCE(SUM(CASE WHEN stage_semantic_id = 'P' THEN opportunity ELSE 0 END), 0) AS valorPipeline,
      SUM(CASE WHEN stage_semantic_id = 'S' THEN 1 ELSE 0 END) AS ganhos,
      COALESCE(SUM(CASE WHEN stage_semantic_id = 'S' THEN opportunity ELSE 0 END), 0) AS valorGanho,
      SUM(CASE WHEN stage_semantic_id = 'F' THEN 1 ELSE 0 END) AS perdidos,
      CASE
        WHEN SUM(CASE WHEN stage_semantic_id IN ('S','F') THEN 1 ELSE 0 END) = 0 THEN 0
        ELSE CAST(SUM(CASE WHEN stage_semantic_id = 'S' THEN 1 ELSE 0 END) AS FLOAT)
          / SUM(CASE WHEN stage_semantic_id IN ('S','F') THEN 1 ELSE 0 END) * 100
      END AS taxaConversao,
      COALESCE(AVG(CASE
        WHEN stage_semantic_id = 'S' AND closedate IS NOT NULL AND date_create IS NOT NULL
        THEN DATEDIFF(day, TRY_CAST(date_create AS DATE), TRY_CAST(closedate AS DATE))
        ELSE NULL
      END), 0) AS diasMedioFechamento
    FROM crm_deals
    WHERE 1=1 ${filter} ${userF}
  `);
}
async function getFunilPorEtapa(pipelineIds, userId) {
    const filter = pipelineWhereClause('CAST(COALESCE(d.category_id, \'0\') AS INT)', pipelineIds);
    const userF = userWhereClause('d.assigned_by_id', userId);
    return query(`
    SELECT
      ds.name AS etapa,
      p.name  AS pipeline,
      COUNT(*) AS total,
      COALESCE(SUM(d.opportunity), 0) AS valorTotal,
      ds.semantic,
      p.id AS pipelineId,
      ds.status_id AS stageId
    FROM crm_deals d
    LEFT JOIN crm_deal_stages ds ON d.stage_id = ds.status_id
    LEFT JOIN crm_pipelines p ON CAST(COALESCE(d.category_id, '0') AS INT) = p.id
    WHERE d.stage_semantic_id = 'P'
      ${filter} ${userF}
    GROUP BY ds.name, p.name, ds.semantic, p.id, ds.status_id
    ORDER BY p.id, ds.status_id
  `);
}
async function getFunilPorPipeline(pipelineIds, userId) {
    const filter = pipelineWhereClause('CAST(COALESCE(d.category_id, \'0\') AS INT)', pipelineIds);
    const userF = userWhereClause('d.assigned_by_id', userId);
    return query(`
    SELECT
      COALESCE(p.name, 'Comercial') AS pipeline,
      SUM(CASE WHEN d.stage_semantic_id = 'P' THEN 1 ELSE 0 END) AS emAndamento,
      SUM(CASE WHEN d.stage_semantic_id = 'S' THEN 1 ELSE 0 END) AS ganhos,
      SUM(CASE WHEN d.stage_semantic_id = 'F' THEN 1 ELSE 0 END) AS perdidos,
      COALESCE(SUM(CASE WHEN d.stage_semantic_id = 'P' THEN d.opportunity ELSE 0 END), 0) AS valorPipeline,
      CASE
        WHEN SUM(CASE WHEN d.stage_semantic_id IN ('S','F') THEN 1 ELSE 0 END) = 0 THEN 0
        ELSE CAST(SUM(CASE WHEN d.stage_semantic_id = 'S' THEN 1 ELSE 0 END) AS FLOAT)
          / SUM(CASE WHEN d.stage_semantic_id IN ('S','F') THEN 1 ELSE 0 END) * 100
      END AS taxaConversao
    FROM crm_deals d
    LEFT JOIN crm_pipelines p ON CAST(COALESCE(d.category_id, '0') AS INT) = p.id
    WHERE 1=1 ${filter} ${userF}
    GROUP BY COALESCE(p.name, 'Comercial'), CAST(COALESCE(d.category_id, '0') AS INT)
    ORDER BY valorPipeline DESC
  `);
}
async function getFunilTopVendedores(pipelineIds, userId) {
    const filter = pipelineWhereClause('CAST(COALESCE(d.category_id, \'0\') AS INT)', pipelineIds);
    const userF = userWhereClause('d.assigned_by_id', userId);
    return query(`
    SELECT TOP 10
      u.name + ' ' + COALESCE(u.last_name, '') AS nome,
      SUM(CASE WHEN d.stage_semantic_id = 'P' THEN 1 ELSE 0 END) AS emAndamento,
      SUM(CASE WHEN d.stage_semantic_id = 'S' THEN 1 ELSE 0 END) AS ganhos,
      SUM(CASE WHEN d.stage_semantic_id = 'F' THEN 1 ELSE 0 END) AS perdidos,
      COALESCE(SUM(CASE WHEN d.stage_semantic_id = 'P' THEN d.opportunity ELSE 0 END), 0) AS valorPipeline,
      CASE
        WHEN SUM(CASE WHEN d.stage_semantic_id IN ('S','F') THEN 1 ELSE 0 END) = 0 THEN 0
        ELSE CAST(SUM(CASE WHEN d.stage_semantic_id = 'S' THEN 1 ELSE 0 END) AS FLOAT)
          / SUM(CASE WHEN d.stage_semantic_id IN ('S','F') THEN 1 ELSE 0 END) * 100
      END AS taxaConversao
    FROM crm_deals d
    JOIN crm_users u ON d.assigned_by_id = u.id
    WHERE 1=1 ${filter} ${userF}
    GROUP BY d.assigned_by_id, u.name, u.last_name
    ORDER BY valorPipeline DESC
  `);
}
async function getFunilEvolucaoMensal(pipelineIds, userId) {
    const filter = pipelineWhereClause('CAST(COALESCE(category_id, \'0\') AS INT)', pipelineIds);
    const userF = userWhereClause('assigned_by_id', userId);
    return query(`
    SELECT
      FORMAT(TRY_CAST(date_create AS DATE), 'yyyy-MM') AS mes,
      SUM(CASE WHEN stage_semantic_id = 'P' THEN 1 ELSE 0 END) AS abertos,
      SUM(CASE WHEN stage_semantic_id = 'S' THEN 1 ELSE 0 END) AS ganhos,
      SUM(CASE WHEN stage_semantic_id = 'F' THEN 1 ELSE 0 END) AS perdidos
    FROM crm_deals
    WHERE date_create IS NOT NULL
      AND TRY_CAST(date_create AS DATE) >= DATEADD(month, -12, GETDATE())
      ${filter} ${userF}
    GROUP BY FORMAT(TRY_CAST(date_create AS DATE), 'yyyy-MM')
    ORDER BY mes
  `);
}
function origemClause(origem) {
    if (origem === 'leads')
        return 'AND lead_id IS NOT NULL';
    if (origem === 'base')
        return 'AND lead_id IS NULL';
    return '';
}
function pipelineClause(pipelineId) {
    if (pipelineId === 31)
        return "category_id = '31'";
    if (pipelineId === null)
        return "CAST(COALESCE(category_id,'0') AS INT) NOT IN (15, 23, 25)";
    return "(category_id = '0' OR category_id IS NULL)";
}
async function getPanoramaLeadsSnapshot() {
    const rows = await query(`
    SELECT COUNT(*) AS emAndamento FROM crm_leads WHERE status_semantic_id = 'P'
  `);
    return rows[0]?.emAndamento ?? 0;
}
async function getPanoramaDealsSnapshot(pipelineId, origem, userId) {
    const pip = pipelineClause(pipelineId);
    const ori = origemClause(origem);
    const userF = userWhereClause('assigned_by_id', userId);
    const rows = await query(`
    SELECT COUNT(*) AS emAndamento, COALESCE(SUM(opportunity),0) AS valorEmAndamento
    FROM crm_deals
    WHERE stage_semantic_id = 'P'
      AND ${pip}
      ${ori} ${userF}
  `);
    return rows[0] ?? { emAndamento: 0, valorEmAndamento: 0 };
}
async function getPanoramaLeads(dateIni, dateFim, visao) {
    if (visao === 'calendario') {
        const criados = await query(`
      SELECT
        FORMAT(TRY_CAST(date_create AS DATE),'yyyy-MM') AS periodo,
        COUNT(*) AS criados,
        SUM(CASE WHEN TRY_CAST(moved_time AS DATE) BETWEEN '${dateIni}' AND '${dateFim}' THEN 1 ELSE 0 END) AS comMovimentacao
      FROM crm_leads
      WHERE TRY_CAST(date_create AS DATE) BETWEEN '${dateIni}' AND '${dateFim}'
      GROUP BY FORMAT(TRY_CAST(date_create AS DATE),'yyyy-MM')
      ORDER BY periodo
    `);
        const fechados = await query(`
      SELECT
        FORMAT(TRY_CAST(date_closed AS DATE),'yyyy-MM') AS periodo,
        SUM(CASE WHEN status_id = 'CONVERTED' THEN 1 ELSE 0 END) AS convertidos,
        SUM(CASE WHEN status_semantic_id = 'F' THEN 1 ELSE 0 END) AS perdidos,
        AVG(DATEDIFF(day,TRY_CAST(date_create AS DATE),TRY_CAST(date_closed AS DATE))) AS cicloMedio
      FROM crm_leads
      WHERE TRY_CAST(date_closed AS DATE) BETWEEN '${dateIni}' AND '${dateFim}'
        AND status_semantic_id IN ('S','F')
      GROUP BY FORMAT(TRY_CAST(date_closed AS DATE),'yyyy-MM')
      ORDER BY periodo
    `);
        return { criados, fechados };
    }
    else {
        const rows = await query(`
      SELECT
        FORMAT(TRY_CAST(date_create AS DATE),'yyyy-MM') AS periodo,
        COUNT(*) AS criados,
        SUM(CASE WHEN TRY_CAST(moved_time AS DATE) BETWEEN '${dateIni}' AND '${dateFim}' THEN 1 ELSE 0 END) AS comMovimentacao,
        SUM(CASE WHEN status_semantic_id='P' AND (date_closed IS NULL OR TRY_CAST(date_closed AS DATE) > '${dateFim}') THEN 1 ELSE 0 END) AS emAndamento,
        SUM(CASE WHEN status_id='CONVERTED' THEN 1 ELSE 0 END) AS convertidos,
        SUM(CASE WHEN status_semantic_id='F' THEN 1 ELSE 0 END) AS perdidos,
        CAST(SUM(CASE WHEN status_id='CONVERTED' THEN 1 ELSE 0 END) AS FLOAT)
          / NULLIF(
              SUM(CASE WHEN status_semantic_id='P' AND (date_closed IS NULL OR TRY_CAST(date_closed AS DATE) > '${dateFim}') THEN 1 ELSE 0 END)
            + SUM(CASE WHEN status_id='CONVERTED' THEN 1 ELSE 0 END)
            + SUM(CASE WHEN status_semantic_id='F' THEN 1 ELSE 0 END)
            , 0) * 100 AS taxaConv,
        AVG(CASE WHEN date_closed IS NOT NULL THEN DATEDIFF(day,TRY_CAST(date_create AS DATE),TRY_CAST(date_closed AS DATE)) END) AS cicloMedio
      FROM crm_leads
      WHERE TRY_CAST(date_create AS DATE) BETWEEN '${dateIni}' AND '${dateFim}'
      GROUP BY FORMAT(TRY_CAST(date_create AS DATE),'yyyy-MM')
      ORDER BY periodo
    `);
        return { rows };
    }
}
async function getPanoramaDeals(dateIni, dateFim, visao, pipelineId, origem, userId) {
    const pip = pipelineClause(pipelineId);
    const ori = origemClause(origem);
    const userF = userWhereClause('assigned_by_id', userId);
    if (visao === 'calendario') {
        const criados = await query(`
      SELECT FORMAT(TRY_CAST(date_create AS DATE),'yyyy-MM') AS periodo, COUNT(*) AS criados
      FROM crm_deals
      WHERE TRY_CAST(date_create AS DATE) BETWEEN '${dateIni}' AND '${dateFim}'
        AND ${pip} ${ori} ${userF}
      GROUP BY FORMAT(TRY_CAST(date_create AS DATE),'yyyy-MM')
      ORDER BY periodo
    `);
        const fechados = await query(`
      SELECT
        FORMAT(TRY_CAST(closedate AS DATE),'yyyy-MM') AS periodo,
        SUM(CASE WHEN stage_semantic_id='S' THEN 1 ELSE 0 END) AS ganhos,
        COALESCE(SUM(CASE WHEN stage_semantic_id='S' THEN opportunity END),0) AS valorGanhos,
        SUM(CASE WHEN stage_semantic_id='F' THEN 1 ELSE 0 END) AS perdidos,
        AVG(DATEDIFF(day,TRY_CAST(date_create AS DATE),TRY_CAST(closedate AS DATE))) AS cicloTotal,
        AVG(CASE WHEN stage_semantic_id='S' THEN DATEDIFF(day,TRY_CAST(date_create AS DATE),TRY_CAST(closedate AS DATE)) END) AS cicloGanhos
      FROM crm_deals
      WHERE TRY_CAST(closedate AS DATE) BETWEEN '${dateIni}' AND '${dateFim}'
        AND stage_semantic_id IN ('S','F')
        AND ${pip} ${ori} ${userF}
      GROUP BY FORMAT(TRY_CAST(closedate AS DATE),'yyyy-MM')
      ORDER BY periodo
    `);
        return { criados, fechados };
    }
    else {
        const rows = await query(`
      SELECT
        FORMAT(TRY_CAST(date_create AS DATE),'yyyy-MM') AS periodo,
        COUNT(*) AS criados,
        SUM(CASE WHEN stage_semantic_id='P' AND (closedate IS NULL OR TRY_CAST(closedate AS DATE) > '${dateFim}') THEN 1 ELSE 0 END) AS emAndamento,
        COALESCE(SUM(CASE WHEN stage_semantic_id='P' AND (closedate IS NULL OR TRY_CAST(closedate AS DATE) > '${dateFim}') THEN opportunity END),0) AS valorEmAndamento,
        SUM(CASE WHEN stage_semantic_id='S' THEN 1 ELSE 0 END) AS ganhos,
        COALESCE(SUM(CASE WHEN stage_semantic_id='S' THEN opportunity END),0) AS valorGanhos,
        SUM(CASE WHEN stage_semantic_id='F' THEN 1 ELSE 0 END) AS perdidos,
        CAST(SUM(CASE WHEN stage_semantic_id='S' THEN 1 ELSE 0 END) AS FLOAT)
          / NULLIF(
              SUM(CASE WHEN stage_semantic_id='P' AND (closedate IS NULL OR TRY_CAST(closedate AS DATE) > '${dateFim}') THEN 1 ELSE 0 END)
            + SUM(CASE WHEN stage_semantic_id='S' THEN 1 ELSE 0 END)
            + SUM(CASE WHEN stage_semantic_id='F' THEN 1 ELSE 0 END)
            , 0) * 100 AS taxaConv,
        AVG(CASE WHEN stage_semantic_id IN ('S','F') AND closedate IS NOT NULL THEN DATEDIFF(day,TRY_CAST(date_create AS DATE),TRY_CAST(closedate AS DATE)) END) AS cicloTotal,
        AVG(CASE WHEN stage_semantic_id='S' AND closedate IS NOT NULL THEN DATEDIFF(day,TRY_CAST(date_create AS DATE),TRY_CAST(closedate AS DATE)) END) AS cicloGanhos
      FROM crm_deals
      WHERE TRY_CAST(date_create AS DATE) BETWEEN '${dateIni}' AND '${dateFim}'
        AND ${pip} ${ori} ${userF}
      GROUP BY FORMAT(TRY_CAST(date_create AS DATE),'yyyy-MM')
      ORDER BY periodo
    `);
        return { rows };
    }
}
// ─── Representatividade ───────────────────────────────────────────────────────
async function getClientesRepresentatividade(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT fv.cod_parc AS codParc, COALESCE(dc.razao_social, fv.RAZAOSOCIAL) AS razaoSocial,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_produto) AS produtos
    FROM fato_vendas fv LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
    ${clause}
    GROUP BY fv.cod_parc, dc.razao_social, fv.RAZAOSOCIAL ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
async function getProjetoRepresentatividade(f, nomeVendedor) {
    const { clause, inputs } = buildWhere(f);
    const vendCond = nomeVendedor ? `AND fv.nome_vendedor = @vendSingle` : '';
    const allInputs = nomeVendedor ? [...inputs, { name: 'vendSingle', type: mssql_1.default.NVarChar(100), value: nomeVendedor }] : inputs;
    return query(`
    SELECT fv.projeto, COALESCE(SUM(fv.valor_pendente),0) AS faturamento,
      COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume, COUNT(DISTINCT fv.cod_parc) AS clientes
    FROM fato_vendas fv ${clause} ${vendCond}
    GROUP BY fv.projeto ORDER BY SUM(fv.valor_pendente) DESC
  `, allInputs);
}
async function getDrillDownTipoReceita(tipoReceita, f) {
    const { clause, inputs } = buildWhere({ ...f, tiposReceita: [tipoReceita] });
    return query(`
    SELECT fv.cod_parc AS codParc, COALESCE(dc.razao_social, fv.RAZAOSOCIAL) AS razaoSocial,
      fv.cod_produto AS codProduto, COALESCE(dp.nome_produto, fv.nome_produto) AS nomeProduto, fv.grupo_produto AS grupoProduto,
      fv.nome_vendedor AS nomeVendedor,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(*) AS registros, MAX(CONVERT(VARCHAR,fv.dt_entrega_cliente,23)) AS dtPrevEntrega
    FROM fato_vendas fv
    LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
    LEFT JOIN dim_produto dp ON fv.cod_produto = dp.cod_produto
    ${clause}
    GROUP BY fv.cod_parc, dc.razao_social, fv.RAZAOSOCIAL, fv.cod_produto, dp.nome_produto, fv.nome_produto, fv.grupo_produto, fv.nome_vendedor
    ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
// ─── Filtros disponíveis ──────────────────────────────────────────────────────
async function getFiltrosDisponiveis() {
    const p = await getPool();
    if (!p)
        return { mercados: [], vendedores: [], projetos: [], grupos: [], clientes: [] };
    const [mercados, vendedores, projetos, grupos, clientes] = await Promise.all([
        query('SELECT DISTINCT mercado_vendas AS value FROM fato_vendas WHERE mercado_vendas IS NOT NULL ORDER BY mercado_vendas'),
        query('SELECT DISTINCT nome_vendedor AS value FROM fato_vendas WHERE nome_vendedor IS NOT NULL ORDER BY nome_vendedor'),
        query('SELECT DISTINCT projeto AS value FROM fato_vendas WHERE projeto IS NOT NULL ORDER BY projeto'),
        query('SELECT DISTINCT grupo_produto AS value FROM fato_vendas WHERE grupo_produto IS NOT NULL ORDER BY grupo_produto'),
        query('SELECT cod_parc AS codParc, razao_social AS razaoSocial FROM dim_cliente ORDER BY razao_social'),
    ]);
    return {
        mercados: mercados.map(r => r.value).filter(Boolean),
        vendedores: vendedores.map(r => r.value).filter(Boolean),
        projetos: projetos.map(r => r.value).filter(Boolean),
        grupos: grupos.map(r => r.value).filter(Boolean),
        clientes,
    };
}
async function getTotalVendas() {
    const rows = await query('SELECT COUNT(*) AS count FROM fato_vendas');
    return Number(rows[0]?.count ?? 0);
}
async function reclassificarTipoReceita() {
    const p = await getPool();
    if (!p)
        throw new Error('Sem conexão com banco');
    const req = p.request();
    // Remove registros TOP 1023 (Estoque Mínimo)
    await req.query(`DELETE FROM fato_vendas WHERE cod_top = 1023`);
    await req.query(`DELETE FROM fato_vendas WHERE [top] LIKE '%ESTOQUE MINIM%'`);
    // Reclassifica por cod_top (fonte de verdade)
    await req.query(`UPDATE fato_vendas SET tipo_receita = 'VENDA_FIRME'  WHERE cod_top IN (1101,1125,1121,1133,1001,1013,1011,1172,1012)`);
    await req.query(`UPDATE fato_vendas SET tipo_receita = 'FORECAST'     WHERE cod_top = 1020`);
    await req.query(`UPDATE fato_vendas SET tipo_receita = 'NOVO_PROJETO' WHERE cod_top = 1025`);
    await req.query(`UPDATE fato_vendas SET tipo_receita = 'DEVOLUCAO'    WHERE cod_top IN (1202,1201,1299,1204)`);
    const rows = await query('SELECT COUNT(*) AS count FROM fato_vendas');
    return { ok: true, totalRegistros: Number(rows[0]?.count ?? 0) };
}
// ─── Insights ─────────────────────────────────────────────────────────────────
async function getInsights(filtro) {
    const parts = [];
    const inputs = [];
    if (filtro?.tipo) {
        parts.push('tipo_insight = @tipo');
        inputs.push({ name: 'tipo', type: mssql_1.default.NVarChar(50), value: filtro.tipo });
    }
    if (filtro?.prioridade) {
        parts.push('prioridade = @prio');
        inputs.push({ name: 'prio', type: mssql_1.default.NVarChar(10), value: filtro.prioridade });
    }
    if (filtro?.status) {
        parts.push('status = @status');
        inputs.push({ name: 'status', type: mssql_1.default.NVarChar(20), value: filtro.status });
    }
    const clause = parts.length ? 'WHERE ' + parts.join(' AND ') : '';
    return query(`SELECT TOP 100 * FROM insights ${clause} ORDER BY CASE prioridade WHEN 'ALTA' THEN 1 WHEN 'MEDIA' THEN 2 ELSE 3 END, gerado_em DESC`, inputs);
}
async function insertInsight(data) {
    const p = await getPool();
    if (!p)
        return;
    await p.request()
        .input('tipo', mssql_1.default.NVarChar(50), data.tipoInsight)
        .input('codParc', mssql_1.default.Int, data.codParc ?? null)
        .input('nomeCliente', mssql_1.default.NVarChar(255), data.nomeCliente ?? null)
        .input('nomeVendedor', mssql_1.default.NVarChar(100), data.nomeVendedor ?? null)
        .input('codProduto', mssql_1.default.BigInt, data.codProduto ?? null)
        .input('nomeProduto', mssql_1.default.NVarChar(255), data.nomeProduto ?? null)
        .input('segmento', mssql_1.default.NVarChar(100), data.segmento ?? null)
        .input('descricao', mssql_1.default.NVarChar(mssql_1.default.MAX), data.descricao)
        .input('impR', mssql_1.default.Decimal(15, 2), data.impactoEstimadoR ?? null)
        .input('impKg', mssql_1.default.Decimal(15, 3), data.impactoEstimadoKg ?? null)
        .input('prio', mssql_1.default.NVarChar(10), data.prioridade)
        .query(`INSERT INTO insights (tipo_insight,cod_parc,nome_cliente,nome_vendedor,cod_produto,nome_produto,segmento,descricao,impacto_estimado_r,impacto_estimado_kg,prioridade)
            VALUES (@tipo,@codParc,@nomeCliente,@nomeVendedor,@codProduto,@nomeProduto,@segmento,@descricao,@impR,@impKg,@prio)`);
}
async function updateInsightStatus(id, status) {
    const p = await getPool();
    if (!p)
        return;
    await p.request().input('id', mssql_1.default.Int, id).input('status', mssql_1.default.NVarChar(20), status)
        .query(`UPDATE insights SET status = @status, updated_at = GETDATE() WHERE id = @id`);
}
async function deleteAllInsights() {
    const p = await getPool();
    if (!p)
        return;
    await p.request().query('DELETE FROM insights');
}
// ─── Uploads ──────────────────────────────────────────────────────────────────
async function getUploads() {
    return query('SELECT TOP 20 * FROM uploads ORDER BY created_at DESC');
}
async function createUpload(nomeArquivo, uploadedBy) {
    const p = await getPool();
    if (!p)
        throw new Error('DB unavailable');
    const res = await p.request()
        .input('nome', mssql_1.default.NVarChar(255), nomeArquivo)
        .input('by', mssql_1.default.Int, uploadedBy ?? null)
        .query(`INSERT INTO uploads (nome_arquivo, uploaded_by) OUTPUT INSERTED.id VALUES (@nome, @by)`);
    return res.recordset[0].id;
}
async function updateUpload(id, data) {
    const p = await getPool();
    if (!p)
        return;
    const sets = ['updated_at = GETDATE()'];
    const req = p.request().input('id', mssql_1.default.Int, id);
    if (data.status !== undefined) {
        req.input('status', mssql_1.default.NVarChar(20), data.status);
        sets.push('status = @status');
    }
    if (data.totalRegistros !== undefined) {
        req.input('total', mssql_1.default.Int, data.totalRegistros);
        sets.push('total_registros = @total');
    }
    if (data.registrosImportados !== undefined) {
        req.input('imp', mssql_1.default.Int, data.registrosImportados);
        sets.push('registros_importados = @imp');
    }
    if (data.registrosErro !== undefined) {
        req.input('err', mssql_1.default.Int, data.registrosErro);
        sets.push('registros_erro = @err');
    }
    if (data.erroMensagem !== undefined) {
        req.input('msg', mssql_1.default.NVarChar(mssql_1.default.MAX), data.erroMensagem);
        sets.push('erro_mensagem = @msg');
    }
    await req.query(`UPDATE uploads SET ${sets.join(', ')} WHERE id = @id`);
}
// ─── Importação de vendas via Excel ──────────────────────────────────────────
async function importarVendas(registros, uploadId) {
    const p = await getPool();
    if (!p)
        throw new Error('DB unavailable');
    const BATCH = 100;
    let importados = 0;
    for (let i = 0; i < registros.length; i += BATCH) {
        const lote = registros.slice(i, i + BATCH);
        for (const r of lote) {
            await p.request()
                .input('uid', mssql_1.default.Int, uploadId)
                .input('nroUnico', mssql_1.default.BigInt, r.nroUnico)
                .input('nroNota', mssql_1.default.BigInt, r.nroNota ?? null)
                .input('tipmov', mssql_1.default.NVarChar(1), r.tipmov)
                .input('tipoReceita', mssql_1.default.NVarChar(20), r.tipoReceita)
                .input('dtNeg', mssql_1.default.Date, r.dtNeg ?? null)
                .input('dtPrev', mssql_1.default.Date, r.dtPrevEntregaEmbarque ?? null)
                .input('dtMov', mssql_1.default.Date, r.dtMov ?? null)
                .input('codParc', mssql_1.default.Int, r.codParc)
                .input('codProduto', mssql_1.default.BigInt, r.codProduto)
                .input('nomeVendedor', mssql_1.default.NVarChar(100), r.nomeVendedor ?? null)
                .input('projeto', mssql_1.default.NVarChar(100), r.projeto ?? null)
                .input('mercado', mssql_1.default.NVarChar(100), r.mercadoVendas ?? null)
                .input('grupo', mssql_1.default.NVarChar(100), r.grupoProduto ?? null)
                .input('perfil', mssql_1.default.NVarChar(100), r.perfilParceiro ?? null)
                .input('uf', mssql_1.default.NVarChar(2), r.uf ?? null)
                .input('top', mssql_1.default.NVarChar(150), r.top ?? null)
                .input('codTop', mssql_1.default.Int, r.codTipop ?? null)
                .input('qtdNeg', mssql_1.default.Decimal(15, 3), r.qtdNegociada ?? null)
                .input('qtdPend', mssql_1.default.Decimal(15, 3), r.qtdPendenteKg ?? null)
                .input('valPend', mssql_1.default.Decimal(15, 2), r.valorPendente ?? null)
                .input('icms', mssql_1.default.Decimal(15, 2), r.valorIcms ?? null)
                .input('pis', mssql_1.default.Decimal(15, 2), r.valorPis ?? null)
                .input('cofins', mssql_1.default.Decimal(15, 2), r.valorCofins ?? null)
                .input('st', mssql_1.default.Decimal(15, 2), r.vlrSt ?? null)
                .input('desc', mssql_1.default.Decimal(5, 2), r.percDescBonificado ?? null)
                .input('flag', mssql_1.default.Bit, r.flagDevolucao ? 1 : 0)
                .query(`INSERT INTO fato_vendas (upload_id,nro_unico,nro_nota,tipmov,tipo_receita,dt_neg,dt_entrega_cliente,dt_mov,
                cod_parc,cod_produto,nome_vendedor,projeto,mercado_vendas,grupo_produto,perfil_parceiro,uf,top,cod_top,
                qtd_negociada,qtd_pendente_kg,valor_pendente,valor_icms,valor_pis,valor_cofins,vlr_st,perc_desc_bonificado,flag_devolucao)
                VALUES (@uid,@nroUnico,@nroNota,@tipmov,@tipoReceita,@dtNeg,@dtPrev,@dtMov,
                @codParc,@codProduto,@nomeVendedor,@projeto,@mercado,@grupo,@perfil,@uf,@top,@codTop,
                @qtdNeg,@qtdPend,@valPend,@icms,@pis,@cofins,@st,@desc,@flag)`);
            importados++;
        }
    }
    return importados;
}
// ─── Tarefas ──────────────────────────────────────────────────────────────────
async function listTasks(filters) {
    const parts = [];
    const inputs = [];
    if (filters?.status) {
        parts.push('status = @status');
        inputs.push({ name: 'status', type: mssql_1.default.NVarChar(20), value: filters.status });
    }
    if (filters?.prioridade) {
        parts.push('prioridade = @prio');
        inputs.push({ name: 'prio', type: mssql_1.default.NVarChar(10), value: filters.prioridade });
    }
    const clause = parts.length ? 'WHERE ' + parts.join(' AND ') : '';
    return query(`SELECT * FROM tasks ${clause} ORDER BY created_at DESC`, inputs);
}
async function createTask(data) {
    const p = await getPool();
    if (!p)
        throw new Error('DB unavailable');
    const res = await p.request()
        .input('titulo', mssql_1.default.NVarChar(255), data.titulo)
        .input('desc', mssql_1.default.NVarChar(mssql_1.default.MAX), data.descricao ?? null)
        .input('status', mssql_1.default.NVarChar(20), data.status ?? 'A_FAZER')
        .input('prio', mssql_1.default.NVarChar(10), data.prioridade ?? 'MEDIA')
        .input('resp', mssql_1.default.NVarChar(100), data.responsavel ?? null)
        .input('prazo', mssql_1.default.Date, data.prazo ?? null)
        .input('criado', mssql_1.default.NVarChar(100), data.criadoPor ?? null)
        .input('criadoId', mssql_1.default.Int, data.criadoPorId ?? null)
        .query(`INSERT INTO tasks (titulo,descricao,status,prioridade,responsavel,prazo,criado_por,criado_por_id) OUTPUT INSERTED.id
            VALUES (@titulo,@desc,@status,@prio,@resp,@prazo,@criado,@criadoId)`);
    return { id: res.recordset[0].id };
}
async function updateTask(id, data) {
    const p = await getPool();
    if (!p)
        return;
    const sets = ['updated_at = GETDATE()'];
    const req = p.request().input('id', mssql_1.default.Int, id);
    if (data.titulo !== undefined) {
        req.input('titulo', mssql_1.default.NVarChar(255), data.titulo);
        sets.push('titulo = @titulo');
    }
    if (data.descricao !== undefined) {
        req.input('desc', mssql_1.default.NVarChar(mssql_1.default.MAX), data.descricao);
        sets.push('descricao = @desc');
    }
    if (data.status !== undefined) {
        req.input('status', mssql_1.default.NVarChar(20), data.status);
        sets.push('status = @status');
    }
    if (data.prioridade !== undefined) {
        req.input('prio', mssql_1.default.NVarChar(10), data.prioridade);
        sets.push('prioridade = @prio');
    }
    if (data.responsavel !== undefined) {
        req.input('resp', mssql_1.default.NVarChar(100), data.responsavel);
        sets.push('responsavel = @resp');
    }
    if (data.prazo !== undefined) {
        req.input('prazo', mssql_1.default.Date, data.prazo);
        sets.push('prazo = @prazo');
    }
    await req.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = @id`);
    return { success: true };
}
async function deleteTask(id) {
    const p = await getPool();
    if (!p)
        return;
    await p.request().input('id', mssql_1.default.Int, id).query('DELETE FROM tasks WHERE id = @id');
    return { success: true };
}
// ─── Chat Messages ────────────────────────────────────────────────────────────
async function getChatHistory(sessionId, limit = 50) {
    return query(`SELECT TOP ${limit} id, session_id, role, content, created_at FROM chat_messages WHERE session_id = @sid ORDER BY created_at ASC`, [{ name: 'sid', type: mssql_1.default.NVarChar(64), value: sessionId }]);
}
async function saveChatMessage(sessionId, userId, role, content) {
    const p = await getPool();
    if (!p)
        return;
    await p.request()
        .input('sid', mssql_1.default.NVarChar(64), sessionId)
        .input('uid', mssql_1.default.Int, userId)
        .input('role', mssql_1.default.NVarChar(10), role)
        .input('content', mssql_1.default.NVarChar(mssql_1.default.MAX), content)
        .query('INSERT INTO chat_messages (session_id,user_id,role,content) VALUES (@sid,@uid,@role,@content)');
}
async function clearChatHistory(sessionId) {
    const p = await getPool();
    if (!p)
        return;
    await p.request().input('sid', mssql_1.default.NVarChar(64), sessionId).query('DELETE FROM chat_messages WHERE session_id = @sid');
}
async function getChatSessions(userId) {
    return query(`SELECT m.session_id,
       MIN(CASE WHEN m.role = 'user' THEN m.content ELSE NULL END) AS title,
       MAX(m.created_at) AS last_at,
       COUNT(*) AS message_count
     FROM chat_messages m
     WHERE m.session_id IN (
       SELECT DISTINCT session_id FROM chat_messages WHERE user_id = @uid
     )
     GROUP BY m.session_id
     ORDER BY MAX(m.created_at) DESC`, [{ name: 'uid', type: mssql_1.default.Int, value: userId }]);
}
async function getDashboardVendedores(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT fv.nome_vendedor AS nomeVendedor,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento,
      COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_parc) AS clientes
    FROM fato_vendas fv ${clause}
    GROUP BY fv.nome_vendedor ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
async function getDashboardSegmentos(f) {
    return getPerformanceSegmentos(f);
}
async function getDashboardTopClientes(f) {
    const { clause, inputs } = buildWhere(f);
    return query(`
    SELECT fv.cod_parc AS codParc, COALESCE(dc.razao_social, fv.RAZAOSOCIAL) AS razaoSocial,
      COALESCE(SUM(fv.valor_pendente),0) AS faturamento, COALESCE(SUM(fv.qtd_pendente_kg),0) AS volume,
      COUNT(DISTINCT fv.cod_produto) AS produtos
    FROM fato_vendas fv LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
    ${clause}
    GROUP BY fv.cod_parc, dc.razao_social, fv.RAZAOSOCIAL ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
}
// ─── Novos Projetos v2 ───────────────────────────────────────────────────────
// Fonte: fv.projeto IN ('NOVOS PROJETOS', 'TESTE INDUSTRIAL')
// Chave de projeto: cod_parc + cod_produto
// Ciclo: DATEDIFF(MONTH, primeiro_faturamento, dt_entrega) + 1
//   M1–M12 → Novo Projeto  |  M13+ → Recorrente
function buildNpWhere(f) {
    const { clause, inputs } = buildWhere({ ...f, projetos: [] });
    const extra = "fv.projeto IN ('NOVOS PROJETOS', 'TESTE INDUSTRIAL')";
    return {
        clause: clause ? `${clause} AND ${extra}` : `WHERE ${extra}`,
        inputs,
    };
}
const NP_PRIMEIROS_SQL = `WITH primeiros AS (
  SELECT cod_parc, cod_produto, MIN(dt_entrega_cliente) AS dt_primeiro
  FROM fato_vendas
  WHERE projeto IN ('NOVOS PROJETOS', 'TESTE INDUSTRIAL')
    AND dt_entrega_cliente IS NOT NULL
    AND (cod_top IS NULL OR cod_top != 1023)
    AND ([top] IS NULL OR [top] NOT LIKE '%ESTOQUE MINIM%')
  GROUP BY cod_parc, cod_produto
)`;
async function getNovoProjetosKpisV2(f, modoCard) {
    const { clause, inputs } = buildNpWhere(f);
    const dParams = [];
    if (f.dataInicio)
        dParams.push({ name: 'pDtIni', type: mssql_1.default.Date, value: f.dataInicio });
    if (f.dataFim)
        dParams.push({ name: 'pDtFim', type: mssql_1.default.Date, value: f.dataFim });
    const pIniCond = f.dataInicio ? 'AND dt_primeiro >= @pDtIni' : '';
    const pFimCond = f.dataFim ? 'AND dt_primeiro <= @pDtFim' : '';
    const pIniCondp = f.dataInicio ? 'AND p.dt_primeiro >= @pDtIni' : '';
    const pFimCondp = f.dataFim ? 'AND p.dt_primeiro <= @pDtFim' : '';
    // abertos: restringe ao dt_primeiro dentro do período; totais: restringe a M1-12
    const abertosExtra = modoCard === 'abertos' ? `${pIniCondp} ${pFimCondp}` : '';
    const m12CountCond = modoCard !== 'abertos' ? 'AND DATEDIFF(MONTH, p.dt_primeiro, fv.dt_entrega_cliente) + 1 <= 12' : '';
    const m12FatCond = modoCard === 'totais' ? 'AND DATEDIFF(MONTH, p.dt_primeiro, fv.dt_entrega_cliente) + 1 <= 12' : '';
    const activeInputs = modoCard === 'abertos' ? [...inputs, ...dParams] : inputs;
    const [r1, r2, r2b, r3] = await Promise.all([
        // projetosAbertos: pares com dt_primeiro no período
        query(`
      ${NP_PRIMEIROS_SQL}
      SELECT COUNT(*) AS total FROM primeiros
      WHERE 1=1 ${pIniCond} ${pFimCond}
    `, dParams),
        // projetosTotais: contagem respondendo ao modoCard
        query(`
      ${NP_PRIMEIROS_SQL}
      SELECT COUNT(DISTINCT CAST(fv.cod_parc AS VARCHAR(20)) + '-' + CAST(fv.cod_produto AS VARCHAR(20))) AS total
      FROM fato_vendas fv
      JOIN primeiros p ON fv.cod_parc = p.cod_parc AND fv.cod_produto = p.cod_produto
      ${clause}
      AND fv.dt_entrega_cliente IS NOT NULL
      ${m12CountCond}
      ${abertosExtra}
    `, activeInputs),
        // faturamentoTotal:
        //   default: soma direta (sem JOIN CTE) = todos os registros NP no período
        //   'totais': JOIN CTE + DATEDIFF <= 12
        //   'abertos': JOIN CTE + dt_primeiro no período
        modoCard
            ? query(`
          ${NP_PRIMEIROS_SQL}
          SELECT COALESCE(SUM(fv.valor_pendente), 0) AS faturamento
          FROM fato_vendas fv
          JOIN primeiros p ON fv.cod_parc = p.cod_parc AND fv.cod_produto = p.cod_produto
          ${clause}
          AND fv.dt_entrega_cliente IS NOT NULL
          ${m12FatCond}
          ${abertosExtra}
        `, activeInputs)
            : query(`
          SELECT COALESCE(SUM(fv.valor_pendente), 0) AS faturamento
          FROM fato_vendas fv
          ${clause}
          AND fv.dt_entrega_cliente IS NOT NULL
        `, inputs),
        query(`
      WITH primeiros AS (
        SELECT cod_parc, cod_produto, MIN(dt_entrega_cliente) AS dt_primeiro
        FROM fato_vendas
        WHERE projeto IN ('NOVOS PROJETOS', 'TESTE INDUSTRIAL')
          AND dt_entrega_cliente IS NOT NULL
          AND (cod_top IS NULL OR cod_top != 1023)
          AND ([top] IS NULL OR [top] NOT LIKE '%ESTOQUE MINIM%')
        GROUP BY cod_parc, cod_produto
      ),
      elegiveis AS (
        SELECT cod_parc, cod_produto, dt_primeiro FROM primeiros
        WHERE DATEDIFF(MONTH, dt_primeiro, GETDATE()) >= 12
      )
      SELECT
        (SELECT COUNT(*) FROM elegiveis) AS total,
        (SELECT COUNT(*)
         FROM elegiveis e
         WHERE EXISTS (
           SELECT 1 FROM fato_vendas fv
           WHERE fv.cod_parc = e.cod_parc AND fv.cod_produto = e.cod_produto
             AND fv.dt_entrega_cliente IS NOT NULL
             AND DATEDIFF(MONTH, e.dt_primeiro, fv.dt_entrega_cliente) + 1 >= 13
         )
        ) AS convertidos
    `, []),
    ]);
    const projetosAbertos = Number(r1[0]?.total ?? 0);
    const projetosTotais = Number(r2[0]?.total ?? 0);
    const faturamentoTotal = Number(r2b[0]?.faturamento ?? 0);
    const taxaConversaoTotal = Number(r3[0]?.total ?? 0);
    const taxaConversaoConvertidos = Number(r3[0]?.convertidos ?? 0);
    const taxaConversao = taxaConversaoTotal > 0 ? (taxaConversaoConvertidos / taxaConversaoTotal) * 100 : 0;
    const ticketMedio = projetosTotais > 0 ? faturamentoTotal / projetosTotais : 0;
    return {
        projetosAbertos, projetosTotais, faturamentoTotal,
        taxaConversao, taxaConversaoTotal, taxaConversaoConvertidos, ticketMedio,
    };
}
async function getNovoProjetosPorMesV2(f, modoCard) {
    const { clause, inputs } = buildNpWhere(f);
    const dParams = [];
    if (f.dataInicio)
        dParams.push({ name: 'pDtIni', type: mssql_1.default.Date, value: f.dataInicio });
    if (f.dataFim)
        dParams.push({ name: 'pDtFim', type: mssql_1.default.Date, value: f.dataFim });
    const pIniCond = f.dataInicio ? 'AND p.dt_primeiro >= @pDtIni' : '';
    const pFimCond = f.dataFim ? 'AND p.dt_primeiro <= @pDtFim' : '';
    const extraCond = modoCard === 'abertos' ? `${pIniCond} ${pFimCond}` : '';
    const allInputs = modoCard === 'abertos' ? [...inputs, ...dParams] : inputs;
    return query(`
    ${NP_PRIMEIROS_SQL}
    SELECT
      FORMAT(fv.dt_entrega_cliente, 'yyyy-MM') AS mes,
      COUNT(DISTINCT CAST(fv.cod_parc AS VARCHAR(20)) + '-' + CAST(fv.cod_produto AS VARCHAR(20))) AS projetos,
      COALESCE(SUM(fv.valor_pendente), 0) AS faturamento
    FROM fato_vendas fv
    JOIN primeiros p ON fv.cod_parc = p.cod_parc AND fv.cod_produto = p.cod_produto
    ${clause}
    AND fv.dt_entrega_cliente IS NOT NULL
    AND DATEDIFF(MONTH, p.dt_primeiro, fv.dt_entrega_cliente) + 1 <= 12
    ${extraCond}
    GROUP BY FORMAT(fv.dt_entrega_cliente, 'yyyy-MM')
    ORDER BY FORMAT(fv.dt_entrega_cliente, 'yyyy-MM')
  `, allInputs);
}
const NP_PROJETO_SELECT = `
    SELECT
      fv.cod_parc AS codParc,
      COALESCE(MAX(dc.razao_social), MAX(fv.RAZAOSOCIAL), CAST(fv.cod_parc AS NVARCHAR(20))) AS razaoSocial,
      CAST(fv.cod_produto AS VARCHAR(20)) AS codProduto,
      COALESCE(MAX(dp.nome_produto), MAX(fv.nome_produto), CAST(fv.cod_produto AS NVARCHAR(20))) AS nomeProduto,
      MAX(fv.nome_vendedor) AS nomeVendedor,
      FORMAT(MIN(p.dt_primeiro), 'yyyy-MM') AS dtPrimeiro,
      DATEDIFF(MONTH, MIN(p.dt_primeiro), GETDATE()) + 1 AS mesAtualCiclo,
      FORMAT(MAX(fv.dt_entrega_cliente), 'yyyy-MM-dd') AS ultimaCompra,
      COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volumeTotal,
      COALESCE(SUM(fv.valor_pendente), 0) AS faturamentoTotal,
      CASE WHEN DATEDIFF(MONTH, MIN(p.dt_primeiro), GETDATE()) + 1 <= 12
        THEN 'Novo Projeto' ELSE 'Recorrente' END AS status,
      CASE WHEN MAX(CASE WHEN fv.projeto = 'TESTE INDUSTRIAL' THEN 1 ELSE 0 END) = 1
        THEN 'TESTE INDUSTRIAL' ELSE 'NOVOS PROJETOS' END AS origem
    FROM fato_vendas fv
    JOIN primeiros p ON fv.cod_parc = p.cod_parc AND fv.cod_produto = p.cod_produto
    LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
    LEFT JOIN dim_produto dp ON fv.cod_produto = dp.cod_produto`;
async function getListaNovosProjetos(f, modoCard) {
    const { clause, inputs } = buildNpWhere(f);
    const dParams = [];
    if (f.dataInicio)
        dParams.push({ name: 'pDtIni', type: mssql_1.default.Date, value: f.dataInicio });
    if (f.dataFim)
        dParams.push({ name: 'pDtFim', type: mssql_1.default.Date, value: f.dataFim });
    const pIniCond = f.dataInicio ? 'AND p.dt_primeiro >= @pDtIni' : '';
    const pFimCond = f.dataFim ? 'AND p.dt_primeiro <= @pDtFim' : '';
    const extraCond = modoCard === 'abertos' ? `${pIniCond} ${pFimCond}` : '';
    const allInputs = modoCard === 'abertos' ? [...inputs, ...dParams] : inputs;
    return query(`
    ${NP_PRIMEIROS_SQL}
    ${NP_PROJETO_SELECT}
    ${clause}
    AND fv.dt_entrega_cliente IS NOT NULL
    AND DATEDIFF(MONTH, p.dt_primeiro, fv.dt_entrega_cliente) + 1 <= 12
    ${extraCond}
    GROUP BY fv.cod_parc, fv.cod_produto
    ORDER BY SUM(fv.valor_pendente) DESC
  `, allInputs);
}
async function getNovoProjetosDrilldown(mes, f) {
    const fNoDate = { ...f, dataInicio: undefined, dataFim: undefined };
    const { clause, inputs } = buildNpWhere(fNoDate);
    const allInputs = [...inputs, { name: 'npMes', type: mssql_1.default.NVarChar(7), value: mes }];
    const fullClause = `${clause} AND FORMAT(fv.dt_entrega_cliente, 'yyyy-MM') = @npMes`;
    return query(`
    ${NP_PRIMEIROS_SQL}
    ${NP_PROJETO_SELECT}
    ${fullClause}
    AND fv.dt_entrega_cliente IS NOT NULL
    AND DATEDIFF(MONTH, p.dt_primeiro, fv.dt_entrega_cliente) + 1 <= 12
    GROUP BY fv.cod_parc, fv.cod_produto
    ORDER BY SUM(fv.valor_pendente) DESC
  `, allInputs);
}
// ─── CRUD Metas 2026 ─────────────────────────────────────────────────────────
async function listMetasAdmin() {
    return query(`
    SELECT id, nome_vendedor AS nomeVendedor, mes, CAST(valor_meta AS FLOAT) AS valorMeta, projeto
    FROM metas_2026
    ORDER BY nome_vendedor, mes
  `, []);
}
async function upsertMeta(data) {
    const p = await getPool();
    if (!p)
        throw new Error('Sem conexão com o banco');
    const req = p.request()
        .input('vend', mssql_1.default.NVarChar(200), data.nomeVendedor)
        .input('mes', mssql_1.default.NVarChar(7), data.mes)
        .input('meta', mssql_1.default.Decimal(15, 2), data.valorMeta)
        .input('proj', mssql_1.default.NVarChar(100), data.projeto ?? null);
    await req.query(`
    MERGE metas_2026 AS t
    USING (SELECT @vend AS nome_vendedor, @mes AS mes, @proj AS projeto) AS s
    ON t.nome_vendedor = s.nome_vendedor AND t.mes = s.mes
       AND (t.projeto = s.projeto OR (t.projeto IS NULL AND s.projeto IS NULL))
    WHEN MATCHED THEN
      UPDATE SET valor_meta = @meta, updated_at = GETDATE()
    WHEN NOT MATCHED THEN
      INSERT (nome_vendedor, mes, valor_meta, projeto)
      VALUES (@vend, @mes, @meta, @proj);
  `);
}
async function deleteMeta(id) {
    const p = await getPool();
    if (!p)
        throw new Error('Sem conexão com o banco');
    await p.request().input('id', mssql_1.default.Int, id).query(`DELETE FROM metas_2026 WHERE id = @id`);
}
async function getMetasVendedores(f) {
    const parts = [];
    const inputs = [];
    if (f?.projetos?.length) {
        parts.push(`projeto IN (${f.projetos.map((_, i) => `@proj${i}`).join(',')})`);
        f.projetos.forEach((p, i) => inputs.push({ name: `proj${i}`, type: mssql_1.default.NVarChar(100), value: p }));
    }
    if (f?.mercados?.length) {
        parts.push(`mercado_vendas IN (${f.mercados.map((_, i) => `@merc${i}`).join(',')})`);
        f.mercados.forEach((m, i) => inputs.push({ name: `merc${i}`, type: mssql_1.default.NVarChar(100), value: m }));
    }
    if (f?.vendedores?.length) {
        parts.push(`nome_vendedor IN (${f.vendedores.map((_, i) => `@vend${i}`).join(',')})`);
        f.vendedores.forEach((v, i) => inputs.push({ name: `vend${i}`, type: mssql_1.default.NVarChar(200), value: v }));
    }
    const clause = parts.length ? 'WHERE ' + parts.join(' AND ') : '';
    return query(`
    SELECT nome_vendedor AS nomeVendedor, mes, CAST(valor_meta AS FLOAT) AS valorMeta, projeto, mercado_vendas AS mercadoVendas
    FROM metas_2026
    ${clause}
    ORDER BY nome_vendedor, mes
  `, inputs);
}
// ─── Snapshot Semanal ────────────────────────────────────────────────────────
async function createForecastSnapshot() {
    const p = await getPool();
    if (!p)
        throw new Error('Database unavailable');
    const snapshotDate = new Date().toISOString().split('T')[0];
    const result = await p.request().input('snapDate', mssql_1.default.Date, snapshotDate).query(`
    INSERT INTO forecast_snapshots
      (snapshot_date, cod_parc, razao_social, cod_produto, nome_produto, grupo_produto,
       projeto, mercado_vendas, nome_vendedor, tipo_receita, uf,
       valor_pendente, qtd_pendente_kg, dt_entrega_cliente)
    SELECT
      @snapDate,
      fv.cod_parc,
      COALESCE(dc.razao_social, fv.RAZAOSOCIAL),
      fv.cod_produto,
      COALESCE(dp.nome_produto, fv.nome_produto),
      fv.grupo_produto,
      fv.projeto,
      fv.mercado_vendas,
      fv.nome_vendedor,
      fv.tipo_receita,
      fv.uf,
      COALESCE(SUM(fv.valor_pendente), 0),
      COALESCE(SUM(fv.qtd_pendente_kg), 0),
      fv.dt_entrega_cliente
    FROM fato_vendas fv
    LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
    LEFT JOIN dim_produto  dp ON fv.cod_produto = dp.cod_produto
    WHERE (fv.cod_top IS NULL OR fv.cod_top != 1023)
      AND (fv.[top] IS NULL OR fv.[top] NOT LIKE '%ESTOQUE MINIM%')
    GROUP BY fv.cod_parc, dc.razao_social, fv.RAZAOSOCIAL, fv.cod_produto,
             dp.nome_produto, fv.nome_produto, fv.grupo_produto, fv.projeto,
             fv.mercado_vendas, fv.nome_vendedor, fv.tipo_receita, fv.uf,
             fv.dt_entrega_cliente
  `);
    return { inserted: result.rowsAffected[0] ?? 0, snapshotDate };
}
async function getSnapshotDates() {
    return query(`
    SELECT CONVERT(VARCHAR(10), snapshot_date, 23) AS snapshotDate, COUNT(*) AS totalRows
    FROM forecast_snapshots
    GROUP BY CONVERT(VARCHAR(10), snapshot_date, 23)
    ORDER BY snapshotDate DESC
  `);
}
function buildSnapshotWhere(snapshotDate, f) {
    const parts = [`CONVERT(VARCHAR(10), fs.snapshot_date, 23) = @snapDate`];
    const inputs = [{ name: 'snapDate', type: mssql_1.default.NVarChar(10), value: snapshotDate }];
    if (f.dataInicio) {
        inputs.push({ name: 'sDtIni', type: mssql_1.default.Date, value: f.dataInicio });
        parts.push('fs.dt_entrega_cliente >= @sDtIni');
    }
    if (f.dataFim) {
        inputs.push({ name: 'sDtFim', type: mssql_1.default.Date, value: f.dataFim });
        parts.push('fs.dt_entrega_cliente <= @sDtFim');
    }
    if (f.mercados?.length) {
        f.mercados.forEach((v, i) => inputs.push({ name: `smrc${i}`, type: mssql_1.default.NVarChar(100), value: v }));
        parts.push(`fs.mercado_vendas IN (${f.mercados.map((_, i) => `@smrc${i}`).join(',')})`);
    }
    if (f.vendedores?.length) {
        f.vendedores.forEach((v, i) => inputs.push({ name: `svnd${i}`, type: mssql_1.default.NVarChar(100), value: v }));
        parts.push(`fs.nome_vendedor IN (${f.vendedores.map((_, i) => `@svnd${i}`).join(',')})`);
    }
    if (f.projetos?.length) {
        f.projetos.forEach((v, i) => inputs.push({ name: `sprj${i}`, type: mssql_1.default.NVarChar(100), value: v }));
        parts.push(`fs.projeto IN (${f.projetos.map((_, i) => `@sprj${i}`).join(',')})`);
    }
    if (f.gruposProduto?.length) {
        f.gruposProduto.forEach((v, i) => inputs.push({ name: `sgrp${i}`, type: mssql_1.default.NVarChar(100), value: v }));
        parts.push(`fs.grupo_produto IN (${f.gruposProduto.map((_, i) => `@sgrp${i}`).join(',')})`);
    }
    if (f.tiposReceita?.length) {
        const tipos = f.tiposReceita.includes('VENDA_FIRME') ? [...new Set([...f.tiposReceita, 'DEVOLUCAO'])] : f.tiposReceita;
        tipos.forEach((v, i) => inputs.push({ name: `strc${i}`, type: mssql_1.default.NVarChar(50), value: v }));
        parts.push(`fs.tipo_receita IN (${tipos.map((_, i) => `@strc${i}`).join(',')})`);
    }
    return { clause: 'WHERE ' + parts.join(' AND '), inputs };
}
async function getSnapshotComparativo(f) {
    const dates = await getSnapshotDates();
    if (!dates.length)
        return { snapshotDate: null, rows: [] };
    const snapshotDate = dates[0].snapshotDate;
    const { clause: snapClause, inputs: snapInputs } = buildSnapshotWhere(snapshotDate, f);
    const { clause: currClause, inputs: currInputs } = buildWhere(f);
    const [snapRows, currRows] = await Promise.all([
        query(`
      SELECT fs.cod_parc AS codParc, MAX(fs.razao_social) AS razaoSocial,
        COALESCE(SUM(fs.valor_pendente), 0) AS valor,
        COALESCE(SUM(fs.qtd_pendente_kg), 0) AS volume,
        MIN(CONVERT(VARCHAR(10), fs.dt_entrega_cliente, 23)) AS dtEntrega
      FROM forecast_snapshots fs ${snapClause}
      GROUP BY fs.cod_parc
    `, snapInputs),
        query(`
      SELECT fv.cod_parc AS codParc,
        COALESCE(MAX(dc.razao_social), MAX(fv.RAZAOSOCIAL)) AS razaoSocial,
        COALESCE(SUM(fv.valor_pendente), 0) AS valor,
        COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volume,
        MIN(CONVERT(VARCHAR(10), fv.dt_entrega_cliente, 23)) AS dtEntrega
      FROM fato_vendas fv LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
      ${currClause}
      GROUP BY fv.cod_parc
    `, currInputs),
    ]);
    const snapMap = new Map(snapRows.map(r => [r.codParc, r]));
    const currMap = new Map(currRows.map(r => [r.codParc, r]));
    const allParc = new Set([...snapMap.keys(), ...currMap.keys()]);
    const rows = Array.from(allParc).map(codParc => {
        const s = snapMap.get(codParc);
        const c = currMap.get(codParc);
        return {
            codParc,
            razaoSocial: c?.razaoSocial ?? s?.razaoSocial ?? `Cliente ${codParc}`,
            snapValor: Number(s?.valor ?? 0),
            currValor: Number(c?.valor ?? 0),
            diffValor: Number(c?.valor ?? 0) - Number(s?.valor ?? 0),
            snapVolume: Number(s?.volume ?? 0),
            currVolume: Number(c?.volume ?? 0),
            dtEntrega: c?.dtEntrega ?? s?.dtEntrega ?? null,
        };
    }).sort((a, b) => Math.abs(b.diffValor) - Math.abs(a.diffValor));
    return { snapshotDate, rows };
}
async function getSnapshotComparativoProdutos(codParc, f) {
    const dates = await getSnapshotDates();
    if (!dates.length)
        return { snapshotDate: null, rows: [] };
    const snapshotDate = dates[0].snapshotDate;
    const { clause: snapClause, inputs: snapInputs } = buildSnapshotWhere(snapshotDate, { ...f, codParc });
    const { clause: currClause, inputs: currInputs } = buildWhere({ ...f, codParc });
    const [snapRows, currRows] = await Promise.all([
        query(`
      SELECT fs.cod_produto AS codProduto, MAX(fs.nome_produto) AS nomeProduto,
        COALESCE(SUM(fs.valor_pendente), 0) AS valor,
        COALESCE(SUM(fs.qtd_pendente_kg), 0) AS volume,
        MIN(CONVERT(VARCHAR(10), fs.dt_entrega_cliente, 23)) AS dtEntrega
      FROM forecast_snapshots fs ${snapClause}
      GROUP BY fs.cod_produto
    `, snapInputs),
        query(`
      SELECT fv.cod_produto AS codProduto,
        COALESCE(MAX(dp.nome_produto), MAX(fv.nome_produto)) AS nomeProduto,
        COALESCE(SUM(fv.valor_pendente), 0) AS valor,
        COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volume,
        MIN(CONVERT(VARCHAR(10), fv.dt_entrega_cliente, 23)) AS dtEntrega
      FROM fato_vendas fv LEFT JOIN dim_produto dp ON fv.cod_produto = dp.cod_produto
      ${currClause}
      GROUP BY fv.cod_produto
    `, currInputs),
    ]);
    const snapMap = new Map(snapRows.map(r => [r.codProduto, r]));
    const currMap = new Map(currRows.map(r => [r.codProduto, r]));
    const allProd = new Set([...snapMap.keys(), ...currMap.keys()]);
    const rows = Array.from(allProd).map(codProduto => {
        const s = snapMap.get(codProduto);
        const c = currMap.get(codProduto);
        return {
            codProduto,
            nomeProduto: c?.nomeProduto ?? s?.nomeProduto ?? `Produto ${codProduto}`,
            snapValor: Number(s?.valor ?? 0),
            currValor: Number(c?.valor ?? 0),
            diffValor: Number(c?.valor ?? 0) - Number(s?.valor ?? 0),
            snapVolume: Number(s?.volume ?? 0),
            currVolume: Number(c?.volume ?? 0),
            dtEntrega: c?.dtEntrega ?? s?.dtEntrega ?? null,
        };
    }).sort((a, b) => Math.abs(b.diffValor) - Math.abs(a.diffValor));
    return { snapshotDate, rows };
}
function buildSnapHistWhere(f) {
    const parts = [];
    const inputs = [];
    if (f.dataInicio) {
        inputs.push({ name: 'shDtIni', type: mssql_1.default.Date, value: f.dataInicio });
        parts.push('fs.dt_entrega_cliente >= @shDtIni');
    }
    if (f.dataFim) {
        inputs.push({ name: 'shDtFim', type: mssql_1.default.Date, value: f.dataFim });
        parts.push('fs.dt_entrega_cliente <= @shDtFim');
    }
    if (f.mercados?.length) {
        f.mercados.forEach((v, i) => inputs.push({ name: `shm${i}`, type: mssql_1.default.NVarChar(100), value: v }));
        parts.push(`fs.mercado_vendas IN (${f.mercados.map((_, i) => `@shm${i}`).join(',')})`);
    }
    if (f.vendedores?.length) {
        f.vendedores.forEach((v, i) => inputs.push({ name: `shv${i}`, type: mssql_1.default.NVarChar(100), value: v }));
        parts.push(`fs.nome_vendedor IN (${f.vendedores.map((_, i) => `@shv${i}`).join(',')})`);
    }
    if (f.projetos?.length) {
        f.projetos.forEach((v, i) => inputs.push({ name: `shp${i}`, type: mssql_1.default.NVarChar(100), value: v }));
        parts.push(`fs.projeto IN (${f.projetos.map((_, i) => `@shp${i}`).join(',')})`);
    }
    if (f.gruposProduto?.length) {
        f.gruposProduto.forEach((v, i) => inputs.push({ name: `shg${i}`, type: mssql_1.default.NVarChar(100), value: v }));
        parts.push(`fs.grupo_produto IN (${f.gruposProduto.map((_, i) => `@shg${i}`).join(',')})`);
    }
    if (f.tiposReceita?.length) {
        const tipos = f.tiposReceita.includes('VENDA_FIRME') ? [...new Set([...f.tiposReceita, 'DEVOLUCAO'])] : f.tiposReceita;
        tipos.forEach((v, i) => inputs.push({ name: `sht${i}`, type: mssql_1.default.NVarChar(50), value: v }));
        parts.push(`fs.tipo_receita IN (${tipos.map((_, i) => `@sht${i}`).join(',')})`);
    }
    if (f.codParc) {
        inputs.push({ name: 'shCodParc', type: mssql_1.default.Int, value: f.codParc });
        parts.push('fs.cod_parc = @shCodParc');
    }
    return { clause: parts.length ? 'WHERE ' + parts.join(' AND ') : '', inputs };
}
async function getSnapshotHistorico(f) {
    const { clause: snapClause, inputs: snapInputs } = buildSnapHistWhere(f);
    const { clause: currClause, inputs: currInputs } = buildWhere(f);
    const [snapRows, currRows] = await Promise.all([
        query(`
      SELECT fs.cod_parc AS codParc, MAX(fs.razao_social) AS razaoSocial,
        CONVERT(VARCHAR(10), fs.snapshot_date, 23) AS snapshotDate,
        COALESCE(SUM(fs.valor_pendente), 0) AS valor,
        COALESCE(SUM(fs.qtd_pendente_kg), 0) AS volume
      FROM forecast_snapshots fs ${snapClause}
      GROUP BY fs.cod_parc, fs.snapshot_date
    `, snapInputs),
        query(`
      SELECT fv.cod_parc AS codParc,
        COALESCE(MAX(dc.razao_social), MAX(fv.RAZAOSOCIAL)) AS razaoSocial,
        COALESCE(SUM(fv.valor_pendente), 0) AS valor,
        COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volume,
        MIN(CONVERT(VARCHAR(10), fv.dt_entrega_cliente, 23)) AS dtEntrega
      FROM fato_vendas fv LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
      ${currClause}
      GROUP BY fv.cod_parc
    `, currInputs),
    ]);
    const allDates = [...new Set(snapRows.map(r => r.snapshotDate))].sort();
    const snapByParc = new Map();
    for (const r of snapRows) {
        if (!snapByParc.has(r.codParc))
            snapByParc.set(r.codParc, { razao: r.razaoSocial, byDate: {} });
        const e = snapByParc.get(r.codParc);
        e.byDate[r.snapshotDate] = { valor: Number(r.valor), volume: Number(r.volume) };
        e.razao = r.razaoSocial;
    }
    const currMap = new Map(currRows.map(r => [r.codParc, r]));
    const allParc = new Set([...snapByParc.keys(), ...currMap.keys()]);
    const rows = Array.from(allParc).map(codParc => {
        const snap = snapByParc.get(codParc);
        const curr = currMap.get(codParc);
        return {
            codParc,
            razaoSocial: curr?.razaoSocial ?? snap?.razao ?? `Cliente ${codParc}`,
            snapshots: snap?.byDate ?? {},
            currValor: Number(curr?.valor ?? 0),
            currVolume: Number(curr?.volume ?? 0),
            dtEntrega: curr?.dtEntrega ?? null,
        };
    }).sort((a, b) => b.currValor - a.currValor);
    return { dates: allDates, rows };
}
async function getSnapshotHistoricoProdutos(codParc, f) {
    const { clause: snapClause, inputs: snapInputs } = buildSnapHistWhere({ ...f, codParc });
    const { clause: currClause, inputs: currInputs } = buildWhere({ ...f, codParc });
    const [snapRows, currRows] = await Promise.all([
        query(`
      SELECT fs.cod_produto AS codProduto, MAX(fs.nome_produto) AS nomeProduto,
        CONVERT(VARCHAR(10), fs.snapshot_date, 23) AS snapshotDate,
        COALESCE(SUM(fs.valor_pendente), 0) AS valor,
        COALESCE(SUM(fs.qtd_pendente_kg), 0) AS volume
      FROM forecast_snapshots fs ${snapClause}
      GROUP BY fs.cod_produto, fs.snapshot_date
    `, snapInputs),
        query(`
      SELECT fv.cod_produto AS codProduto,
        COALESCE(MAX(dp.nome_produto), MAX(fv.nome_produto)) AS nomeProduto,
        COALESCE(SUM(fv.valor_pendente), 0) AS valor,
        COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volume,
        MIN(CONVERT(VARCHAR(10), fv.dt_entrega_cliente, 23)) AS dtEntrega
      FROM fato_vendas fv LEFT JOIN dim_produto dp ON fv.cod_produto = dp.cod_produto
      ${currClause}
      GROUP BY fv.cod_produto
    `, currInputs),
    ]);
    const allDates = [...new Set(snapRows.map(r => r.snapshotDate))].sort();
    const snapByProd = new Map();
    for (const r of snapRows) {
        if (!snapByProd.has(r.codProduto))
            snapByProd.set(r.codProduto, { nome: r.nomeProduto, byDate: {} });
        snapByProd.get(r.codProduto).byDate[r.snapshotDate] = { valor: Number(r.valor), volume: Number(r.volume) };
    }
    const currMap = new Map(currRows.map(r => [r.codProduto, r]));
    const allProd = new Set([...snapByProd.keys(), ...currMap.keys()]);
    const rows = Array.from(allProd).map(codProduto => {
        const snap = snapByProd.get(codProduto);
        const curr = currMap.get(codProduto);
        return {
            codProduto,
            nomeProduto: curr?.nomeProduto ?? snap?.nome ?? `Produto ${codProduto}`,
            snapshots: snap?.byDate ?? {},
            currValor: Number(curr?.valor ?? 0),
            currVolume: Number(curr?.volume ?? 0),
            dtEntrega: curr?.dtEntrega ?? null,
        };
    }).sort((a, b) => b.currValor - a.currValor);
    return { dates: allDates, rows };
}
function buildHistoricoWhere(f, alias = 'fv') {
    const parts = [
        `${alias}.tipo_receita IN ('VENDA_FIRME', 'DEVOLUCAO')`,
        `(${alias}.cod_top IS NULL OR ${alias}.cod_top != 1023)`,
        `(${alias}.[top] IS NULL OR ${alias}.[top] NOT LIKE '%ESTOQUE MINIM%')`,
        `${alias}.dt_entrega_cliente IS NOT NULL`,
    ];
    const inputs = [];
    const anos = f.anos?.length ? f.anos : [new Date().getFullYear()];
    if (anos.length === 1) {
        inputs.push({ name: 'hAno0', type: mssql_1.default.Int, value: anos[0] });
        parts.push(`YEAR(${alias}.dt_entrega_cliente) = @hAno0`);
    }
    else {
        const ps = anos.map((a, i) => { inputs.push({ name: `hAno${i}`, type: mssql_1.default.Int, value: a }); return `@hAno${i}`; });
        parts.push(`YEAR(${alias}.dt_entrega_cliente) IN (${ps.join(',')})`);
    }
    if (f.meses?.length) {
        if (f.meses.length === 1) {
            inputs.push({ name: 'hMes0', type: mssql_1.default.Int, value: f.meses[0] });
            parts.push(`MONTH(${alias}.dt_entrega_cliente) = @hMes0`);
        }
        else {
            const ps = f.meses.map((m, i) => { inputs.push({ name: `hMes${i}`, type: mssql_1.default.Int, value: m }); return `@hMes${i}`; });
            parts.push(`MONTH(${alias}.dt_entrega_cliente) IN (${ps.join(',')})`);
        }
    }
    if (f.codParcs?.length) {
        if (f.codParcs.length === 1) {
            inputs.push({ name: 'hParc0', type: mssql_1.default.Int, value: f.codParcs[0] });
            parts.push(`${alias}.cod_parc = @hParc0`);
        }
        else {
            const ps = f.codParcs.map((c, i) => { inputs.push({ name: `hParc${i}`, type: mssql_1.default.Int, value: c }); return `@hParc${i}`; });
            parts.push(`${alias}.cod_parc IN (${ps.join(',')})`);
        }
    }
    const addIn = (col, vals, prefix) => {
        if (!vals?.length)
            return;
        const params = vals.map((v, i) => {
            inputs.push({ name: `${prefix}${i}`, type: mssql_1.default.NVarChar(100), value: v });
            return `@${prefix}${i}`;
        });
        parts.push(`${alias}.${col} IN (${params.join(',')})`);
    };
    addIn('mercado_vendas', f.mercados ?? [], 'hMrc');
    addIn('grupo_produto', f.gruposProduto ?? [], 'hGrp');
    addIn('nome_vendedor', f.vendedores ?? [], 'hVnd');
    addIn('uf', f.ufs ?? [], 'hUf');
    addIn('cod_produto', f.codProdutos ?? [], 'hPrd');
    return { clause: 'WHERE ' + parts.join(' AND '), inputs };
}
async function getHistoricoFiltros() {
    const [anos, clientes, mercados, grupos, vendedores] = await Promise.all([
        query(`
      SELECT DISTINCT YEAR(dt_entrega_cliente) AS ano FROM fato_vendas
      WHERE dt_entrega_cliente IS NOT NULL AND tipo_receita IN ('VENDA_FIRME','DEVOLUCAO')
        AND (cod_top IS NULL OR cod_top != 1023) AND ([top] IS NULL OR [top] NOT LIKE '%ESTOQUE MINIM%')
      ORDER BY ano DESC
    `),
        query(`
      SELECT fv.cod_parc AS codParc, COALESCE(MAX(dc.razao_social), MAX(fv.RAZAOSOCIAL)) AS razaoSocial
      FROM fato_vendas fv LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
      WHERE fv.tipo_receita IN ('VENDA_FIRME','DEVOLUCAO')
        AND (fv.cod_top IS NULL OR fv.cod_top != 1023) AND (fv.[top] IS NULL OR fv.[top] NOT LIKE '%ESTOQUE MINIM%')
      GROUP BY fv.cod_parc ORDER BY razaoSocial
    `),
        query(`
      SELECT DISTINCT mercado_vendas AS mercado FROM fato_vendas
      WHERE mercado_vendas IS NOT NULL AND tipo_receita IN ('VENDA_FIRME','DEVOLUCAO')
        AND (cod_top IS NULL OR cod_top != 1023) AND ([top] IS NULL OR [top] NOT LIKE '%ESTOQUE MINIM%')
      ORDER BY mercado
    `),
        query(`
      SELECT DISTINCT grupo_produto AS grupo FROM fato_vendas
      WHERE grupo_produto IS NOT NULL AND tipo_receita IN ('VENDA_FIRME','DEVOLUCAO')
        AND (cod_top IS NULL OR cod_top != 1023) AND ([top] IS NULL OR [top] NOT LIKE '%ESTOQUE MINIM%')
      ORDER BY grupo
    `),
        query(`
      SELECT DISTINCT nome_vendedor AS vendedor FROM fato_vendas
      WHERE nome_vendedor IS NOT NULL AND tipo_receita IN ('VENDA_FIRME','DEVOLUCAO')
        AND (cod_top IS NULL OR cod_top != 1023) AND ([top] IS NULL OR [top] NOT LIKE '%ESTOQUE MINIM%')
      ORDER BY vendedor
    `),
    ]);
    return {
        anos: anos.map(r => r.ano),
        clientes,
        mercados: mercados.map(r => r.mercado),
        gruposProduto: grupos.map(r => r.grupo),
        vendedores: vendedores.map(r => r.vendedor),
    };
}
async function getHistoricoKpis(f) {
    const { clause, inputs } = buildHistoricoWhere(f);
    const baseF = { anos: f.anos, meses: f.meses, mercados: f.mercados, gruposProduto: f.gruposProduto, vendedores: f.vendedores };
    const { clause: baseClause, inputs: baseInputs } = buildHistoricoWhere(baseF);
    const [main, base] = await Promise.all([
        query(`
      SELECT
        COALESCE(SUM(fv.valor_pendente), 0) AS totalValor,
        COALESCE(SUM(fv.qtd_pendente_kg), 0) AS totalVolume,
        CASE WHEN COALESCE(SUM(fv.qtd_pendente_kg), 0) > 0
          THEN SUM(fv.valor_pendente) / SUM(fv.qtd_pendente_kg) ELSE 0 END AS precoMedio,
        COUNT(DISTINCT fv.cod_produto) AS qtdProdutos,
        COUNT(DISTINCT fv.cod_parc) AS qtdClientes
      FROM fato_vendas fv ${clause}
    `, inputs),
        query(`
      SELECT COALESCE(SUM(fv.valor_pendente), 0) AS totalValor, COALESCE(SUM(fv.qtd_pendente_kg), 0) AS totalVolume
      FROM fato_vendas fv ${baseClause}
    `, baseInputs),
    ]);
    const r = main[0] ?? {};
    const b = base[0] ?? {};
    const totalValor = Number(r.totalValor ?? 0);
    const baseValor = Number(b.totalValor ?? 0);
    const totalVolume = Number(r.totalVolume ?? 0);
    const baseVolume = Number(b.totalVolume ?? 0);
    return {
        totalValor,
        totalVolume,
        precoMedio: Number(r.precoMedio ?? 0),
        qtdProdutos: Number(r.qtdProdutos ?? 0),
        qtdClientes: Number(r.qtdClientes ?? 0),
        pctFaturamento: baseValor > 0 ? (totalValor / baseValor) * 100 : 100,
        pctVolume: baseVolume > 0 ? (totalVolume / baseVolume) * 100 : 100,
    };
}
async function getHistoricoListaClientes(f) {
    const { clause, inputs } = buildHistoricoWhere(f);
    const rows = await query(`
    SELECT
      fv.cod_parc AS codParc,
      COALESCE(MAX(dc.razao_social), MAX(fv.RAZAOSOCIAL)) AS razaoSocial,
      COALESCE(SUM(fv.valor_pendente), 0) AS valor,
      COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volume,
      CASE WHEN COALESCE(SUM(fv.qtd_pendente_kg), 0) > 0
        THEN SUM(fv.valor_pendente) / SUM(fv.qtd_pendente_kg) ELSE 0 END AS precoMedio,
      COUNT(DISTINCT fv.cod_produto) AS qtdProdutos
    FROM fato_vendas fv LEFT JOIN dim_cliente dc ON fv.cod_parc = dc.cod_parc
    ${clause}
    GROUP BY fv.cod_parc ORDER BY SUM(fv.valor_pendente) DESC
  `, inputs);
    const totalValor = rows.reduce((s, r) => s + Number(r.valor), 0);
    const totalVolume = rows.reduce((s, r) => s + Number(r.volume), 0);
    return rows.map(r => ({
        codParc: r.codParc,
        razaoSocial: r.razaoSocial,
        valor: Number(r.valor),
        volume: Number(r.volume),
        precoMedio: Number(r.precoMedio),
        qtdProdutos: Number(r.qtdProdutos),
        pctValor: totalValor > 0 ? (Number(r.valor) / totalValor) * 100 : 0,
        pctVolume: totalVolume > 0 ? (Number(r.volume) / totalVolume) * 100 : 0,
    }));
}
async function getHistoricoEvolucaoMensal(f) {
    const { clause, inputs } = buildHistoricoWhere(f);
    return query(`
    SELECT
      MONTH(fv.dt_entrega_cliente) AS mes,
      COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volume,
      CASE WHEN COALESCE(SUM(fv.qtd_pendente_kg), 0) > 0
        THEN SUM(fv.valor_pendente) / SUM(fv.qtd_pendente_kg) ELSE 0 END AS precoMedio,
      COALESCE(SUM(fv.valor_pendente), 0) AS valor
    FROM fato_vendas fv ${clause}
    GROUP BY MONTH(fv.dt_entrega_cliente) ORDER BY mes
  `, inputs);
}
async function getHistoricoTopProdutos(f) {
    const { clause, inputs } = buildHistoricoWhere(f);
    return query(`
    SELECT TOP 15
      fv.cod_produto AS codProduto,
      COALESCE(MAX(dp.nome_produto), MAX(fv.nome_produto), CAST(fv.cod_produto AS NVARCHAR(20))) AS nomeProduto,
      COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volume,
      COALESCE(SUM(fv.valor_pendente), 0) AS valor
    FROM fato_vendas fv LEFT JOIN dim_produto dp ON fv.cod_produto = dp.cod_produto
    ${clause}
    GROUP BY fv.cod_produto ORDER BY volume DESC
  `, inputs);
}
async function getHistoricoPorEstado(f) {
    const { clause, inputs } = buildHistoricoWhere(f);
    const rows = await query(`
    SELECT fv.uf, COALESCE(SUM(fv.valor_pendente), 0) AS valor, COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volume
    FROM fato_vendas fv ${clause}
    GROUP BY fv.uf ORDER BY valor DESC
  `, inputs);
    const filtered = rows.filter(r => r.uf);
    const total = filtered.reduce((s, r) => s + Number(r.valor), 0);
    return filtered.map(r => ({ uf: r.uf, valor: Number(r.valor), volume: Number(r.volume), pct: total > 0 ? (Number(r.valor) / total) * 100 : 0 }));
}
async function getHistoricoPorSegmento(f) {
    const { clause, inputs } = buildHistoricoWhere(f);
    const rows = await query(`
    SELECT fv.grupo_produto AS segmento, COALESCE(SUM(fv.valor_pendente), 0) AS valor, COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volume
    FROM fato_vendas fv ${clause}
    GROUP BY fv.grupo_produto ORDER BY valor DESC
  `, inputs);
    const filtered = rows.filter(r => r.segmento);
    const total = filtered.reduce((s, r) => s + Number(r.valor), 0);
    return filtered.map(r => ({ segmento: r.segmento, valor: Number(r.valor), volume: Number(r.volume), pct: total > 0 ? (Number(r.valor) / total) * 100 : 0 }));
}
async function getHistoricoClienteProdutos(f) {
    const { clause, inputs } = buildHistoricoWhere(f);
    const rows = await query(`
    SELECT
      fv.cod_produto AS codProduto,
      COALESCE(MAX(dp.nome_produto), MAX(fv.nome_produto), CAST(fv.cod_produto AS NVARCHAR(20))) AS nomeProduto,
      COALESCE(SUM(fv.qtd_pendente_kg), 0) AS volume,
      COALESCE(SUM(fv.valor_pendente), 0) AS valor,
      CASE WHEN COALESCE(SUM(fv.qtd_pendente_kg), 0) > 0
        THEN COALESCE(SUM(fv.valor_pendente), 0) / SUM(fv.qtd_pendente_kg)
        ELSE 0 END AS precoMedio,
      MAX(fv.dt_entrega_cliente) AS dtUltimaCompra
    FROM fato_vendas fv
    LEFT JOIN dim_produto dp ON fv.cod_produto = dp.cod_produto
    ${clause}
    GROUP BY fv.cod_produto
    ORDER BY volume DESC
  `, inputs);
    return rows.map(r => ({
        codProduto: r.codProduto,
        nomeProduto: r.nomeProduto || r.codProduto,
        volume: Number(r.volume),
        valor: Number(r.valor),
        precoMedio: Number(r.precoMedio),
        dtUltimaCompra: r.dtUltimaCompra ? new Date(r.dtUltimaCompra).toISOString() : null,
    }));
}
