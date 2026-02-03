import { NextRequest, NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import { shouldDeploy, verifySignature } from "@/lib/webhook";

const execAsync = promisify(exec);
const SECRET = process.env.WEBHOOK_SECRET || "akc-breeds-deploy-secret";
const PROJECT_DIR = "/home/workspace/Projects/akc-dog-breeds";
const PORT = 3457;

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
    
    // Use a detached script that:
    // 1. Waits for the HTTP response to be sent
    // 2. Kills the current Next.js server
    // 3. Waits for the port to be free (with retries)
    // 4. Starts the new server
    const restartScript = `
      sleep 1
      
      # Get the current process PID holding the port
      OLD_PID=$(fuser ${PORT}/tcp 2>/dev/null || echo "")
      
      if [ -n "$OLD_PID" ]; then
        echo "[$(date -Iseconds)] Killing process $OLD_PID on port ${PORT}..."
        kill -9 $OLD_PID 2>/dev/null || true
      fi
      
      # Wait for port to be free (up to 10 seconds)
      for i in {1..20}; do
        if ! fuser ${PORT}/tcp >/dev/null 2>&1; then
          echo "[$(date -Iseconds)] Port ${PORT} is free"
          break
        fi
        echo "[$(date -Iseconds)] Waiting for port ${PORT} to be free... (attempt $i)"
        sleep 0.5
      done
      
      # Start the new server
      echo "[$(date -Iseconds)] Starting new server..."
      cd ${PROJECT_DIR}
      nohup pnpm start >> /dev/shm/akc-dog-breeds.log 2>&1 &
      echo "[$(date -Iseconds)] Restart complete, new PID: $!"
    `;
    
    spawn("bash", ["-c", restartScript], {
      detached: true,
      stdio: ["ignore", "pipe", "pipe"]
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
  
  if (!verifySignature(body, signature, SECRET)) {
    console.warn(`[${new Date().toISOString()}] Unauthorized webhook attempt`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const payload = JSON.parse(body);
  console.log(`[${new Date().toISOString()}] Received webhook:`, {
    ref: payload.ref,
    deleted: payload.deleted,
    pusher: payload.pusher?.name,
  });
  
  if (shouldDeploy(payload)) {
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
