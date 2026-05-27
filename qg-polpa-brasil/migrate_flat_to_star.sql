-- ============================================================
-- QG Polpa Brasil - Migração: tabela plana → star schema
-- Execute este script no banco FaturamentoComercial
-- Onde já existe: dbo.[fato-vendas] com os dados importados
-- ============================================================
USE FaturamentoComercial;
GO

-- 1. Criar tabelas normalizadas (se não existirem)
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(255) NOT NULL,
    email       NVARCHAR(320) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role        NVARCHAR(20) NOT NULL DEFAULT 'VENDEDOR' CHECK (role IN ('ADMIN','VENDEDOR')),
    ativo       BIT NOT NULL DEFAULT 1,
    must_change_password BIT NOT NULL DEFAULT 1,
    created_at  DATETIME2 DEFAULT GETDATE(),
    updated_at  DATETIME2 DEFAULT GETDATE(),
    last_signed_in DATETIME2 NULL
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'dim_cliente')
CREATE TABLE dim_cliente (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    cod_parc        INT NOT NULL UNIQUE,
    razao_social    NVARCHAR(255) NOT NULL,
    perfil_parceiro NVARCHAR(100),
    cidade          NVARCHAR(100),
    uf              NVARCHAR(2),
    pais            NVARCHAR(100),
    tippessoa       NVARCHAR(50)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'dim_produto')
CREATE TABLE dim_produto (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    cod_produto     BIGINT NOT NULL UNIQUE,
    nome_produto    NVARCHAR(255) NOT NULL,
    grupo_produto   NVARCHAR(100),
    ncm             NVARCHAR(20),
    descricao       NVARCHAR(255),
    descricao_sabor NVARCHAR(255),
    formato_produto NVARCHAR(255)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'dim_vendedor')
CREATE TABLE dim_vendedor (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    nome_vendedor   NVARCHAR(100) NOT NULL UNIQUE
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'fato_vendas')
CREATE TABLE fato_vendas (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    upload_id               INT NULL,
    nro_unico               BIGINT NOT NULL,
    nro_nota                BIGINT NULL,
    tipmov                  NVARCHAR(1) NOT NULL CHECK (tipmov IN ('V','D','P')),
    tipo_receita            NVARCHAR(20) NOT NULL CHECK (tipo_receita IN ('VENDA_FIRME','FORECAST','NOVO_PROJETO','DEVOLUCAO')),
    dt_neg                  DATE NULL,
    dt_prev_entrega_embarque DATE NULL,
    dt_entrega_cliente      DATE NULL,
    dt_embarque_original    DATE NULL,
    dt_mov                  DATE NULL,
    cod_parc                INT NOT NULL,
    cod_produto             BIGINT NOT NULL,
    nome_vendedor           NVARCHAR(100) NULL,
    cod_top                 INT NULL,
    [top]                   NVARCHAR(150) NULL,
    projeto                 NVARCHAR(100) NULL,
    mercado_vendas          NVARCHAR(100) NULL,
    grupo_produto           NVARCHAR(100) NULL,
    perfil_parceiro         NVARCHAR(100) NULL,
    uf                      NVARCHAR(2) NULL,
    qtd_negociada           DECIMAL(15,3) NULL,
    qtd_pendente_kg         DECIMAL(15,3) NULL,
    valor_pendente          DECIMAL(15,2) NULL,
    valor_icms              DECIMAL(15,2) NULL,
    valor_pis               DECIMAL(15,2) NULL,
    valor_cofins            DECIMAL(15,2) NULL,
    vlr_st                  DECIMAL(15,2) NULL,
    perc_desc_bonificado    DECIMAL(5,2) NULL,
    flag_devolucao          BIT NOT NULL DEFAULT 0,
    created_at              DATETIME2 DEFAULT GETDATE()
);

