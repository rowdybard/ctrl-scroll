import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { atomicWrite } from './atomicWrite';

describe('atomicWrite', () => {
  const testDir = join(tmpdir(), 'atomic-write-test');
  
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

  it('should create directory and write file atomically', async () => {
    const testFile = join(testDir, 'subdir', 'test.json');
    const testData = '{"test": "data"}';
    
    await atomicWrite(testFile, testData);
    
    // File should exist
    const content = await fs.readFile(testFile, 'utf8');
    expect(content).toBe(testData);
    
    // Directory should exist
    const dirExists = await fs.access(join(testDir, 'subdir')).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);
  });

  it('should handle concurrent writes without corruption', async () => {
    const testFile = join(testDir, 'concurrent.json');
    
    // Write multiple files concurrently
    const promises = Array.from({ length: 10 }, (_, i) => 
      atomicWrite(testFile, JSON.stringify({ id: i, data: `test-${i}` }))
    );
    
    await Promise.all(promises);
    
    // File should exist and contain valid JSON
    const content = await fs.readFile(testFile, 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed).toHaveProperty('id');
    expect(parsed).toHaveProperty('data');
  });

  it('should handle Buffer data', async () => {
    const testFile = join(testDir, 'buffer.bin');
    const testData = Buffer.from('test binary data');
    
    await atomicWrite(testFile, testData);
    
    const content = await fs.readFile(testFile);
    expect(content).toEqual(testData);
  });
});
