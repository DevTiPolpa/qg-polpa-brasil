import 'dotenv/config'
import sql from 'mssql'

const config: sql.config = {
  server:   process.env.DB_SERVER   || 'localhost',
  database: process.env.DB_DATABASE || 'PolpaBrasil',
  user:     process.env.DB_USER     || 'qgpolpa',
  password: process.env.DB_PASSWORD || 'QGPolpa@2026!',
  port:     parseInt(process.env.DB_PORT || '1433'),
  options:  { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
}

async function main() {
  console.log('Conectando ao banco...')
  const pool = await new sql.ConnectionPool(config).connect()

  // 1. Criar tabela se não existir
  console.log('Criando tabela forecast_snapshots (se necessário)...')
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'forecast_snapshots')
    BEGIN
      CREATE TABLE forecast_snapshots (
        id                  INT IDENTITY(1,1) PRIMARY KEY,
        snapshot_date       DATE NOT NULL,
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
      PRINT 'Tabela criada.';
    END
  `)
  console.log('Tabela OK.')

  // 2. Verificar se já existe snapshot de hoje
  const today = new Date().toISOString().split('T')[0]
  const existing = await pool.request()
    .input('d', sql.Date, today)
    .query(`SELECT COUNT(*) AS cnt FROM forecast_snapshots WHERE snapshot_date = @d`)

  if (existing.recordset[0].cnt > 0) {
    console.log(`Snapshot de ${today} já existe. Nada a fazer.`)
    await pool.close()
    return
  }

  // 3. Criar snapshot
  console.log(`Criando snapshot de ${today}...`)
  const result = await pool.request()
    .input('snapDate', sql.Date, today)
    .query(`
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
    `)

  console.log(`✓ Snapshot criado: ${result.rowsAffected[0]} linhas para ${today}`)
  await pool.close()
}

main().catch(err => { console.error('Erro:', err); process.exit(1) })
