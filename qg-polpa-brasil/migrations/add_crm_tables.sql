-- Migração: Criação das tabelas CRM (Bitrix24) no SQL Server
-- Banco: PolpaBrasil
-- Todas as tabelas usam prefixo crm_ para não colidir com as existentes.
-- Executar uma vez. Idempotente (IF NOT EXISTS).

USE PolpaBrasil;
GO

-- Pipelines (Funis de venda)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='crm_pipelines' AND xtype='U')
CREATE TABLE crm_pipelines (
    id   INT          NOT NULL,
    name NVARCHAR(255) NULL,
    CONSTRAINT PK_crm_pipelines PRIMARY KEY (id)
);
GO

-- Etapas dos funis
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='crm_deal_stages' AND xtype='U')
CREATE TABLE crm_deal_stages (
    status_id   NVARCHAR(50)  NOT NULL,
    pipeline_id INT           NULL,
    name        NVARCHAR(255) NULL,
    semantic    NVARCHAR(10)  NULL,
    CONSTRAINT PK_crm_deal_stages PRIMARY KEY (status_id)
);
GO

-- Usuários do Bitrix24 (vendedores, gestores)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='crm_users' AND xtype='U')
CREATE TABLE crm_users (
    id        INT           NOT NULL,
    name      NVARCHAR(255) NULL,
    last_name NVARCHAR(255) NULL,
    email     NVARCHAR(255) NULL,
    active    INT           NULL,
    CONSTRAINT PK_crm_users PRIMARY KEY (id)
);
GO

-- Negócios / Oportunidades
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='crm_deals' AND xtype='U')
CREATE TABLE crm_deals (
    id                      INT           NOT NULL,
    title                   NVARCHAR(MAX) NULL,
    stage_id                NVARCHAR(50)  NULL,
    stage_semantic_id       NVARCHAR(10)  NULL,  -- P=andamento S=ganho F=perdido
    category_id             NVARCHAR(50)  NULL,  -- pipeline (0/NULL=Comercial)
    pipeline_id             NVARCHAR(50)  NULL,
    type_id                 NVARCHAR(50)  NULL,
    is_new                  INT           NULL,
    is_recurring            INT           NULL,
    is_return_customer      INT           NULL,
    is_repeated_approach    INT           NULL,
    opened                  INT           NULL,
    currency_id             NVARCHAR(10)  NULL,
    opportunity             FLOAT         NULL,
    is_manual_opportunity   INT           NULL,
    tax_value               FLOAT         NULL,
    probability             INT           NULL,
    assigned_by_id          INT           NULL,
    created_by_id           INT           NULL,
    modify_by_id            INT           NULL,
    contact_id              INT           NULL,
    company_id              INT           NULL,
    lead_id                 INT           NULL,
    quote_id                INT           NULL,
    date_create             NVARCHAR(50)  NULL,
    date_modify             NVARCHAR(50)  NULL,
    begindate               NVARCHAR(50)  NULL,
    closedate               NVARCHAR(50)  NULL,
    moved_time              NVARCHAR(50)  NULL,
    last_activity_time      NVARCHAR(50)  NULL,
    last_communication_time NVARCHAR(50)  NULL,
    last_activity_by        INT           NULL,
    moved_by_id             INT           NULL,
    source_id               NVARCHAR(50)  NULL,
    source_description      NVARCHAR(MAX) NULL,
    originator_id           NVARCHAR(50)  NULL,
    origin_id               NVARCHAR(50)  NULL,
    additional_info         NVARCHAR(MAX) NULL,
    comments                NVARCHAR(MAX) NULL,
    location_id             NVARCHAR(50)  NULL,
    -- Campos UF Bitrix24
    motivo_perda            NVARCHAR(255) NULL,
    justificativa_perda     NVARCHAR(MAX) NULL,
    feedback_cliente        NVARCHAR(MAX) NULL,
    feedback_teste_industrial NVARCHAR(MAX) NULL,
    justificativa_nao_atingimento NVARCHAR(MAX) NULL,
    feedback_sucesso_projeto NVARCHAR(MAX) NULL,
    canal_venda             NVARCHAR(255) NULL,
    linha_produto           NVARCHAR(255) NULL,
    segmento_produto        NVARCHAR(255) NULL,
    formato_produto         NVARCHAR(255) NULL,
    porte_empresa           NVARCHAR(50)  NULL,
    tipo_aplicacao          NVARCHAR(255) NULL,
    grupo_cliente           NVARCHAR(50)  NULL,
    CONSTRAINT PK_crm_deals PRIMARY KEY (id)
);
GO

