import { getPingHistory } from '@/lib/pingHistory';

export async function GET() {
  const history = getPingHistory();
  return new Response(JSON.stringify({
    history,
    targetUrl: process.env.TARGET_URL
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}