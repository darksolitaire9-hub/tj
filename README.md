<div align="center">
  <h1>🛡️ TJ (Resume Armor)</h1>
  <p><strong>Zero-Trust, Local-First PDF Edge WAF for AI Systems</strong></p>
</div>

## About
**TJ** is a specialised, deterministic security assistant running entirely in the browser via WebAssembly. It protects Applicant Tracking Systems (ATS) and LLMs from hidden prompt injections, steganography, and deceptive optimization (keyword stuffing) embedded within PDFs.

By keeping all processing strictly local (no telemetry, no network calls, no external LLM dependencies), TJ adheres to strict OWASP guidelines for AI security boundaries. It serves as a static Edge WAF that sanitizes and explains document risk to human reviewers.

## Why TJ?
- **Zero-Trust & Local-First:** Parses PDFs locally using `pdf.js`. No files are ever uploaded.
- **Deterministic Engine:** Replaces fuzzy LLM-as-a-judge scoring with strict, mathematically verifiable rules, making it immune to "sleeper agent" attacks.
- **Mathematical Evaluation:** Rigorously tested in CI/CD using `bineval` golden tests.
- **Static Delivery:** Hosted on Cloudflare Pages for instant, zero-cost scaling and immunity to L7 DDoS attacks.

## Getting Started

```bash
npm install
npm run dev
```

## Contributing & Tests
We enforce atomic commits and strict golden testing for our deterministic rule engine.

```bash
# Run Vitest unit tests
npm run test

# Run Bineval golden safety checks
tools/bineval.exe audit --suite tests/tj_eval.yaml --verbose
```

---
*Built as a core security isomorphism for the Hope ecosystem.*