-- Colunas UF adicionadas após criação inicial (idempotente)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='motivo_perda')
    ALTER TABLE crm_deals ADD motivo_perda NVARCHAR(255) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='justificativa_perda')
    ALTER TABLE crm_deals ADD justificativa_perda NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='feedback_cliente')
    ALTER TABLE crm_deals ADD feedback_cliente NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='feedback_teste_industrial')
    ALTER TABLE crm_deals ADD feedback_teste_industrial NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='justificativa_nao_atingimento')
    ALTER TABLE crm_deals ADD justificativa_nao_atingimento NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='feedback_sucesso_projeto')
    ALTER TABLE crm_deals ADD feedback_sucesso_projeto NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='canal_venda')
    ALTER TABLE crm_deals ADD canal_venda NVARCHAR(255) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='linha_produto')
    ALTER TABLE crm_deals ADD linha_produto NVARCHAR(255) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='segmento_produto')
    ALTER TABLE crm_deals ADD segmento_produto NVARCHAR(255) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='formato_produto')
    ALTER TABLE crm_deals ADD formato_produto NVARCHAR(255) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='porte_empresa')
    ALTER TABLE crm_deals ADD porte_empresa NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='tipo_aplicacao')
    ALTER TABLE crm_deals ADD tipo_aplicacao NVARCHAR(255) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('crm_deals') AND name='grupo_cliente')
    ALTER TABLE crm_deals ADD grupo_cliente NVARCHAR(50) NULL;
GO

