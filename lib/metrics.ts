import { promises as fs } from 'fs';
import { atomicWrite } from './atomicWrite';

export async function incrMetric(file: string, field: 'impressions'|'clicks') {
  let data = { impressions: 0, clicks: 0 };
  try { data = JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
  (data as any)[field] += 1;
  await atomicWrite(file, JSON.stringify(data));
}
