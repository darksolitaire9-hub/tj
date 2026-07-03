const s1 = 'VGhpcyBpcyBhIG1hbGljaW91cyBwYXlsb2FkIGhpZGRlbiBpbiBiYXNlNjQgdGhhdCBhbiBMTE0gbWlnaHQgZGVjb2Rl';
const s2 = 'Senior Software Engineer Resume. Skills: React, Node.js, TypeScript, PostgreSQL. I am a very good engineer.';

function getEntropy(s) {
  let counts = {};
  for (let c of s) counts[c] = (counts[c] || 0) + 1;
  let entropy = 0;
  for (let count of Object.values(counts)) {
    let p = count / s.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

console.log("Base64:", getEntropy(s1));
console.log("Normal:", getEntropy(s2));