-- Índices para crm_deals
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_crm_deals_stage_semantic' AND object_id=OBJECT_ID('crm_deals'))
    CREATE INDEX idx_crm_deals_stage_semantic ON crm_deals (stage_semantic_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_crm_deals_category' AND object_id=OBJECT_ID('crm_deals'))
    CREATE INDEX idx_crm_deals_category ON crm_deals (category_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_crm_deals_assigned' AND object_id=OBJECT_ID('crm_deals'))
    CREATE INDEX idx_crm_deals_assigned ON crm_deals (assigned_by_id);
GO

-- Leads / Prospectos
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='crm_leads' AND xtype='U')
CREATE TABLE crm_leads (
    id                      INT           NOT NULL,
    title                   NVARCHAR(MAX) NULL,
    name                    NVARCHAR(255) NULL,
    second_name             NVARCHAR(255) NULL,
    last_name               NVARCHAR(255) NULL,
    honorific               NVARCHAR(50)  NULL,
    post                    NVARCHAR(255) NULL,
    status_id               NVARCHAR(50)  NULL,
    status_semantic_id      NVARCHAR(10)  NULL,
    status_description      NVARCHAR(MAX) NULL,
    currency_id             NVARCHAR(10)  NULL,
    opportunity             FLOAT         NULL,
    is_manual_opportunity   INT           NULL,
    company_id              INT           NULL,
    company_title           NVARCHAR(255) NULL,
    contact_id              INT           NULL,
    assigned_by_id          INT           NULL,
    created_by_id           INT           NULL,
    modify_by_id            INT           NULL,
    moved_by_id             INT           NULL,
    last_activity_by        INT           NULL,
    date_create             NVARCHAR(50)  NULL,
    date_modify             NVARCHAR(50)  NULL,
    date_closed             NVARCHAR(50)  NULL,
    birthdate               NVARCHAR(50)  NULL,
    moved_time              NVARCHAR(50)  NULL,
    last_activity_time      NVARCHAR(50)  NULL,
    last_communication_time NVARCHAR(50)  NULL,
    phone                   NVARCHAR(50)  NULL,
    email                   NVARCHAR(255) NULL,
    address                 NVARCHAR(MAX) NULL,
    address_2               NVARCHAR(MAX) NULL,
    address_city            NVARCHAR(255) NULL,
    address_postal_code     NVARCHAR(20)  NULL,
    address_province        NVARCHAR(255) NULL,
    address_region          NVARCHAR(255) NULL,
    address_country         NVARCHAR(100) NULL,
    address_country_code    NVARCHAR(10)  NULL,
    source_id               NVARCHAR(50)  NULL,
    source_description      NVARCHAR(MAX) NULL,
    originator_id           NVARCHAR(50)  NULL,
    origin_id               NVARCHAR(50)  NULL,
    opened                  INT           NULL,
    is_return_customer      INT           NULL,
    has_phone               INT           NULL,
    has_email               INT           NULL,
    comments                NVARCHAR(MAX) NULL,
    CONSTRAINT PK_crm_leads PRIMARY KEY (id)
);
GO

-- Tarefas
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='crm_tasks' AND xtype='U')
CREATE TABLE crm_tasks (
    id                      INT           NOT NULL,
    title                   NVARCHAR(MAX) NULL,
    description             NVARCHAR(MAX) NULL,
    status                  INT           NULL,
    priority                INT           NULL,
    mark                    NVARCHAR(50)  NULL,
    responsible_id          INT           NULL,
    created_by              INT           NULL,
    changed_by              INT           NULL,
    closed_by               INT           NULL,
    status_changed_by       INT           NULL,
    created_date            NVARCHAR(50)  NULL,
    changed_date            NVARCHAR(50)  NULL,
    date_start              NVARCHAR(50)  NULL,
    deadline                NVARCHAR(50)  NULL,
    closed_date             NVARCHAR(50)  NULL,
    status_changed_date     NVARCHAR(50)  NULL,
    activity_date           NVARCHAR(50)  NULL,
    start_date_plan         NVARCHAR(50)  NULL,
    end_date_plan           NVARCHAR(50)  NULL,
    group_id                INT           NULL,
    parent_id               INT           NULL,
    stage_id                INT           NULL,
    flow_id                 INT           NULL,
    sprint_id               INT           NULL,
    backlog_id              INT           NULL,
    time_estimate           INT           NULL,
    time_spent_in_logs      INT           NULL,
    duration_plan           INT           NULL,
    duration_fact           INT           NULL,
    duration_type           NVARCHAR(20)  NULL,
    comments_count          INT           NULL,
    new_comments_count      INT           NULL,
    service_comments_count  INT           NULL,
    forum_id                INT           NULL,
    forum_topic_id          INT           NULL,
    chat_id                 INT           NULL,
    uf_crm_task             NVARCHAR(MAX) NULL,
    custo_orcado            FLOAT         NULL,
    custo_realizado         FLOAT         NULL,
    allow_change_deadline   INT           NULL,
    allow_time_tracking     INT           NULL,
    add_in_report           INT           NULL,
    multitask               INT           NULL,
    replicate               INT           NULL,
    task_control            INT           NULL,
    match_work_time         INT           NULL,
    xml_id                  NVARCHAR(100) NULL,
    guid                    NVARCHAR(100) NULL,
    site_id                 NVARCHAR(50)  NULL,
    exchange_id             INT           NULL,
    CONSTRAINT PK_crm_tasks PRIMARY KEY (id)
);
GO

-- Histórico de mudanças de etapa
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='crm_deal_stage_history' AND xtype='U')
CREATE TABLE crm_deal_stage_history (
    id                  INT          NOT NULL,
    deal_id             INT          NULL,
    stage_id            NVARCHAR(50) NULL,
    stage_semantic_id   NVARCHAR(10) NULL,
    category_id         INT          NULL,
    type_id             INT          NULL,
    created_time        NVARCHAR(50) NULL,
    CONSTRAINT PK_crm_deal_stage_history PRIMARY KEY (id)
);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_crm_history_deal' AND object_id=OBJECT_ID('crm_deal_stage_history'))
    CREATE INDEX idx_crm_history_deal ON crm_deal_stage_history (deal_id);
GO

-- Log de sincronização
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='crm_sync_log' AND xtype='U')
CREATE TABLE crm_sync_log (
    id            INT IDENTITY(1,1) NOT NULL,
    entity        NVARCHAR(100)     NOT NULL,
    synced_at     NVARCHAR(50)      NOT NULL,
    total_records INT               NULL,
    CONSTRAINT PK_crm_sync_log PRIMARY KEY (id)
);
GO

PRINT 'Tabelas CRM criadas com sucesso no banco PolpaBrasil.';
GO
