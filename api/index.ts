// Vercel Serverless Function Adapter
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Dynamic import to catch initialization errors (like DB connection or missing deps)
        const app = (await import('../server/index.js')).default; // Use .js extension for compiled output or rely on resolution
        // Note: In TS environment, importing .ts might misbehave if not compiled.
        // However, Vercel supports TS. Let's try importing the TS source if configured.
        // But safely, let's just stick to standard import if we are sure it compiles.
        // Actually, `await import('../server/index.ts')` is risky if paths differ in build.

        // Fallback: Just wrap the execution.
        // Since we are using standard `allowJs` and `Vercel TS`, we can try static import but wrapped? No.
        // Let's stick to the static import but add global error handlers?
        // The previous `export default app` is the best for Express on Vercel.
        // The error "Unexpected token A" means 500.

        // Let's go back to basics. If we simply re-export, Vercel gives 500 on crash.
        // Let's add a robust error logger here.
    } catch (error) {
        console.error("Serverless Initialization Error:", error);
        res.status(500).json({
            error: 'Server Initialization Failed',
            details: (error as Error).message
        });
    }
}

// REVERTING STRATEGY:
// Dynamic imports can be tricky with Vercel bundling.
// Instead, let's modify `server/index.ts` to NOT connect to DB immediately at top level, 
// but connect inside the request handler or export a function to connect.
// Current `server/index.ts` connects at root level: `mongoose.connect(...)`.
// This is fine for long-running apps but if it throws unhandled promise rejection, Vercel 500s.

// Plan:
// 1. Keep `api/index.ts` simple.
// 2. Modify `server/index.ts` to handle DB connection failure gracefully without crashing the module.
// We already added `catch` block to mongoose.connect.
// So maybe it's something else. `bcryptjs` binary issue?

// Let's try to just export a wrapped handler in `api/index.ts` that delegates to `app`.
import app from '../server/index.ts';

export default async (req: any, res: any) => {
    try {
        return app(req, res);
    } catch (e) {
        console.error("Vercel Runtime Error:", e);
        res.status(500).json({
            success: false,
            message: 'Server Runtime Error',
            details: (e as Error).message
        });
    }
};
