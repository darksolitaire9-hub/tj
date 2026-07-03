<script setup lang="ts">
import { ref } from 'vue'
import { scanPDFBuffer } from './adapters/pdf'
import { evaluateScan } from './core/tj_engine'
import type { TJOutput } from './types'

const isDragging = ref(false)
const isScanning = ref(false)
const result = ref<TJOutput | null>(null)
const errorMsg = ref('')

async function handleFile(file: File) {
  if (file.type !== 'application/pdf') {
    errorMsg.value = 'Please upload a valid PDF file.'
    return
  }
  
  errorMsg.value = ''
  isScanning.value = true
  result.value = null
  
  try {
    const arrayBuffer = await file.arrayBuffer()
    const scanResult = await scanPDFBuffer(arrayBuffer, file.name)
    result.value = evaluateScan(scanResult)
  } catch (err: any) {
    console.error(err)
    errorMsg.value = err.message || 'Failed to scan the document.'
  } finally {
    isScanning.value = false
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleFile(file)
}
</script>

<template>
  <main class="container">
    <header class="header">
      <h1>TJ <span>Resume Armor</span></h1>
      <p>Client-side PDF scanner for hidden prompt injections, micro-fonts, and ATS steganography.</p>
      <a href="https://github.com/darksolitaire9-hub/tj" target="_blank" class="github-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        View on GitHub (darksolitaire9-hub)
      </a>
    </header>

    <section 
      class="dropzone glass-panel" 
      :class="{ dragging: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <div v-if="isScanning" class="loader">
        <div class="spinner"></div>
        <p>Scanning rendering layers...</p>
      </div>
      <div v-else class="upload-prompt">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="upload-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <h3>Drop PDF resume here</h3>
        <p>or click to browse</p>
        <input type="file" accept="application/pdf" @change="onChange" class="file-input" />
      </div>
    </section>

    <div v-if="errorMsg" class="error-msg glass-panel">
      {{ errorMsg }}
    </div>

    <section v-if="result" class="results-dashboard glass-panel">
      <div class="results-header">
        <h2>Scan Results</h2>
        <span class="badge" :class="result.risk_level">
          {{ result.risk_level.replace('_', ' ').toUpperCase() }}
        </span>
      </div>
      
      <p class="summary-text"><strong>{{ result.summary }}</strong></p>
      <p class="rationale-text">{{ result.rationale }}</p>

      <div class="recommendation">
        <h4>Recommendation</h4>
        <p>{{ result.global_recommendation }}</p>
      </div>

      <div v-if="result.segments.length > 0" class="segments-list">
        <h3>Suspicious Segments</h3>
        <div v-for="seg in result.segments" :key="seg.id" class="segment-item glass-panel">
          <div class="segment-header">
            <span class="badge" :class="seg.risk || 'low'">{{ (seg.risk || 'low').toUpperCase() }} RISK</span>
            <span class="segment-type">{{ seg.type.replace('_', ' ') }}</span>
            <span class="segment-page">Page {{ seg.page }}</span>
          </div>
          <div class="segment-body">
            <p><strong>Explanation:</strong> {{ seg.explanation }}</p>
            <p><strong>Action:</strong> {{ seg.recommended_action }}</p>
            <div class="segment-context">
              <code>{{ seg.text_content }}</code>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="about-section glass-panel">
      <h3>About TJ Resume Armor</h3>
      <p>TJ Resume Armor is an open-source, zero-trust PDF resume scanner built by <a href="https://github.com/darksolitaire9-hub" target="_blank">darksolitaire9-hub (Ybg)</a>. It is focused on local-first, deterministic LLM safety tooling.</p>
      <p>It detects hidden prompt injections, micro-fonts, multilingual steganography, and encoded payloads before they hit LLMs or ATS systems. All scanning happens directly in your browser using pure statistical mathematics and physical bounding box constraints.</p>
      <p>To learn more, contribute, or star the project, visit the <a href="https://github.com/darksolitaire9-hub/tj" target="_blank">TJ Resume Armor repository on GitHub</a>.</p>
    </footer>
  </main>
</template>

<style scoped>
.header {
  text-align: center;
  margin-bottom: 40px;
}
.header h1 {
  font-size: 3rem;
  letter-spacing: -0.02em;
}
.header h1 span {
  color: var(--brand-accent);
  font-style: italic;
}
.header p {
  max-width: 600px;
  margin: 0 auto;
  font-size: 1.1rem;
}

@media (max-width: 600px) {
  .header h1 {
    font-size: 2.2rem;
  }
  .header p {
    font-size: 1rem;
  }
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}
.github-link:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--brand-accent);
}

.about-section {
  margin-top: 40px;
  padding: 30px;
  text-align: left;
}
.about-section h3 {
  margin-bottom: 16px;
  color: var(--brand-accent);
}
.about-section p {
  margin-bottom: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}
.about-section a {
  color: var(--brand-accent);
  text-decoration: none;
}
.about-section a:hover {
  text-decoration: underline;
}

.dropzone {
  position: relative;
  text-align: center;
  padding: 60px 20px;
  border: 2px dashed var(--border-color);
  transition: all 0.3s ease;
  margin-bottom: 40px;
}
.dropzone.dragging {
  border-color: var(--brand-accent);
  background: rgba(59, 130, 246, 0.1);
}
.file-input {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  opacity: 0; cursor: pointer;
}
.upload-icon {
  color: var(--brand-accent);
  margin-bottom: 16px;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.1);
  border-radius: 50%;
  border-top-color: var(--brand-accent);
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

.results-dashboard {
  animation: slideUp 0.5s ease;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 16px;
}

.recommendation {
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--brand-accent);
  margin: 24px 0;
}

.segments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.segment-item {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
}
.segment-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.segment-type {
  font-weight: 500;
  color: var(--text-primary);
  text-transform: capitalize;
}
.segment-page {
  color: var(--text-secondary);
  font-size: 0.9rem;
}
.segment-context {
  margin-top: 12px;
  padding: 12px;
  background: #000;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #a5b4fc;
  word-break: break-all;
}

.error-msg {
  border-color: var(--risk-high);
  color: var(--risk-high);
  text-align: center;
  margin-bottom: 24px;
}
</style>
