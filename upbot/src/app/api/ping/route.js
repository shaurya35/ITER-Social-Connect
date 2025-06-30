import { addPingRecord } from "@/lib/pingHistory";
import cron from "node-cron";

let cronJobStarted = false;

export async function GET() {
  const targetUrl = process.env.TARGET_URL || "https://iterconnect.live";

  try {
    const start = Date.now();
    const response = await fetch(targetUrl);
    const latency = Date.now() - start;
    const status = response.status;

    const result = {
      success: status >= 200 && status < 300,
      statusCode: status,
      latency,
      timestamp: new Date().toISOString(),
      targetUrl,
    };

    addPingRecord(result);

    if (!cronJobStarted) {
      startCronJob();
      cronJobStarted = true;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    const result = {
      success: false,
      statusCode: 0,
      latency: 0,
      timestamp: new Date().toISOString(),
      targetUrl,
      error: error.message,
    };
    addPingRecord(result);

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

function startCronJob() {
  cron.schedule("* * * * *", async () => {
    try {
      const targetUrl = process.env.TARGET_URL;
      const start = Date.now();
      const response = await fetch(targetUrl);
      const latency = Date.now() - start;

      addPingRecord({
        success: response.ok,
        statusCode: response.status,
        latency,
        timestamp: new Date().toISOString(),
        targetUrl,
      });

      console.log(`[CRON] Pinged ${targetUrl} at ${new Date().toISOString()}`);
    } catch (error) {
      addPingRecord({
        success: false,
        statusCode: 0,
        latency: 0,
        timestamp: new Date().toISOString(),
        targetUrl: process.env.TARGET_URL,
        error: error.message,
      });

      console.error(`[CRON] Ping failed: ${error.message}`);
    }
  });

  console.log("Cron job started");
}