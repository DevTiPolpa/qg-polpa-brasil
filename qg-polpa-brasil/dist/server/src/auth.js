"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOKIE_NAME = void 0;
exports.createSessionToken = createSessionToken;
exports.verifySession = verifySession;
exports.authenticateRequest = authenticateRequest;
exports.loginWithPassword = loginWithPassword;
exports.hashPassword = hashPassword;
exports.generateRandomPassword = generateRandomPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'qgpolpabrasil_dev_secret';
const COOKIE_NAME = 'qg_session';
exports.COOKIE_NAME = COOKIE_NAME;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
function createSessionToken(userId, role) {
    return jsonwebtoken_1.default.sign({ userId, role }, COOKIE_SECRET, { expiresIn: '365d', algorithm: 'HS256' });
}
function verifySession(token) {
    try {
        return jsonwebtoken_1.default.verify(token, COOKIE_SECRET);
    }
    catch {
        return null;
    }
}
async function authenticateRequest(req) {
    const cookieHeader = req.headers.cookie ?? '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    if (!match)
        return null;
    const payload = verifySession(match[1]);
    if (!payload)
        return null;
    const user = await (0, db_1.getUserById)(payload.userId);
    if (!user || !user.ativo)
        return null;
    await (0, db_1.updateLastSignedIn)(user.id);
    return user;
}
async function loginWithPassword(email, password) {
    const user = await (0, db_1.getUserByEmail)(email);
    if (!user || !user.ativo)
        return null;
    const valid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!valid)
        return null;
    return user;
}
function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 12);
}
function generateRandomPassword(length = 10) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < length; i++) {
        pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
}
