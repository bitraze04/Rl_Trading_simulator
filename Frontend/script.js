// Use the same host family everywhere to avoid origin mismatches.
const API_BASE = "http://127.0.0.1:5000";

let trainingInterval = null;
let isTraining = false;
let uploadOk = false;
// ADDED: keep a handle to the chart so we can safely recreate it
let portfolioChart = null;

// DOM elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
const startTrainingBtn = document.getElementById('start-training-btn');
const stopTrainingBtn = document.getElementById('stop-training-btn');
const trainingProgress = document.getElementById('training-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const currentEpisode = document.getElementById('current-episode');
const trainingStatus = document.getElementById('training-status');
const resultsContent = document.getElementById('results-content');
const errorModal = document.getElementById('error-modal');
const errorMessage = document.getElementById('error-message');
const closeErrorModal = document.getElementById('close-error-modal');

// Param inputs
const inputInitialBalance = document.getElementById('initial-balance');
const inputEpisodes = document.getElementById('episodes');
const inputLearningRate = document.getElementById('learning-rate');
const inputGamma = document.getElementById('gamma');
const inputEpsilon = document.getElementById('epsilon');
const inputEpsilonDecay = document.getElementById('epsilon-decay');

// -----------------------------
// Persist tab and upload state
// -----------------------------
function setActiveTab(tabName) {
  localStorage.setItem('activeTab', tabName);
  switchTabInternal(tabName);
}
function getActiveTab() {
  return localStorage.getItem('activeTab') || 'upload';
}
function setUploadOk(val) {
  uploadOk = val;
  localStorage.setItem('uploadOk', val ? '1' : '');
}
function getUploadOk() {
  return localStorage.getItem('uploadOk') === '1';
}
// The internal switcher does not write to storage to avoid recursion
function switchTabInternal(tabName) {
  tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
  tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === `${tabName}-tab`));
}
// Override used by UI events (persists to storage)
function switchTab(tabName) {
  setActiveTab(tabName);
}

// Unified fetch helper (no throws)
async function robustFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    return { ok: res.ok, status: res.status, json, text, error: null };
  } catch (e) {
    return { ok: false, status: 0, json: null, text: null, error: e };
  }
}

// Init – restore tab/upload state, then health check
document.addEventListener('DOMContentLoaded', async () => {
  initializeEventListeners();
  // Restore persisted state
  uploadOk = getUploadOk();
  startTrainingBtn.disabled = !uploadOk;
  switchTabInternal(getActiveTab());
  // Health check (do not spam modal—only show once if unreachable)
  const ping = await robustFetch(`${API_BASE}/training-status`);
  if (!ping.ok) {
    const msg = ping.error ? `Network/CORS: ${ping.error.message}` : `Status: ${ping.status}`;
    showErrorModal(`Cannot reach API at ${API_BASE}. ${msg}`);
  } else {
    checkTrainingStatus();
  }
});

function initializeEventListeners() {
  tabButtons.forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  );
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', handleDragOver);
  uploadZone.addEventListener('dragleave', handleDragLeave);
  uploadZone.addEventListener('drop', handleDrop);
  fileInput.addEventListener('change', handleFileSelect);
  startTrainingBtn.addEventListener('click', startTraining);
  stopTrainingBtn.addEventListener('click', stopTraining);
  closeErrorModal.addEventListener('click', () => toggleErrorModal(false));
  window.addEventListener('click', e => { if (e.target === errorModal) toggleErrorModal(false); });
}

