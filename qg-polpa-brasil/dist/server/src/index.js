"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const express_2 = require("@trpc/server/adapters/express");
const routers_1 = require("./routers");
const trpc_1 = require("./trpc");
const db_1 = require("./db");
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 5000;
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use('/trpc', (0, express_2.createExpressMiddleware)({ router: routers_1.appRouter, createContext: trpc_1.createContext }));
app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'QG Polpa Brasil' }));
// Serve o build do React em produção
const CLIENT_DIST = path_1.default.resolve(__dirname, '../../../client/dist');
app.use(express_1.default.static(CLIENT_DIST));
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(CLIENT_DIST, 'index.html'));
});
app.listen(PORT, () => {
    console.log(`[QG Polpa Brasil] Servidor rodando em http://localhost:${PORT}`);
});
// ─── Cron: snapshot toda sexta-feira às 17:00 ────────────────────────────────
let _lastSnapshotCheck = '';
setInterval(async () => {
    const now = new Date();
    if (now.getDay() !== 5 || now.getHours() !== 17 || now.getMinutes() !== 0)
        return;
    const today = now.toISOString().split('T')[0];
    if (_lastSnapshotCheck === today)
        return; // já executou hoje
    _lastSnapshotCheck = today;
    try {
        const existing = await (0, db_1.getSnapshotDates)();
        if (existing.some(d => d.snapshotDate === today)) {
            console.log('[Snapshot] Já existe snapshot para hoje, pulando.');
            return;
        }
        const { inserted } = await (0, db_1.createForecastSnapshot)();
        console.log(`[Snapshot] Criado snapshot de ${today} com ${inserted} linhas.`);
    }
    catch (err) {
        console.error('[Snapshot] Erro ao criar snapshot:', err);
    }
}, 60000);
