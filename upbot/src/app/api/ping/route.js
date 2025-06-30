import { addPingRecord } from "@/lib/pingHistory";

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
    console.log(`Pinged ${targetUrl} at ${result.timestamp}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
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
      headers: { 'Content-Type': 'application/json' }
    });
  }
}