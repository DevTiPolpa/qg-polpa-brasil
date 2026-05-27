USE PolpaBrasil;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'metas_2026')
CREATE TABLE metas_2026 (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  nome_vendedor NVARCHAR(200) NOT NULL,
  mes           NVARCHAR(7)   NOT NULL, -- formato: '2026-01'
  valor_meta    DECIMAL(15,2) NOT NULL DEFAULT 0,
  projeto       NVARCHAR(100) NULL,
  mercado_vendas NVARCHAR(100) NULL,
  created_at    DATETIME2 DEFAULT GETDATE(),
  updated_at    DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT uq_meta_vendedor_mes_proj UNIQUE (nome_vendedor, mes, projeto)
);
GO
