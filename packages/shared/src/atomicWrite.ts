import { promises as fs } from 'fs';
import { dirname } from 'path';
import { randomUUID } from 'crypto';

export async function atomicWrite(path: string, data: string|Buffer) {
  await fs.mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, path);
}
