const { spawn } = require("child_process");
const path = require("path");

const viteScript = path.join(__dirname, "..", "node_modules", "vite", "bin", "vite.js");
const commands = [
  { name: "api", command: process.execPath, args: ["app.js"] },
  { name: "web", command: process.execPath, args: [viteScript, "--host", "127.0.0.1"] }
];
const children = [];
let shuttingDown = false;

function stopAll(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  setTimeout(() => process.exit(code), 100);
}

for (const item of commands) {
  const child = spawn(item.command, item.args, {
    cwd: path.join(__dirname, ".."),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  children.push(child);

  child.stdout.on("data", chunk => process.stdout.write(`[${item.name}] ${chunk}`));
  child.stderr.on("data", chunk => process.stderr.write(`[${item.name}] ${chunk}`));
  child.on("error", error => {
    console.error(`[${item.name}] failed to start: ${error.message}`);
    stopAll(1);
  });
  child.on("exit", code => {
    if (!shuttingDown) {
      console.log(`[${item.name}] exited with code ${code}`);
      stopAll(code || 0);
    }
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
