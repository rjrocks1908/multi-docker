const keys = require("./keys");
const redis = require("redis");

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

async function startWorker() {
  const redisHost = keys.redisHost || "127.0.0.1";
  const redisPort = parseInt(keys.redisPort, 10) || 6379;

  const client = redis.createClient({
    socket: { host: redisHost, port: redisPort },
  });

  client.on("error", (err) => {
    console.error("Redis client error:", err);
  });

  await client.connect();

  const sub = client.duplicate();
  sub.on("error", (err) => {
    console.error("Redis subscriber error:", err);
  });

  await sub.connect();

  // subscribe with callback (Redis v4 style)
  await sub.subscribe("insert", async (message) => {
    const index = parseInt(message, 10);
    if (Number.isNaN(index)) {
      console.warn("Received non-numeric message on 'insert':", message);
      return;
    }

    const value = fib(index);
    try {
      await client.hSet("values", message, String(value));
    } catch (err) {
      console.error("Failed to hSet value:", err);
    }
  });

  console.log("Worker subscribed to 'insert' channel");
}

startWorker().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
