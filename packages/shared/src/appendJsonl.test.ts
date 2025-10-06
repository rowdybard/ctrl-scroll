import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { appendJsonl } from './appendJsonl';

describe('appendJsonl', () => {
  const testDir = join(tmpdir(), 'append-jsonl-test');
  const testFile = join(testDir, 'test.jsonl');
  
  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should create new file and append first object', async () => {
    const obj = { id: 1, name: 'test' };
    
    await appendJsonl(testFile, obj);
    
    const content = await fs.readFile(testFile, 'utf8');
    const lines = content.trim().split('\n');
    
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toEqual(obj);
  });

  it('should append multiple objects', async () => {
    const objects = [
      { id: 1, name: 'first' },
      { id: 2, name: 'second' },
      { id: 3, name: 'third' }
    ];
    
    for (const obj of objects) {
      await appendJsonl(testFile, obj);
    }
    
    const content = await fs.readFile(testFile, 'utf8');
    const lines = content.trim().split('\n');
    
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0])).toEqual(objects[0]);
    expect(JSON.parse(lines[1])).toEqual(objects[1]);
    expect(JSON.parse(lines[2])).toEqual(objects[2]);
  });

  it('should handle complex objects', async () => {
    const obj = {
      id: 'test-123',
      data: { nested: true, array: [1, 2, 3] },
      timestamp: new Date().toISOString()
    };
    
    await appendJsonl(testFile, obj);
    
    const content = await fs.readFile(testFile, 'utf8');
    const parsed = JSON.parse(content.trim());
    
    expect(parsed).toEqual(obj);
  });

  it('should create directory if it does not exist', async () => {
    const nestedFile = join(testDir, 'subdir', 'nested.jsonl');
    const obj = { test: 'data' };
    
    await appendJsonl(nestedFile, obj);
    
    // File should exist
    const content = await fs.readFile(nestedFile, 'utf8');
    expect(JSON.parse(content.trim())).toEqual(obj);
    
    // Directory should exist
    const dirExists = await fs.access(join(testDir, 'subdir')).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);
  });
});
