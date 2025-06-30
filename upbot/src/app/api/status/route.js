import { getPingHistory } from '@/lib/pingHistory';

export async function GET() {
  return new Response(JSON.stringify({
    history: getPingHistory(),
    targetUrl: process.env.TARGET_URL
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}