import re

with open('src/adapters/pdf.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the stopword counting loop with multi-lang dictionary loop
old_stopword_loop = """      let stopwordCount = 0;
      
      for (const w of words) {
        if (STOPWORDS.has(w)) stopwordCount++;
      }"""

new_stopword_loop = """      let maxStopwordCount = 0;
      
      for (const dict of Object.values(MICRO_DICTIONARIES)) {
        let count = 0;
        for (const w of words) {
          if (dict.has(w)) count++;
        }
        if (count > maxStopwordCount) maxStopwordCount = count;
      }
      
      const stopwordCount = maxStopwordCount;"""

content = content.replace(old_stopword_loop, new_stopword_loop)

# 2. Add calculateEntropy helper at bottom
entropy_func = """
function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const counts: Record<string, number> = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    counts[char] = (counts[char] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(counts)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}
"""
content += entropy_func

# 3. Add Entropy obfuscated_payload check right above Keyword Stuffing
old_keyword_stuffing = """      // 2. Keyword Stuffing (Stopword Density)"""

new_keyword_stuffing = """      // 1.5. Obfuscated Payload (Shannon Entropy)
      if (!type && str.length >= 32) {
        entropy = calculateEntropy(str);
        if (entropy > 5.0) {
          type = 'obfuscated_payload';
          notes = `String entropy is mathematically too high for natural language (${entropy.toFixed(2)} bits/char). Resembles encoded payload (Base64/Hex).`;
        }
      }

      // 2. Keyword Stuffing (Stopword Density)"""

content = content.replace(old_keyword_stuffing, new_keyword_stuffing)

# 4. Add entropy local variable
old_vars = """      let stopword_ratio: number | undefined = undefined;
      let char_density: number | undefined = undefined;"""

new_vars = """      let stopword_ratio: number | undefined = undefined;
      let char_density: number | undefined = undefined;
      let entropy: number | undefined = undefined;"""

content = content.replace(old_vars, new_vars)

# 5. Add entropy to segments.push
old_push = """          stopword_ratio,
          char_density,
          text_content: str,"""

new_push = """          stopword_ratio,
          char_density,
          entropy,
          text_content: str,"""

content = content.replace(old_push, new_push)

with open('src/adapters/pdf.ts', 'w', encoding='utf-8') as f:
    f.write(content)
