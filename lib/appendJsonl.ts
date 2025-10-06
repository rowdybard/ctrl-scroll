import { promises as fs } from 'fs';
import { dirname } from 'path';
import { atomicWrite } from './atomicWrite';

export async function appendJsonl(path: string, obj: any) {
  await fs.mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify(obj) + '\n';
  let prior = '';
  try { prior = await fs.readFile(path, 'utf8'); } catch {}
  await atomicWrite(path, prior + line);
}
