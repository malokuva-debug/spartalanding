import { createClient, type Client } from "@libsql/client";
import { randomUUID } from "node:crypto";

/**
 * Live connection to the Sparta Royale dashboard database (Turso / libSQL).
 * The public site reads services, workers, settings and availability from here,
 * then writes confirmed booking requests back into the dashboard appointments table.
 */

let cached: Client | null = null;

export function turso(): Client | null {
  const url = process.env.TURSO_URL;
  if (!url) return null;
  if (cached) return cached;
  cached = createClient({ url, authToken: process.env.TURSO_TOKEN || undefined });
  return cached;
}

/* ─────────────────────────── types ─────────────────────────── */

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  days: number[];
  start: string;
  end: string;
}

export interface DayHours {
  open: string;
  close: string;
}

export interface SalonConfig {
  hours: Record<string, DayHours | null>;
  slotInterval: number;
  leadMinutes: number;
  horizonDays: number;
  instagram: string;
  address: string;
  city: string;
}

export interface SalonData {
  services: Service[];
  workers: Worker[];
  config: SalonConfig;
  preferredServiceId: string | null;
  unavailability: UnavailabilityEntry[];
}

export interface UnavailabilityEntry {
  id: string;
  workerId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

/* ───────────────────────── defaults ───────────────────────── */

const DEFAULT_HOURS: Record<string, DayHours | null> = {
  "0": null,
  "1": { open: "09:00", close: "20:00" },
  "2": { open: "09:00", close: "20:00" },
  "3": { open: "09:00", close: "20:00" },
  "4": { open: "09:00", close: "20:00" },
  "5": { open: "09:00", close: "21:00" },
  "6": { open: "09:00", close: "18:00" },
};

const DEFAULT_CONFIG: SalonConfig = {
  hours: DEFAULT_HOURS,
  slotInterval: 30,
  leadMinutes: 0,
  horizonDays: 30,
  instagram: "spartaroyale",
  address: "Rr. Kacaniku, Nr. 17",
  city: "Prishtinë, Kosovë",
};

/* ─────────────────────────── helpers ─────────────────────────── */

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const toHHMM = (mins: number): string =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^+\d]/g, "").replace(/^00/, "+");
}

/* ───────────────────────── settings ───────────────────────── */

async function readSettings(db: Client): Promise<Record<string, string>> {
  try {
    const res = await db.execute("SELECT key, value FROM settings");
    const out: Record<string, string> = {};
    res.rows.forEach((r) => {
      out[String(r.key)] = r.value == null ? "" : String(r.value);
    });
    return out;
  } catch {
    return {};
  }
}

async function preferredServiceId(db: Client, services: Service[]): Promise<string | null> {
  if (services.length === 0) return null;
  try {
    const res = await db.execute(`
      SELECT service_id, service_name, COUNT(*) AS total
      FROM appointments
      WHERE service_id IS NOT NULL OR service_name IS NOT NULL
      GROUP BY service_id, service_name
      ORDER BY total DESC
      LIMIT 1
    `);
    const row = res.rows[0];
    const byId = row?.service_id ? services.find((s) => s.id === String(row.service_id)) : null;
    if (byId) return byId.id;
    const byName = row?.service_name
      ? services.find((s) => s.name.toLowerCase() === String(row.service_name).toLowerCase())
      : null;
    return byName?.id ?? services[0].id;
  } catch {
    return services[0].id;
  }
}

/* ───────────────────── main data loader ───────────────────── */

let memo: { at: number; data: SalonData } | null = null;
const TTL = 30_000;

