const s = 'VGhpcyBpcyBhIG1hbGljaW91cyBwYXlsb2FkIGhpZGRlbiBpbiBiYXNlNjQgdGhhdCBhbiBMTE0gbWlnaHQgZGVjb2Rl';
let counts = {};
for (let c of s) counts[c] = (counts[c] || 0) + 1;
let entropy = 0;
for (let count of Object.values(counts)) {
  let p = count / s.length;
  entropy -= p * Math.log2(p);
}
console.log(entropy);
