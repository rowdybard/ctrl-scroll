function h64(s: string): bigint {
  let h1 = 0xdeadbeef ^ s.length, h2 = 0x41c6ce57 ^ s.length;
  for (let i=0;i<s.length;i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = (h1 ^ (h1>>>16)) >>> 0; h2 = (h2 ^ (h2>>>13)) >>> 0;
  return (BigInt(h1) << 32n) | BigInt(h2);
}

export function simhash(text: string): bigint {
  const toks = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const vec = new Array<number>(64).fill(0);
  for (const t of toks) {
    const h = h64(t);
    for (let i=0n;i<64n;i++) {
      vec[Number(i)] += ((h >> i) & 1n) ? 1 : -1;
    }
  }
  let out = 0n;
  for (let i=0;i<64;i++) if (vec[i] > 0) out |= (1n << BigInt(i));
  return out;
}

export function hamming(a: bigint, b: bigint): number {
  let x = a ^ b, c = 0;
  while (x) { x &= (x - 1n); c++; }
  return c;
}
