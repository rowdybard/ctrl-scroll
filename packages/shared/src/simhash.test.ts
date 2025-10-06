import { simhash, hamming } from './simhash';

describe('simhash', () => {
  it('should generate same hash for identical texts', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const hash1 = simhash(text);
    const hash2 = simhash(text);
    
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different texts', () => {
    const text1 = 'The quick brown fox jumps over the lazy dog';
    const text2 = 'A completely different sentence with different words';
    
    const hash1 = simhash(text1);
    const hash2 = simhash(text2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should generate similar hashes for similar texts', () => {
    const text1 = 'The quick brown fox jumps over the lazy dog';
    const text2 = 'The quick brown fox jumps over the lazy cat'; // Only one word different
    
    const hash1 = simhash(text1);
    const hash2 = simhash(text2);
    const distance = hamming(hash1, hash2);
    
    expect(distance).toBeLessThanOrEqual(3);
  });

  it('should handle empty text', () => {
    const hash = simhash('');
    expect(typeof hash).toBe('bigint');
  });

  it('should handle case insensitive matching', () => {
    const text1 = 'The Quick Brown Fox';
    const text2 = 'the quick brown fox';
    
    const hash1 = simhash(text1);
    const hash2 = simhash(text2);
    
    expect(hash1).toBe(hash2);
  });
});

describe('hamming', () => {
  it('should return 0 for identical hashes', () => {
    const hash = 0x1234567890ABCDEFn;
    const distance = hamming(hash, hash);
    
    expect(distance).toBe(0);
  });

  it('should return 64 for completely different hashes', () => {
    const hash1 = 0x0000000000000000n;
    const hash2 = 0xFFFFFFFFFFFFFFFFn;
    
    const distance = hamming(hash1, hash2);
    
    expect(distance).toBe(64);
  });

  it('should return correct distance for known hashes', () => {
    const hash1 = 0x0000000000000000n; // All zeros
    const hash2 = 0x0000000000000001n; // One bit different
    
    const distance = hamming(hash1, hash2);
    
    expect(distance).toBe(1);
  });

  it('should be symmetric', () => {
    const hash1 = 0x1234567890ABCDEFn;
    const hash2 = 0xFEDCBA0987654321n;
    
    const distance1 = hamming(hash1, hash2);
    const distance2 = hamming(hash2, hash1);
    
    expect(distance1).toBe(distance2);
  });
});