export async function getSalonData(force = false): Promise<SalonData> {
  if (!force && memo && Date.now() - memo.at < TTL) return memo.data;

  const db = turso();
  const empty: SalonData = {
    services: [],
    workers: [],
    config: DEFAULT_CONFIG,
    preferredServiceId: null,
    unavailability: [],
  };
  if (!db) return empty;

  try {
    const [svcRes, userRes, settings] = await Promise.all([
      db.execute("SELECT id, name, price, duration FROM services"),
      db.execute(
        "SELECT id, name, username, role, status FROM users WHERE status = 'active' OR status IS NULL"
      ),
      readSettings(db),
    ]);

    const hours = parseJson(settings["sparta_working_hours"], DEFAULT_HOURS);
    const bookingCfg = parseJson(settings["sparta_booking"], {} as Partial<SalonConfig>);
    const schedule = parseJson(
      settings["sparta_worker_schedule"],
      {} as Record<string, { days?: number[]; start?: string; end?: string; bookable?: boolean }>
    );
    const unavailability: UnavailabilityEntry[] = parseJson(
      settings["sparta_worker_unavailability"],
      [] as UnavailabilityEntry[]
    );

    const config: SalonConfig = {
      hours,
      slotInterval: Number(bookingCfg.slotInterval) || DEFAULT_CONFIG.slotInterval,
      leadMinutes: Number(bookingCfg.leadMinutes ?? DEFAULT_CONFIG.leadMinutes),
      horizonDays: Number(bookingCfg.horizonDays) || DEFAULT_CONFIG.horizonDays,
      instagram: bookingCfg.instagram || DEFAULT_CONFIG.instagram,
      address: bookingCfg.address || DEFAULT_CONFIG.address,
      city: bookingCfg.city || DEFAULT_CONFIG.city,
    };

    const services: Service[] = svcRes.rows
      .map((r) => ({
        id: String(r.id),
        name: String(r.name ?? "").trim(),
        price: Number(r.price ?? 0),
        duration: Number(r.duration ?? 60) || 60,
      }))
      .filter((s) => s.name)
      .sort((a, b) => a.price - b.price);

    const workers: Worker[] = userRes.rows
      .map((r) => {
        const id = String(r.id);
        const sch = schedule[id] ?? {};
        if (sch.bookable === false) return null;
        return {
          id,
          name: String(r.name || r.username || "").trim() || "Staf",
          role: String(r.role ?? "worker"),
          days: Array.isArray(sch.days) ? sch.days.map(Number) : [1, 2, 3, 4, 5, 6],
          start: sch.start || "09:00",
          end: sch.end || "20:00",
        };
      })
      .filter((w): w is Worker => w !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    const data: SalonData = {
      services,
      workers,
      config,
      preferredServiceId: await preferredServiceId(db, services),
      unavailability,
    };
    memo = { at: Date.now(), data };
    return data;
  } catch (err) {
    console.error("[turso] getSalonData failed:", err);
    return empty;
  }
}

/* ──────────────────────── availability ──────────────────────── */

interface BusyBlock {
  workerId: string | null;
  start: number;
  end: number;
}

async function getBusyBlocks(db: Client, date: string): Promise<BusyBlock[]> {
  try {
    const res = await db.execute({
      sql: `SELECT worker_id, time, duration FROM appointments
            WHERE date = ? AND (status IS NULL OR status != 'canceled')`,
      args: [date],
    });
    return res.rows.map((r) => {
      const start = toMinutes(String(r.time ?? "00:00"));
      const dur = Number(r.duration ?? 60) || 60;
      return {
        workerId: r.worker_id == null ? null : String(r.worker_id),
        start,
        end: start + dur,
      };
    });
  } catch {
    return [];
  }
}

export interface SlotInfo {
  time: string;
  available: boolean;
  workerIds: string[];
}

export interface AvailabilityResult {
  date: string;
  closed: boolean;
  open?: string;
  close?: string;
  slots: SlotInfo[];
  workers: { id: string; name: string; working: boolean }[];
}

/**
 * Real availability: salon opening hours ∩ worker schedule − existing
 * appointments (duration-aware) − same-day lead time − worker unavailability.
 */
export async function getAvailability(
  date: string,
  serviceDuration: number,
  workerId?: string | null
): Promise<AvailabilityResult> {
  const { workers, config, unavailability } = await getSalonData();
  const db = turso();

  const dow = new Date(`${date}T00:00:00`).getDay();
  const dayHours = config.hours[String(dow)];

  const workerList = workers.map((w) => ({
    id: w.id,
    name: w.name,
    working: w.days.includes(dow),
  }));

  if (!dayHours) {
    return { date, closed: true, slots: [], workers: workerList };
  }

  const salonOpen = toMinutes(dayHours.open);
  const salonClose = toMinutes(dayHours.close);
  const step = config.slotInterval;
  const duration = serviceDuration > 0 ? serviceDuration : 60;

  const busy = db ? await getBusyBlocks(db, date) : [];

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const earliest =
    date === todayIso ? now.getHours() * 60 + now.getMinutes() + config.leadMinutes : -1;

  const pool = workers.filter(
    (w) => w.days.includes(dow) && (!workerId || w.id === workerId)
  );

  // Build unavailability map for this date: workerId -> array of time ranges
  const unavailToday = new Map<string, { start: number; end: number }[]>();
  for (const u of unavailability) {
    if (u.date !== date) continue;
    const ranges = unavailToday.get(u.workerId) || [];
    if (!u.startTime || !u.endTime) {
      // All-day unavailability: block the entire day
      ranges.push({ start: 0, end: 24 * 60 });
    } else {
      ranges.push({ start: toMinutes(u.startTime), end: toMinutes(u.endTime) });
    }
    unavailToday.set(u.workerId, ranges);
  }

  function isWorkerAvailable(workerId: string, slotStart: number, slotEnd: number): boolean {
    const ranges = unavailToday.get(workerId);
    if (!ranges) return true;
    return !ranges.some((r) => slotStart < r.end && slotEnd > r.start);
  }

  const slots: SlotInfo[] = [];
  for (let t = salonOpen; t + duration <= salonClose; t += step) {
    if (t < earliest) {
      slots.push({ time: toHHMM(t), available: false, workerIds: [] });
      continue;
    }

    const free = pool.filter((w) => {
      const ws = Math.max(salonOpen, toMinutes(w.start));
      const we = Math.min(salonClose, toMinutes(w.end));
      if (t < ws || t + duration > we) return false;
      if (!isWorkerAvailable(w.id, t, t + duration)) return false;
      return !busy.some(
        (b) => (b.workerId === w.id || b.workerId === null) && t < b.end && t + duration > b.start
      );
    });

    slots.push({
      time: toHHMM(t),
      available: free.length > 0,
      workerIds: free.map((w) => w.id),
    });
  }

  return {
    date,
    closed: false,
    open: dayHours.open,
    close: dayHours.close,
    slots,
    workers: workerList,
  };
}

/* ────────────────────────── booking ────────────────────────── */

export interface CreateBooking {
  clientName: string;
  phone: string;
  serviceId: string;
  date: string;
  time: string;
  workerId?: string | null;
  notes?: string | null;
}

export interface BookingResult {
  ok: boolean;
  id?: string;
  workerName?: string;
  service?: Service;
  clientId?: string | null;
  error?: "no_db" | "bad_service" | "closed" | "taken" | "failed";
}

async function findOrCreateClient(
  db: Client,
  name: string,
  phone: string
): Promise<string | null> {
  const cleanPhone = normalizePhone(phone);
  try {
    const byPhone = await db.execute({
      sql: `SELECT id FROM clients
            WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') = ?
            LIMIT 1`,
      args: [cleanPhone],
    });
    if (byPhone.rows[0]?.id != null) {
      const id = String(byPhone.rows[0].id);
      await db.execute({
        sql: "UPDATE clients SET name = COALESCE(NULLIF(?, ''), name), phone = ? WHERE id = ?",
        args: [name, cleanPhone, id],
      });
      return id;
    }

    const id = randomUUID();
    await db.execute({
      sql: `INSERT INTO clients (id, name, phone, email, notes, visits, total_spent)
            VALUES (?, ?, ?, NULL, ?, 0, 0)`,
      args: [id, name, cleanPhone, "Rezervim online"],
    });
    return id;
  } catch (err) {
    console.error("[turso] findOrCreateClient failed:", err);
    return null;
  }
}

export async function createBooking(input: CreateBooking): Promise<BookingResult> {
  const db = turso();
  if (!db) return { ok: false, error: "no_db" };

  const { services, workers } = await getSalonData(true);
  const service = services.find((s) => s.id === input.serviceId);
  if (!service) return { ok: false, error: "bad_service" };

  const availability = await getAvailability(input.date, service.duration, input.workerId);
  if (availability.closed) return { ok: false, error: "closed" };

  const slot = availability.slots.find((s) => s.time === input.time);
  if (!slot || !slot.available || slot.workerIds.length === 0) {
    return { ok: false, error: "taken" };
  }

  const assignedId =
    input.workerId && slot.workerIds.includes(input.workerId)
      ? input.workerId
      : slot.workerIds[0];
  const assigned = workers.find((w) => w.id === assignedId);
  const cleanPhone = normalizePhone(input.phone);
  const clientId = await findOrCreateClient(db, input.clientName, cleanPhone);

  const noteParts = [`Tel: ${cleanPhone}`];
  if (input.notes) noteParts.push(input.notes);
  noteParts.push("Rezervim online");

  const id = randomUUID();
  try {
    await db.execute({
      sql: `INSERT INTO appointments
              (id, client_id, client_name, client_phone, service_id, service_name, worker_id,
               date, time, duration, status, notes, extra_services, price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, ?)`,
      args: [
        id,
        clientId,
        input.clientName,
        cleanPhone,
        service.id,
        service.name,
        assignedId,
        input.date,
        input.time,
        service.duration,
        noteParts.join(" · "),
        service.price,
      ],
    });
    return { ok: true, id, workerName: assigned?.name, service, clientId };
  } catch (err) {
    console.error("[turso] createBooking failed:", err);
    return { ok: false, error: "failed" };
  }
}
