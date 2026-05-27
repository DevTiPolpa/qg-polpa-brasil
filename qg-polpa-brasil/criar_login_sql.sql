-- ============================================================
-- QG Polpa Brasil - Criar login SQL Server
-- Execute este script no SSMS como administrador
-- ============================================================

USE master;
GO

-- 1. Habilitar autenticação mista (SQL Server + Windows), se não estiver habilitada
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE',
     N'Software\Microsoft\MSSQLServer\MSSQLServer',
     N'LoginMode', REG_DWORD, 2;
GO

-- 2. Criar o login (mude a senha se quiser)
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'qgpolpa')
BEGIN
    CREATE LOGIN qgpolpa WITH PASSWORD = 'QGPolpa@2026!',
        DEFAULT_DATABASE = PolpaBrasil,
        CHECK_EXPIRATION = OFF,
        CHECK_POLICY = OFF;
    PRINT '✓ Login qgpolpa criado';
END
ELSE
    PRINT '- Login qgpolpa já existe';
GO

-- 3. Conceder acesso ao banco PolpaBrasil
USE PolpaBrasil;
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'qgpolpa')
BEGIN
    CREATE USER qgpolpa FOR LOGIN qgpolpa;
    PRINT '✓ Usuário criado no banco PolpaBrasil';
END
GO

-- 4. Dar permissão de db_owner (ou use db_datareader + db_datawriter para mais segurança)
ALTER ROLE db_owner ADD MEMBER qgpolpa;
GO
PRINT '✓ Permissões concedidas';

-- 5. IMPORTANTE: Reiniciar o SQL Server para que a mudança de LoginMode surta efeito
--    Execute no PowerShell como admin:
--    Restart-Service MSSQLSERVER
PRINT '';
PRINT '⚠ Após executar este script, reinicie o SQL Server:';
PRINT '   Restart-Service MSSQLSERVER';
PRINT '';
PRINT 'Depois, edite o arquivo .env do projeto:';
PRINT '   DB_USER=qgpolpa';
PRINT '   DB_PASSWORD=QGPolpa@2026!';