-- Índices de performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_fv_cod_parc')
    CREATE INDEX idx_fv_cod_parc ON fato_vendas(cod_parc);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_fv_cod_produto')
    CREATE INDEX idx_fv_cod_produto ON fato_vendas(cod_produto);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_fv_vendedor')
    CREATE INDEX idx_fv_vendedor ON fato_vendas(nome_vendedor);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_fv_dt_prev')
    CREATE INDEX idx_fv_dt_prev ON fato_vendas(dt_prev_entrega_embarque);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_fv_tipo_receita')
    CREATE INDEX idx_fv_tipo_receita ON fato_vendas(tipo_receita);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_fv_mercado')
    CREATE INDEX idx_fv_mercado ON fato_vendas(mercado_vendas);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_fv_projeto')
    CREATE INDEX idx_fv_projeto ON fato_vendas(projeto);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orcamento_2026')
CREATE TABLE orcamento_2026 (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    grupo_produto           NVARCHAR(100),
    mercado_vendas          NVARCHAR(100),
    cod_parc                INT NULL,
    razao_social            NVARCHAR(255) NULL,
    cod_produto             BIGINT NULL,
    nome_produto            NVARCHAR(255) NULL,
    cod_top                 INT NULL,
    [top]                   NVARCHAR(150) NULL,
    projeto                 NVARCHAR(100) NULL,
    dt_prev_entrega_embarque DATE NULL,
    qtd_negociada           DECIMAL(15,3) NULL,
    qtd_pendente            DECIMAL(15,3) NULL,
    qtd_pendente_kg         DECIMAL(15,3) NULL,
    valor_pendente          DECIMAL(15,2) NULL,
    uf                      NVARCHAR(2) NULL,
    cidade                  NVARCHAR(100) NULL,
    created_at              DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'uploads')
CREATE TABLE uploads (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    nome_arquivo            NVARCHAR(255) NOT NULL,
    status                  NVARCHAR(20) NOT NULL DEFAULT 'processando' CHECK (status IN ('processando','concluido','erro')),
    total_registros         INT DEFAULT 0,
    registros_importados    INT DEFAULT 0,
    registros_erro          INT DEFAULT 0,
    erro_mensagem           NVARCHAR(MAX) NULL,
    uploaded_by             INT NULL,
    created_at              DATETIME2 DEFAULT GETDATE(),
    updated_at              DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'insights')
