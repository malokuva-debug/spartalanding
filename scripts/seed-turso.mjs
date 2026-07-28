import "dotenv/config";
import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

const SERVICES = [
  { name: "Manikyr Klasik", price: 8, duration: 45 },
  { name: "Manikyr Gel / Shellac", price: 15, duration: 60 },
  { name: "Nail Art", price: 20, duration: 90 },
  { name: "Pedikyr Spa", price: 15, duration: 60 },
  { name: "Akrilik & Zgjatime", price: 25, duration: 90 },
  { name: "Heqje & Trajtim", price: 5, duration: 30 },
];

const WORKERS = [
  { username: "elira", name: "Elira", role: "worker" },
  { username: "rina", name: "Rina", role: "worker" },
];

async function seedServices() {
  const existing = await db.execute("SELECT name FROM services");
  const have = new Set(existing.rows.map((r) => String(r.name).toLowerCase()));
  let added = 0;
  for (const s of SERVICES) {
    if (have.has(s.name.toLowerCase())) continue;
    await db.execute({
      sql: "INSERT INTO services (id, name, price, duration) VALUES (?, ?, ?, ?)",
      args: [randomUUID(), s.name, s.price, s.duration],
    });
    added++;
  }
  console.log(`services: +${added} (total ${existing.rows.length + added})`);
}

async function seedWorkers() {
  const existing = await db.execute("SELECT username FROM users");
  const have = new Set(existing.rows.map((r) => String(r.username).toLowerCase()));
  const ids = [];
  for (const w of WORKERS) {
    if (have.has(w.username)) continue;
    const id = randomUUID();
    await db.execute({
      sql: "INSERT INTO users (id, username, password_hash, role, name, status) VALUES (?, ?, ?, ?, ?, ?)",
      args: [id, w.username, "", w.role, w.name, "active"],
    });
    ids.push(id);
  }
  console.log(`users: +${ids.length}`);
}

async function seedSettings() {
  const all = await db.execute("SELECT id, name, role, status FROM users WHERE status = 'active'");

  // Mon–Sat 09:00–20:00, Sunday closed. Keys are JS getDay() values.
  const hours = {
    0: null,
    1: { open: "09:00", close: "20:00" },
    2: { open: "09:00", close: "20:00" },
    3: { open: "09:00", close: "20:00" },
    4: { open: "09:00", close: "20:00" },
    5: { open: "09:00", close: "21:00" },
    6: { open: "09:00", close: "18:00" },
  };

  const schedule = {};
  all.rows.forEach((u, i) => {
    schedule[String(u.id)] = {
      days: i % 2 === 0 ? [1, 2, 3, 4, 5, 6] : [2, 3, 4, 5, 6],
      start: "09:00",
      end: i % 2 === 0 ? "20:00" : "18:00",
      bookable: true,
    };
  });

  const booking = {
    slotInterval: 30,
    leadMinutes: 0,
    horizonDays: 30,
    instagram: "spartaroyale",
    address: "Rr. Kacaniku, Nr. 17",
    city: "Prishtinë, Kosovë",
  };

  const rows = [
    ["sparta_working_hours", JSON.stringify(hours)],
    ["sparta_worker_schedule", JSON.stringify(schedule)],
    ["sparta_booking", JSON.stringify(booking)],
  ];

  for (const [key, value] of rows) {
    await db.execute({
      sql: `INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [key, value],
    });
  }
  console.log(`settings: ${rows.map((r) => r[0]).join(", ")}`);
}

await seedServices();
await seedWorkers();
await seedSettings();
console.log("done");
