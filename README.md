<div align="center">
  <h1>🛡️ TJ (Resume Armor)</h1>
  <p><strong>Zero-Trust, Local-First PDF Edge WAF for AI Systems</strong></p>
</div>

## Table of Contents
- [About](#about)
- [Scientific Foundation & Attribution](#scientific-foundation--attribution)
- [Why TJ?](#why-tj)
- [Getting Started](#getting-started)
- [Contributing & Tests](#contributing--tests)

## About
**TJ** is a specialised, deterministic security assistant running entirely in the browser via WebAssembly. It protects Applicant Tracking Systems (ATS) and LLMs from hidden prompt injections, steganography, and deceptive optimization (keyword stuffing) embedded within PDFs.

By keeping all processing strictly local (no telemetry, no network calls, no external LLM dependencies), TJ adheres to strict OWASP guidelines for AI security boundaries. It serves as a static Edge WAF that sanitizes and explains document risk to human reviewers.

## Scientific Foundation & Attribution
TJ's deterministic geometric detection rules are grounded in and inspired by the seminal empirical research paper:
> **[Measuring Real-World Prompt Injection Attacks in LLM-based Resume Screening](https://arxiv.org/abs/2605.28999v1)**  
> *Mohan Zhang, Yuqi Jia, Zhen Tan, Steven Jiang, Neil Zhenqiang Gong, Tianlong Chen, Dawn Song* (arXiv:2605.28999, May 2026).

Key empirical insights from their 3-year study across **196,682 real-world resumes** from hireEZ directly inform our detection architecture:
1. **Real-World Attack Growth:** Approximately **1 in 100 resumes (~1%)** in production environments already contain hidden steganographic text, doubling from 0.6% in 2019 to 1.2% in 2024.
2. **The "Quiet Attack" Paradigm:** Over **90% of hidden injections do not use explicit imperative commands** (e.g., *"ignore previous instructions"*). Instead, attackers silently embed keyword stuffing, fabricated experience, and copied job descriptions to subtly influence ATS scoring without triggering semantic LLM guardrails.
3. **The Four Steganographic Vectors:** The study categorized hidden resume attacks into four physical vectors, which TJ natively detects via deterministic geometric bounding-box mathematics:
   - **Color-Based Hiding:** Text colored to match the page background (e.g., white-on-white fill).
   - **Size-Based Hiding:** Sub-visible micro-typography ($\le$ 1pt font size).
   - **Position-Based Hiding:** Coordinates translated physically outside visible page viewport boundaries.
   - **Layer-Based Hiding:** Text occluded beneath structural PDF rendering layers or compressed with anomalous character density.

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
# Run deterministic engine tests
npm run test:tj_engine

# Run Bineval golden safety checks
tools/bineval.exe audit --suite tests/tj_eval.yaml --verbose
```

---
*Built as a core security isomorphism for the Hope ecosystem.*
