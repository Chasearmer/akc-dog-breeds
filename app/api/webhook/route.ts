import { NextRequest, NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import crypto from "crypto";

const execAsync = promisify(exec);
const SECRET = process.env.WEBHOOK_SECRET || "akc-breeds-deploy-secret";
const PROJECT_DIR = "/home/workspace/Projects/akc-dog-breeds";

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  const [algorithm, hash] = signature.split("=");
  if (algorithm !== "sha256") return false;
  const expectedHash = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return hash === expectedHash;
}

async function deploy() {
  console.log(`[${new Date().toISOString()}] Starting deployment...`);
  try {
    console.log("Pulling latest changes...");
    await execAsync("git pull", { cwd: PROJECT_DIR });
    
    console.log("Installing dependencies...");
    await execAsync("pnpm install", { cwd: PROJECT_DIR });
    
    console.log("Building application...");
    await execAsync("pnpm build", { cwd: PROJECT_DIR });
    
    console.log(`[${new Date().toISOString()}] Build complete! Scheduling restart...`);
    
    // Create a detached restart script that will:
    // 1. Wait a moment for the response to be sent
    // 2. Kill the current process
    // 3. Wait for port to be free
    // 4. Start new process
    const restartScript = `
      sleep 2
      pkill -9 -f "next start -p 3457" 2>/dev/null || true
      pkill -9 -f "next-server.*3457" 2>/dev/null || true
      sleep 3
      cd ${PROJECT_DIR} && nohup pnpm start > /dev/shm/akc-dog-breeds.log 2>&1 &
    `;
    
    spawn("bash", ["-c", restartScript], {
      detached: true,
      stdio: "ignore"
    }).unref();
    
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Deployment failed:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  
  if (!verifySignature(body, signature)) {
    console.warn(`[${new Date().toISOString()}] Unauthorized webhook attempt`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const payload = JSON.parse(body);
  console.log(`[${new Date().toISOString()}] Received webhook:`, {
    ref: payload.ref,
    deleted: payload.deleted,
    pusher: payload.pusher?.name,
  });
  
  if (payload.ref === "refs/heads/main" && !payload.deleted) {
    deploy();
    return NextResponse.json({ status: "deploying" }, { status: 202 });
  }
  
  return NextResponse.json({ 
    status: "ignored", 
    reason: payload.deleted ? "branch deletion" : "not main branch" 
  });
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "akc-dog-breeds webhook" });
}
