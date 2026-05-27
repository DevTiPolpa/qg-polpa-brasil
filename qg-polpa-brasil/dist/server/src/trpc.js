"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProcedure = exports.protectedProcedure = exports.publicProcedure = exports.router = void 0;
exports.createContext = createContext;
const server_1 = require("@trpc/server");
const superjson_1 = __importDefault(require("superjson"));
const auth_1 = require("./auth");
async function createContext({ req, res }) {
    const user = await (0, auth_1.authenticateRequest)(req);
    return { req, res, user };
}
const t = server_1.initTRPC.context().create({ transformer: superjson_1.default });
exports.router = t.router;
exports.publicProcedure = t.procedure;
exports.protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.user)
        throw new server_1.TRPCError({ code: 'UNAUTHORIZED' });
    return next({ ctx: { ...ctx, user: ctx.user } });
});
exports.adminProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.user)
        throw new server_1.TRPCError({ code: 'UNAUTHORIZED' });
    if (ctx.user.role !== 'ADMIN')
        throw new server_1.TRPCError({ code: 'FORBIDDEN' });
    return next({ ctx: { ...ctx, user: ctx.user } });
});
