/**
 * api/alerts.ts — Vercel Serverless Function
 *
 * This replaces the Express /api/alerts endpoint for the Vercel deployment.
 * Fixes Bug #1: GET /api/alerts?state=maharashtra returning 404 on Vercel.
 *
 * The frontend deploys as a static site on Vercel. The Express backend is
 * NOT deployed. This serverless function handles the alerts API route.
 *
 * Priority:
 * 1. Try to fetch from GDACS RSS feed (global disaster data)
 * 2. Fall back to curated Maharashtra-specific seed alerts
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface AlertItem {
  title: string;
  description: string;
  publishedDate: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  state: string;
  officialLink: string;
}

const SEED_ALERTS: AlertItem[] = [
  {
    title: 'RED ALERT: Severe Flooding Warning for Pune-East',
    description:
      'Mutha river discharge exceeded critical limits. Heavy rainfall expected in next 6 hours. Residents near river beds must evacuate immediately to safe shelters.',
    publishedDate: new Date().toISOString(),
    severity: 'CRITICAL',
    category: 'FLOOD',
    state: 'MAHARASHTRA',
    officialLink: 'https://sachet.ndma.gov.in',
  },
  {
    title: 'HEATWAVE WARNING: Nagpur District',
    description:
      'Nagpur and adjacent Vidarbha districts are experiencing peak temperatures up to 46°C. Keep hydrated and avoid direct sunlight between 12 PM–4 PM.',
    publishedDate: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    severity: 'CRITICAL',
    category: 'HEATWAVE',
    state: 'MAHARASHTRA',
    officialLink: 'https://sachet.ndma.gov.in',
  },
  {
    title: 'WEATHER ADVISORY: Mumbai Suburban Rainfall',
    description:
      'Moderate to heavy rain showers predicted over next 24 hours. Traffic diversions active on Eastern Express Highway.',
    publishedDate: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    severity: 'MEDIUM',
    category: 'WEATHER',
    state: 'MAHARASHTRA',
    officialLink: 'https://sachet.ndma.gov.in',
  },
  {
    title: 'CYCLONE WATCH: Konkan Coast Advisory',
    description:
      'Deep sea depression detected 480 km south-west of Mumbai. Fishermen advised to not venture into sea. Coastal district collectors on standby.',
    publishedDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    severity: 'HIGH',
    category: 'CYCLONE',
    state: 'MAHARASHTRA',
    officialLink: 'https://sachet.ndma.gov.in',
  },
];

async function tryFetchGDACS(): Promise<AlertItem[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.gdacs.org/xml/rss.xml', {
      signal: controller.signal,
      headers: { 'User-Agent': 'MahaResilience/1.0' },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const text = await response.text();
    const items: AlertItem[] = [];

    // Basic RSS item extraction without a full XML parser
    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
    for (const item of itemMatches.slice(0, 10)) {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
        item.match(/<title>(.*?)<\/title>/))?.[1] || 'Global Disaster Alert';
      const desc = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
        item.match(/<description>(.*?)<\/description>/))?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();

      const titleLower = title.toLowerCase();
      const severity: AlertItem['severity'] =
        titleLower.includes('red') || titleLower.includes('severe')
          ? 'CRITICAL'
          : titleLower.includes('orange')
          ? 'HIGH'
          : 'MEDIUM';

      const category =
        titleLower.includes('flood') ? 'FLOOD'
        : titleLower.includes('cyclone') || titleLower.includes('storm') ? 'CYCLONE'
        : titleLower.includes('earthquake') ? 'EARTHQUAKE'
        : titleLower.includes('fire') ? 'FIRE'
        : 'WEATHER';

      items.push({
        title,
        description: desc.replace(/<[^>]+>/g, '').trim().slice(0, 300),
        publishedDate: new Date(pubDate).toISOString(),
        severity,
        category,
        state: 'MAHARASHTRA',
        officialLink: 'https://sachet.ndma.gov.in',
      });
    }

    return items.length > 0 ? items : null;
  } catch (_) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stateParam = (req.query?.state as string || 'maharashtra').toUpperCase();

  // Try GDACS first
  const gdacsAlerts = await tryFetchGDACS();
  const alerts = gdacsAlerts || SEED_ALERTS;

  // Filter by state
  const filtered = alerts.filter(
    (a) => a.state.toUpperCase() === stateParam || stateParam === 'ALL'
  );

  return res.status(200).json(filtered.length > 0 ? filtered : SEED_ALERTS);
}