CREATE TABLE insights (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    tipo_insight        NVARCHAR(50) NOT NULL,
    cod_parc            INT NULL,
    nome_cliente        NVARCHAR(255) NULL,
    nome_vendedor       NVARCHAR(100) NULL,
    cod_produto         BIGINT NULL,
    nome_produto        NVARCHAR(255) NULL,
    segmento            NVARCHAR(100) NULL,
    descricao           NVARCHAR(MAX) NOT NULL,
    impacto_estimado_r  DECIMAL(15,2) NULL,
    impacto_estimado_kg DECIMAL(15,3) NULL,
    prioridade          NVARCHAR(10) DEFAULT 'MEDIA' CHECK (prioridade IN ('ALTA','MEDIA','BAIXA')),
    status              NVARCHAR(20) DEFAULT 'ABERTO' CHECK (status IN ('ABERTO','EM_ANDAMENTO','CONCLUIDO','DESCARTADO')),
    gerado_em           DATETIME2 DEFAULT GETDATE(),
    updated_at          DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tasks')
CREATE TABLE tasks (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    titulo      NVARCHAR(255) NOT NULL,
    descricao   NVARCHAR(MAX) NULL,
    status      NVARCHAR(20) NOT NULL DEFAULT 'A_FAZER' CHECK (status IN ('A_FAZER','EM_ANDAMENTO','CONCLUIDA','CANCELADA')),
    prioridade  NVARCHAR(10) NOT NULL DEFAULT 'MEDIA' CHECK (prioridade IN ('BAIXA','MEDIA','ALTA','URGENTE')),
    responsavel NVARCHAR(100) NULL,
    prazo       DATE NULL,
    criado_por  NVARCHAR(100) NULL,
    criado_por_id INT NULL,
    created_at  DATETIME2 DEFAULT GETDATE(),
    updated_at  DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'chat_messages')
CREATE TABLE chat_messages (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    session_id  NVARCHAR(64) NOT NULL,
    user_id     INT NULL,
    role        NVARCHAR(10) NOT NULL CHECK (role IN ('user','assistant')),
    content     NVARCHAR(MAX) NOT NULL,
    created_at  DATETIME2 DEFAULT GETDATE()
);

-- 2. Popular dimensões a partir de dbo.[fato-vendas]
-- ============================================================

-- dim_cliente
MERGE dim_cliente AS target
USING (
    SELECT DISTINCT
        CAST(CODPARC AS INT)        AS cod_parc,
        MAX(RAZAOSOCIAL)            AS razao_social,
        MAX(PERFILPARC)             AS perfil_parceiro,
        MAX(NOMECID)                AS cidade,
        MAX(UF)                     AS uf,
        MAX(DESCRICAO)              AS pais,
        MAX(TIPPESSOA)              AS tippessoa
    FROM dbo.[fato-vendas]
    WHERE CODPARC IS NOT NULL AND CODPARC > 0
    GROUP BY CAST(CODPARC AS INT)
) AS source
ON target.cod_parc = source.cod_parc
WHEN NOT MATCHED THEN
    INSERT (cod_parc, razao_social, perfil_parceiro, cidade, uf, pais, tippessoa)
    VALUES (source.cod_parc, source.razao_social, source.perfil_parceiro, source.cidade, source.uf, source.pais, source.tippessoa)
WHEN MATCHED THEN
    UPDATE SET
        razao_social    = source.razao_social,
        perfil_parceiro = source.perfil_parceiro,
        cidade          = source.cidade,
        uf              = source.uf,
        tippessoa       = source.tippessoa;

-- dim_produto
MERGE dim_produto AS target
USING (
    SELECT DISTINCT
        CAST(REFERENCIA AS BIGINT)  AS cod_produto,
        MAX(DESCRPROD)              AS nome_produto,
        MAX(DESCRGRUPOPROD)         AS grupo_produto,
        MAX(NCM)                    AS ncm,
        MAX(DESCRICAO_SABOR)        AS descricao_sabor,
        MAX(FORMATO_PRODUTO)        AS formato_produto
    FROM dbo.[fato-vendas]
    WHERE REFERENCIA IS NOT NULL AND REFERENCIA > 0
    GROUP BY CAST(REFERENCIA AS BIGINT)
) AS source
ON target.cod_produto = source.cod_produto
WHEN NOT MATCHED THEN
    INSERT (cod_produto, nome_produto, grupo_produto, ncm, descricao_sabor, formato_produto)
    VALUES (source.cod_produto, source.nome_produto, source.grupo_produto, source.ncm, source.descricao_sabor, source.formato_produto)
WHEN MATCHED THEN
    UPDATE SET
        nome_produto    = source.nome_produto,
        grupo_produto   = source.grupo_produto;

-- dim_vendedor (usa VENDEDOR; fallback para REPRESENTANTE se vazio)
MERGE dim_vendedor AS target
USING (
    SELECT DISTINCT
        COALESCE(NULLIF(LTRIM(RTRIM(VENDEDOR)),''), NULLIF(LTRIM(RTRIM(REPRESENTANTE)),''), 'SEM VENDEDOR') AS nome_vendedor
    FROM dbo.[fato-vendas]
    WHERE COALESCE(NULLIF(LTRIM(RTRIM(VENDEDOR)),''), NULLIF(LTRIM(RTRIM(REPRESENTANTE)),'')) IS NOT NULL
) AS source
ON target.nome_vendedor = source.nome_vendedor
WHEN NOT MATCHED THEN
    INSERT (nome_vendedor) VALUES (source.nome_vendedor);

-- 3. Popular fato_vendas
-- ============================================================

-- Limpar antes de repopular (seguro para migração inicial)
TRUNCATE TABLE fato_vendas;

INSERT INTO fato_vendas (
    nro_unico, nro_nota, tipmov, tipo_receita,
    dt_neg, dt_prev_entrega_embarque, dt_entrega_cliente, dt_embarque_original, dt_mov,
    cod_parc, cod_produto, nome_vendedor,
    cod_top, [top], projeto, mercado_vendas, grupo_produto, perfil_parceiro, uf,
    qtd_negociada, qtd_pendente_kg, valor_pendente,
    valor_icms, valor_pis, valor_cofins, vlr_st, perc_desc_bonificado,
    flag_devolucao
)
SELECT
    CAST(NUNOTA AS BIGINT)                          AS nro_unico,
    TRY_CAST(NUMNOTA AS BIGINT)                     AS nro_nota,
    -- tipmov: normalizar para V/D/P
    CASE
        WHEN UPPER(LTRIM(RTRIM(TIPMOV))) = 'D' THEN 'D'
        WHEN UPPER(LTRIM(RTRIM(TIPMOV))) = 'P' THEN 'P'
        ELSE 'V'
    END                                             AS tipmov,
    -- tipo_receita: classificar baseado em TIPMOV e DESCROPER
    CASE
        WHEN UPPER(LTRIM(RTRIM(TIPMOV))) = 'D' THEN 'DEVOLUCAO'
        WHEN UPPER(DESCROPER) LIKE '%NOVO PROJETO%' OR UPPER(PROJETO) LIKE '%NOVO%' THEN 'NOVO_PROJETO'
        WHEN UPPER(LTRIM(RTRIM(TIPMOV))) = 'P' THEN 'FORECAST'
        ELSE 'VENDA_FIRME'
    END                                             AS tipo_receita,
    TRY_CAST(DTNEG AS DATE)                         AS dt_neg,
    TRY_CAST(DTPREVENT AS DATE)                     AS dt_prev_entrega_embarque,
    TRY_CAST(AD_DTENTREGAREAL AS DATE)              AS dt_entrega_cliente,
    TRY_CAST(AD_DT_ORIGINAL AS DATE)                AS dt_embarque_original,
    TRY_CAST(DTMOV AS DATE)                         AS dt_mov,
    CAST(CODPARC AS INT)                            AS cod_parc,
    CAST(REFERENCIA AS BIGINT)                      AS cod_produto,
    COALESCE(NULLIF(LTRIM(RTRIM(VENDEDOR)),''), NULLIF(LTRIM(RTRIM(REPRESENTANTE)),'')) AS nome_vendedor,
    TRY_CAST(CODTIPOPER AS INT)                     AS cod_top,
    LTRIM(RTRIM(DESCROPER))                         AS [top],
    LTRIM(RTRIM(PROJETO))                           AS projeto,
    LTRIM(RTRIM(AD_MERCADO_VENDAS))                 AS mercado_vendas,
    LTRIM(RTRIM(DESCRGRUPOPROD))                    AS grupo_produto,
    LTRIM(RTRIM(PERFILPARC))                        AS perfil_parceiro,
    LTRIM(RTRIM(UF))                                AS uf,
    TRY_CAST(QTDNEG AS DECIMAL(15,3))               AS qtd_negociada,
    TRY_CAST(QTDPENDENTE AS DECIMAL(15,3))          AS qtd_pendente_kg,
    TRY_CAST(ValorPendente AS DECIMAL(15,2))        AS valor_pendente,
    TRY_CAST(VLRICMS AS DECIMAL(15,2))              AS valor_icms,
    TRY_CAST(VLR_PIS AS DECIMAL(15,2))              AS valor_pis,
    TRY_CAST(VLR_COFINS AS DECIMAL(15,2))           AS valor_cofins,
    TRY_CAST(VLR_ST AS DECIMAL(15,2))               AS vlr_st,
    TRY_CAST(PERCDESCBONIF AS DECIMAL(5,2))         AS perc_desc_bonificado,
    CASE WHEN UPPER(LTRIM(RTRIM(TIPMOV))) = 'D' THEN 1 ELSE 0 END AS flag_devolucao
FROM dbo.[fato-vendas]
WHERE CODPARC IS NOT NULL AND CODPARC > 0
  AND REFERENCIA IS NOT NULL AND REFERENCIA > 0
  AND NUNOTA IS NOT NULL;

-- 4. Verificação de contagem
-- ============================================================
SELECT 'dim_cliente'   AS tabela, COUNT(*) AS registros FROM dim_cliente
UNION ALL
SELECT 'dim_produto'   AS tabela, COUNT(*) AS registros FROM dim_produto
UNION ALL
SELECT 'dim_vendedor'  AS tabela, COUNT(*) AS registros FROM dim_vendedor
UNION ALL
SELECT 'fato_vendas'   AS tabela, COUNT(*) AS registros FROM fato_vendas;

PRINT 'Migração concluída com sucesso!';