// Upload
function handleDragOver(e) { e.preventDefault(); uploadZone.classList.add('dragover'); }
function handleDragLeave(e) { e.preventDefault(); uploadZone.classList.remove('dragover'); }
function handleDrop(e) {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    fileInput.files = e.dataTransfer.files;
    handleFileSelect();
  }
}
function handleFileSelect() {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    showUploadStatus('File too large (max 10MB)', true);
    return;
  }
  uploadCsvFile(file);
}
async function uploadCsvFile(file) {
  showUploadStatus('Uploading...', false);
  const formData = new FormData();
  formData.append('file', file);
  const res = await robustFetch(`${API_BASE}/upload-csv`, { method: 'POST', body: formData });
  if (!res.ok) {
    const msg = (res.json && (res.json.error || res.json.message)) || res.text || (res.error ? res.error.message : 'Upload failed');
    setUploadOk(false);
    startTrainingBtn.disabled = true;
    showUploadStatus('Upload failed: ' + msg, true);
    showErrorModal('Upload failed: ' + msg);
    return;
  }
  setUploadOk(true);
  startTrainingBtn.disabled = false;
  showUploadStatus('Upload successful!', false);
  setActiveTab('configure');
  setTimeout(() => { if (uploadStatus) uploadStatus.style.display = 'none'; }, 2500);
}
function showUploadStatus(msg, isError = false) {
  uploadStatus.style.display = 'block';
  uploadStatus.textContent = msg;
  uploadStatus.className = 'upload-status' + (isError ? ' error' : ' success');
}

// Training
async function startTraining() {
  if (isTraining) return;
  if (!uploadOk) {
    showErrorModal('Please upload a CSV before starting training.');
    return;
  }
  // Read current form values; these override server defaults
  const params = {
    initialBalance: Number(inputInitialBalance.value),
    episodes: Number(inputEpisodes.value),
    learningRate: Number(inputLearningRate.value),
    gamma: Number(inputGamma.value),
    epsilon: Number(inputEpsilon.value),
    epsilonDecay: Number(inputEpsilonDecay.value)
  };
  for (const [k, v] of Object.entries(params)) {
    if (!Number.isFinite(v)) {
      showErrorModal(`Parameter "${k}" must be a valid number.`);
      return;
    }
  }
  startTrainingBtn.disabled = true;
  stopTrainingBtn.disabled = false;
  showTrainingProgress(0, 0, 'Starting...');
  isTraining = true;
  const res = await robustFetch(`${API_BASE}/start-training`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const msg = (res.json && (res.json.error || res.json.message)) || res.text || 'Training failed';
    showErrorModal('Training could not start: ' + msg);
    startTrainingBtn.disabled = !uploadOk;
    stopTrainingBtn.disabled = true;
    hideTrainingProgress();
    isTraining = false;
    return;
  }
  setActiveTab('training');
  pollTrainingStatus();
}
async function stopTraining() {
  if (!isTraining) return;
  await robustFetch(`${API_BASE}/stop-training`, { method: 'POST' });
  isTraining = false;
  hideTrainingProgress();
  startTrainingBtn.disabled = !uploadOk;
  stopTrainingBtn.disabled = true;
}
function pollTrainingStatus() {
  clearInterval(trainingInterval);
  trainingInterval = setInterval(checkTrainingStatus, 1500);
}
async function checkTrainingStatus() {
  const res = await robustFetch(`${API_BASE}/training-status`);
  if (!res.ok) {
    clearInterval(trainingInterval);
    hideTrainingProgress();
    const msg = (res.json && (res.json.error || res.json.message)) || res.text || (res.error ? res.error.message : 'Status error');
    showErrorModal('Error fetching status: ' + msg);
    return;
  }
  const state = res.json || {};
  if (state.is_training) {
    showTrainingProgress(state.progress, state.current_episode, 'Training...');
    startTrainingBtn.disabled = true;
    stopTrainingBtn.disabled = false;
    isTraining = true;
    setActiveTab('training');
  } else {
    clearInterval(trainingInterval);
    startTrainingBtn.disabled = !uploadOk;
    stopTrainingBtn.disabled = true;
    isTraining = false;
    hideTrainingProgress();
    if (state.results) {
      renderResults(state.results);
      setActiveTab('results');
      return;
    }
    const r = await robustFetch(`${API_BASE}/training-results`);
    if (r.ok && r.status === 200) {
      renderResults(r.json);
      setActiveTab('results');
    } else if (r.status === 202) {
      resultsContent.innerHTML = `<p class="no-results">Results are still being prepared. Please wait...</p>`;
      setTimeout(checkTrainingStatus, 1000);
    } else {
      const msg = (r.json && (r.json.lastError || r.json.error || r.json.message)) || r.text || (r.error ? r.error.message : 'No training results available.');
      resultsContent.innerHTML = `<p class="no-results">${msg}</p>`;
    }
  }
}
function showTrainingProgress(progress, ep, statusText) {
  trainingProgress.style.display = 'block';
  progressFill.style.width = `${progress || 0}%`;
  progressText.textContent = `${Math.round(progress || 0)}%`;
  currentEpisode.textContent = ep || 0;
  trainingStatus.textContent = statusText || '...';
}
function hideTrainingProgress() {
  trainingProgress.style.display = 'none';
}

