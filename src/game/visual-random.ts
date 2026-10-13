/** Independent visual randomness never consumes or changes the combat RNG. */
export function visualRandom(id: number, shot: number, slot: number) {
  let n = (Math.imul(id, 0x9e3779b9) ^ Math.imul(shot, 0x85ebca6b) ^ slot) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x21f0aaad);
  n = Math.imul(n ^ (n >>> 15), 0x735a2d97);
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
}
