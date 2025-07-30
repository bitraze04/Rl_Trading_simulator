const API_BASE = "http://localhost:5000";
let trainingInterval = null;
let isTraining = false;

// DOM ELEMENTS
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

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkTrainingStatus();
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
    window.addEventListener('click', e => {
        if (e.target === errorModal) toggleErrorModal(false);
    });
}

// --- TAB NAVIGATION ---
function switchTab(tabName) {
    tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === `${tabName}-tab`));
}

// --- FILE UPLOAD LOGIC ---
function handleDragOver(e) {
    e.preventDefault();
    uploadZone.classList.add('dragover');
}
function handleDragLeave(e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
}
function handleDrop(e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
}
function handleFileSelect() {
    const file = fileInput.files[0];
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
    try {
        const res = await fetch(`${API_BASE}/upload-csv`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        showUploadStatus('Upload successful!', false);
    } catch (err) {
        showUploadStatus('Upload failed: ' + err.message, true);
        showErrorModal('Upload failed: ' + err.message);
    }
}

function showUploadStatus(msg, isError = false) {
    uploadStatus.style.display = 'block';
    uploadStatus.textContent = msg;
    uploadStatus.className = 'upload-status' + (isError ? ' error' : ' success');
}

// --- TRAINING START/STOP ---
async function startTraining() {
    if (isTraining) return;
    const params = {
        initialBalance: Number(document.getElementById('initial-balance').value),
        episodes: Number(document.getElementById('episodes').value),
        learningRate: Number(document.getElementById('learning-rate').value),
        gamma: Number(document.getElementById('gamma').value),
        epsilon: Number(document.getElementById('epsilon').value),
        epsilonDecay: Number(document.getElementById('epsilon-decay').value)
    };
    if (!(params.initialBalance && params.episodes && params.learningRate && params.gamma)) {
        showErrorModal('Please provide all configuration parameters.');
        return;
    }
    try {
        startTrainingBtn.disabled = true;
        stopTrainingBtn.disabled = false;
        showTrainingProgress(0, 0, 'Starting...');
        isTraining = true;
        const res = await fetch(`${API_BASE}/start-training`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(params)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Training failed!');
        pollTrainingStatus();
    } catch (err) {
        showErrorModal('Training could not start: ' + err.message);
        startTrainingBtn.disabled = false;
        stopTrainingBtn.disabled = true;
        hideTrainingProgress();
        isTraining = false;
    }
}

async function stopTraining() {
    try {
        if (!isTraining) return;
        await fetch(`${API_BASE}/stop-training`, { method: 'POST' });
    } catch (err) {}
    isTraining = false;
    hideTrainingProgress();
    startTrainingBtn.disabled = false;
    stopTrainingBtn.disabled = true;
}

// --- POLL TRAINING STATUS ---
function pollTrainingStatus() {
    clearInterval(trainingInterval);
    trainingInterval = setInterval(checkTrainingStatus, 1500);
}
async function checkTrainingStatus() {
    try {
        const res = await fetch(`${API_BASE}/training-status`);
        if (!res.ok) throw new Error('Cannot reach server.');
        const state = await res.json();
        if (state.is_training) {
            showTrainingProgress(state.progress, state.current_episode, 'Training...');
            startTrainingBtn.disabled = true;
            stopTrainingBtn.disabled = false;
            isTraining = true;
        } else {
            clearInterval(trainingInterval);
            startTrainingBtn.disabled = false;
            stopTrainingBtn.disabled = true;
            isTraining = false;
            hideTrainingProgress();
            fetchAndRenderResults();
        }
    } catch (err) {
        clearInterval(trainingInterval);
        hideTrainingProgress();
        showErrorModal('Error fetching status: ' + err.message);
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

async function fetchAndRenderResults() {
    try {
        const res = await fetch(`${API_BASE}/training-results`);
        if (!res.ok) {
            resultsContent.innerHTML = `<p class="no-results">No training results available. Complete training to view results.</p>`;
            return;
        }
        const results = await res.json();
        renderResults(results);
    } catch (err) {
        resultsContent.innerHTML = `<p class="no-results">Could not load results. ${err.message}</p>`;
    }
}

function renderResults(results) {
    if (!results) {
        resultsContent.innerHTML = `<p class="no-results">No training results available.</p>`;
        return;
    }
    let cards = `
        <div class="results-grid">
            <div class="result-card">
                <h4>Final Balance</h4>
                <div class="value">${results.finalBalance !== undefined ? results.finalBalance.toFixed(2) : 'N/A'}</div>
            </div>
            <div class="result-card">
                <h4>Total Reward</h4>
                <div class="value">${results.totalReward !== undefined ? results.totalReward.toFixed(2) : 'N/A'}</div>
            </div>
            <div class="result-card">
                <h4>Episodes</h4>
                <div class="value">${results.episodesCompleted || '?'}</div>
            </div>
        </div>
    `;
    let chartSection = '';
    if (results.portfolioHistory && Array.isArray(results.portfolioHistory)) {
        chartSection = `
            <div class="chart-container">
                <h4>Portfolio Value Over Time</h4>
                <canvas id="portfolio-chart"></canvas>
            </div>
        `;
    }
    const downloadBtn = `
        <div class="download-section">
            <a href="${API_BASE}/download-qtable" class="btn btn-success" download>
                Download Q-Table</a>
        </div>
    `;
    resultsContent.innerHTML = cards + chartSection + downloadBtn;
    if (chartSection) renderPortfolioChart(results.portfolioHistory);
}

function renderPortfolioChart(portfolio) {
    if (!window.Chart || !document.getElementById('portfolio-chart')) return;
    new Chart(document.getElementById('portfolio-chart').getContext('2d'), {
        type: 'line',
        data: {
            labels: portfolio.map((_, i) => i + 1),
            datasets: [{
                label: 'Portfolio Value',
                data: portfolio,
                borderColor: '#16a34a',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { display: true, title: { display: true, text: 'Step' } },
                y: { display: true, title: { display: true, text: 'Value' } }
            }
        }
    });
}

function showErrorModal(msg) {
    errorMessage.textContent = msg;
    toggleErrorModal(true);
}
function toggleErrorModal(show) {
    errorModal.style.display = show ? 'flex' : 'none';
}