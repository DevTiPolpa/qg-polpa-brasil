-- Tabela de snapshots semanais da previsão de vendas
-- Executar no SSMS como sa ou db_owner em PolpaBrasil
USE PolpaBrasil;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'forecast_snapshots')
BEGIN
  CREATE TABLE forecast_snapshots (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    snapshot_date       DATE NOT NULL,          -- data do snapshot (sexta-feira)
    cod_parc            INT NOT NULL,
    razao_social        NVARCHAR(200),
    cod_produto         BIGINT NOT NULL,
    nome_produto        NVARCHAR(200),
    grupo_produto       NVARCHAR(100),
    projeto             NVARCHAR(100),
    mercado_vendas      NVARCHAR(100),
    nome_vendedor       NVARCHAR(100),
    tipo_receita        NVARCHAR(50),
    uf                  NVARCHAR(2),
    valor_pendente      DECIMAL(18,2) NOT NULL DEFAULT 0,
    qtd_pendente_kg     DECIMAL(18,4) NOT NULL DEFAULT 0,
    dt_entrega_cliente  DATE
  );

  CREATE INDEX idx_fs_date      ON forecast_snapshots (snapshot_date);
  CREATE INDEX idx_fs_parc_date ON forecast_snapshots (cod_parc, snapshot_date);
  CREATE INDEX idx_fs_prod_date ON forecast_snapshots (cod_produto, snapshot_date);

  PRINT 'Tabela forecast_snapshots criada com sucesso.';
END
ELSE
  PRINT 'Tabela forecast_snapshots ja existe.';
GO
