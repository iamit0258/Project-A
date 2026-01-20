import { app, setupPromise } from "../server/index";

export default async function handler(req: any, res: any) {
    // Ensure routes and middleware are registered before handling request
    await setupPromise;
    // Pass the request to the express app
    return app(req, res);
}
