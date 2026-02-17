import { createApp } from "./app.js";
import { config, requireConfig } from "./config.js";

async function main() {
  requireConfig();
  const app = createApp();
  try {
    await app.listen({
      host: config.host,
      port: config.port
    });
    app.log.info({ host: config.host, port: config.port }, "api_started");
  } catch (error) {
    app.log.error({ err: error }, "api_start_failed");
    process.exit(1);
  }
}

main();
