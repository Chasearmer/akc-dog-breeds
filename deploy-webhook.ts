#!/usr/bin/env bun

const PORT = 9003;
const SECRET = process.env.WEBHOOK_SECRET || "akc-breeds-deploy-secret";
const PROJECT_DIR = "/home/workspace/Projects/akc-dog-breeds";

function verifySignature(payload: string, signature: string): boolean {
  if (!signature) return false;
  const [algorithm, hash] = signature.split('=');
  if (algorithm !== 'sha256') return false;
  const hmac = new Bun.CryptoHasher("sha256", SECRET);
  const expectedHash = hmac.update(payload).digest("hex");
  return hash === expectedHash;
}

async function deploy() {
  console.log(`[${new Date().toISOString()}] Starting deployment...`);
  
  try {
    console.log("Pulling latest changes...");
    await Bun.spawn(["git", "pull"], { cwd: PROJECT_DIR, stdout: "inherit", stderr: "inherit" }).exited;
    
    console.log("Installing dependencies...");
    await Bun.spawn(["pnpm", "install"], { cwd: PROJECT_DIR, stdout: "inherit", stderr: "inherit" }).exited;
    
    console.log("Building application...");
    await Bun.spawn(["pnpm", "build"], { cwd: PROJECT_DIR, stdout: "inherit", stderr: "inherit" }).exited;
    
    console.log("Restarting service...");
    await Bun.spawn(["pkill", "-f", "next start.*3456"], { stdout: "inherit", stderr: "inherit" }).exited;
    
    console.log(`[${new Date().toISOString()}] Deployment complete!`);
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Deployment failed:`, error);
    return false;
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }
    
    if (url.pathname === "/webhook" && req.method === "POST") {
      const body = await req.text();
      const signature = req.headers.get("x-hub-signature-256");
      
      if (!verifySignature(body, signature || "")) {
        console.warn(`[${new Date().toISOString()}] Unauthorized webhook attempt`);
        return new Response("Unauthorized", { status: 401 });
      }
      
      const payload = JSON.parse(body);
      console.log(`[${new Date().toISOString()}] Received webhook:`, {
        ref: payload.ref,
        deleted: payload.deleted,
        pusher: payload.pusher?.name
      });
      
      if (payload.ref === "refs/heads/main" && !payload.deleted) {
        deploy().then(success => {
          if (success) console.log(`[${new Date().toISOString()}] Auto-deploy completed`);
        });
        
        return new Response(JSON.stringify({ status: "deploying" }), {
          status: 202,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      return new Response(JSON.stringify({ status: "ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Webhook server listening on http://localhost:${PORT}`);
console.log(`Webhook URL: /webhook`);