// Results
function safeNum(v) { return (typeof v === 'number' && isFinite(v)) ? v.toFixed(2) : 'N/A'; }

// CHANGED: renderResults coerces data to numbers and ensures a canvas exists
function renderResults(results) {
  if (!results) {
    resultsContent.innerHTML = `<p class="no-results">No training results available.</p>`;
    return;
  }

  // Coerce and validate series for Chart.js
  const raw = Array.isArray(results.portfolioHistory) ? results.portfolioHistory : [];
  const portfolio = raw.map(v => (v == null ? null : Number(v))).filter(v => Number.isFinite(v));

  const cards = `
    <div class="results-grid">
      <div class="result-card">
        <h4>Final Balance</h4>
        <div class="value">${safeNum(results.finalBalance)}</div>
      </div>
      <div class="result-card">
        <h4>Total Reward</h4>
        <div class="value">${safeNum(results.totalReward)}</div>
      </div>
      <div class="result-card">
        <h4>Episodes</h4>
        <div class="value">${(typeof results.episodesCompleted === 'number') ? results.episodesCompleted : '?'}</div>
      </div>
    </div>
  `;

  // Always inject a canvas so the chart renders inline (no popups)
  const chartSection = `
    <div class="chart-container">
      <h4>Portfolio Value Over Time</h4>
      <canvas id="portfolio-chart"></canvas>
      ${portfolio.length === 0 ? '<p class="no-results">No portfolio series to plot.</p>' : ''}
    </div>
  `;

  const downloadBtn = `
    <div class="download-section">
      <a href="${API_BASE}/download-qtable" class="btn btn-success" download>Download Q-Table</a>
    </div>
  `;

  resultsContent.innerHTML = cards + chartSection + downloadBtn;

  if (portfolio.length > 0) renderPortfolioChart(portfolio);
}

// CHANGED: renderPortfolioChart safely recreates the chart instance
function renderPortfolioChart(portfolio) {
  if (!window.Chart || !document.getElementById('portfolio-chart')) return;

  // Destroy any existing chart to avoid overlay or silent failures
  if (portfolioChart && typeof portfolioChart.destroy === 'function') {
    portfolioChart.destroy();
  }

  const ctx = document.getElementById('portfolio-chart').getContext('2d');
  const labels = portfolio.map((_, i) => i + 1);

  portfolioChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Portfolio Value',
        data: portfolio,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.08)',
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.15,
        fill: true
      }]
    },
    options: {
      responsive: true,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: true } },
      scales: {
        x: { display: true, title: { display: true, text: 'Step' } },
        y: { display: true, title: { display: true, text: 'Value' } }
      }
    }
  });
}

// Modal
function showErrorModal(msg) { errorMessage.textContent = msg; toggleErrorModal(true); }
function toggleErrorModal(show) { errorModal.style.display = show ? 'flex' : 'none'; }