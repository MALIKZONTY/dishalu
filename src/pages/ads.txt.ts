import { SITE } from '../site.config';

// AdSense needs this file once you are approved. It's generated from SITE.adsenseClient.
export function GET() {
  const pub = SITE.adsenseClient.replace(/^ca-/, '');
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : '';
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
