import { turso } from "./turso";

let wp: any = null;

async function getWebpush() {
  if (!wp) {
    const mod = await import("web-push");
    wp = mod.default || mod;
    const email = process.env.VAPID_EMAIL || "mailto:valmir.mlku@gmail.com";
    const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    const privKey = process.env.VAPID_PRIVATE_KEY || "";
    if (!pubKey || !privKey) return null;
    wp.setVapidDetails(
      email.startsWith("mailto:") ? email : `mailto:${email}`,
      pubKey,
      privKey
    );
  }
  return wp;
}

export async function sendBookingPush(
  clientName: string,
  serviceName: string,
  date: string,
  time: string
) {
  try {
    const webpush = await getWebpush();
    if (!webpush) {
      console.error("[Landing Push] VAPID keys not configured");
      return;
    }

    const db = turso();
    if (!db) {
      console.error("[Landing Push] No DB connection");
      return;
    }

    const result = await db.execute(
      "SELECT endpoint, subscription FROM push_subscriptions"
    );
    if (result.rows.length === 0) {
      console.log("[Landing Push] No subscriptions found");
      return;
    }

    const payload = JSON.stringify({
      title: "📅 Takim i ri (Online)",
      body: `${clientName} — ${serviceName}\n${date} në ${time}`,
      tag: `new-appt-${Date.now()}`,
      data: { type: "new", clientName, serviceName, date, time },
    });

    let sent = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      result.rows.map(async (row) => {
        try {
          const sub = JSON.parse(String(row.subscription));
          await webpush.sendNotification(sub, payload);
          sent++;
        } catch (err: any) {
          failed++;
          const status = err.statusCode || err.status || err.status;
          console.error(
            `[Landing Push] Failed for endpoint=${String(row.endpoint).substring(0, 50)}... status=${status} msg=${err.message}`
          );
          if (status === 410 || status === 404) {
            await db
              .execute({
                sql: "DELETE FROM push_subscriptions WHERE endpoint = ?",
                args: [String(row.endpoint)],
              })
              .catch(() => {});
          }
        }
      })
    );

    console.log(`[Landing Push] Done: sent=${sent}, failed=${failed}, total=${result.rows.length}`);
  } catch (err) {
    console.error("[Landing Push] Error:", err);
  }
}
