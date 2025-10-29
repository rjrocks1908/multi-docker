const keys = require("./keys");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const redis = require("redis");

const app = express();
app.use(express.json());
app.use(cors());

// Postgres Handler --------------------------
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
  ssl:
    process.env.NODE_ENV !== "production"
      ? false
      : { rejectUnauthorized: false },
});

// Handle pool errors
pgClient.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Redis---------------------------------
const redisHost = keys.redisHost || "127.0.0.1";
const redisPort = parseInt(keys.redisPort, 10) || 6379;

const redisClient = redis.createClient({
  socket: { host: redisHost, port: redisPort },
});

redisClient.on("error", (err) => {
  console.error("Redis client error:", err);
});

const pub = redisClient.duplicate();
pub.on("error", (err) => {
  console.error("Redis publisher error:", err);
});

// Express Route Handlers ---------------
app.get("/", (req, res) => {
  res.send("HI");
});

app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * from values");
  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  const values = await redisClient.hGetAll("values");
  res.send(values);
});

app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  await redisClient.hSet("values", index, "Nothing yet!");
  await pub.publish("insert", index);

  pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);

  res.send({ working: true });
});

// Start server after Postgres and Redis are connected
async function startServer() {
  // Initialize Postgres (connect and ensure table exists)
  try {
    // Ensure we can run a query; Pool.query will acquire a client internally.
    await pgClient.query("CREATE TABLE IF NOT EXISTS values (number INT)");
    console.log("Postgres connected and table created successfully");
  } catch (err) {
    console.error("Error connecting to the database or creating table:", err);
    process.exit(1);
  }

  // Initialize Redis
  try {
    await redisClient.connect();
    await pub.connect();
    console.log("Redis connected");
  } catch (err) {
    console.error("Error connecting to Redis:", err);
    process.exit(1);
  }

  app.listen(5000, () => {
    console.log("Listening on port 5000");
  });
}

startServer();
