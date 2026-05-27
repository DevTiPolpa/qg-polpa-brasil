"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Cria o primeiro usuário administrador.
 * Execute: npx tsx server/src/seed-admin.ts
 */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("./db");
async function main() {
    const email = process.env.ADMIN_EMAIL || 'admin@polpabrasil.com.br';
    const password = process.env.ADMIN_PASSWORD || 'Admin@2026';
    const name = process.env.ADMIN_NAME || 'Administrador';
    const pool = await (0, db_1.getPool)();
    if (!pool) {
        console.error('Não foi possível conectar ao banco de dados.');
        process.exit(1);
    }
    const existing = await pool.request()
        .input('email', email)
        .query('SELECT id FROM users WHERE email = @email');
    if (existing.recordset.length > 0) {
        console.log(`Usuário ${email} já existe. Nenhuma alteração.`);
        process.exit(0);
    }
    const hash = await bcryptjs_1.default.hash(password, 12);
    await pool.request()
        .input('name', name)
        .input('email', email)
        .input('hash', hash)
        .query(`INSERT INTO users (name, email, password_hash, role, ativo, must_change_password)
            VALUES (@name, @email, @hash, 'ADMIN', 1, 0)`);
    console.log(`✓ Administrador criado com sucesso!`);
    console.log(`  E-mail: ${email}`);
    console.log(`  Senha: ${password}`);
    console.log(`  Acesse: http://localhost:5173`);
    process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
