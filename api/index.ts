import { app, setupPromise } from "../server/index";

export default async function handler(req: any, res: any) {
    try {
        // Ensure routes and middleware are registered before handling request
        await setupPromise;
        // Pass the request to the express app
        return app(req, res);
    } catch (error: any) {
        console.error("Vercel Handler Error:", error);
        res.status(500).json({
            message: "Server failed to initialize",
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
}
