import { spawn } from "node:child_process";

const run = (command, args) => {
  const child = spawn(command, args, { stdio: "inherit", shell: true });
  child.on("exit", (code) => {
    if (code && code !== 0) process.exitCode = code;
  });
  return child;
};

const api = run("npx", ["tsx", "server/index.ts"]);
const vite = run("npx", ["vite", "--host", "127.0.0.1", "--port", "5173"]);

const shutdown = () => {
  api.kill();
  vite.kill();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
