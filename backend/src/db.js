import mysql from "mysql2/promise";
import { config } from "./config.js";

function toMysqlConfig(connectionString) {
  const url = new URL(connectionString);
  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use mysql:// for MySQL backend");
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username || "root"),
    password: decodeURIComponent(url.password || ""),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    charset: "utf8mb4",
    supportBigNumbers: true,
    multipleStatements: true,
    connectTimeout: 15_000
  };
}

function convertSql(sql, params) {
  const values = Array.isArray(params) ? params : [];
  if (values.length === 0) return { sql, values };

  if (/\$\d+/.test(sql)) {
    const reordered = [];
    const converted = sql.replace(/\$(\d+)/g, (_m, idx) => {
      const i = Number(idx) - 1;
      reordered.push(values[i]);
      return "?";
    });
    return { sql: converted, values: reordered };
  }

  return { sql, values };
}

const rawPool = mysql.createPool(toMysqlConfig(config.databaseUrl));

async function runQuery(conn, sql, params) {
  const converted = convertSql(sql, params);
  const [rows] = await conn.query(converted.sql, converted.values);
  return { rows };
}

export const pool = {
  async query(sql, params) {
    return runQuery(rawPool, sql, params);
  },

  async connect() {
    const connection = await rawPool.getConnection();
    return {
      async query(sql, params) {
        return runQuery(connection, sql, params);
      },
      release() {
        connection.release();
      }
    };
  },

  async end() {
    await rawPool.end();
  }
};

export async function healthcheckDb() {
  await pool.query("SELECT 1");
}
