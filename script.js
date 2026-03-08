// CI/CD Monitoring Dashboard
// Vanilla JS + Chart.js

// -----------------------------
// Configuration & API Setup
// -----------------------------

const API_BASE_URL = 'http://localhost:5002/api';

// Mock data for fallback (kept for reference)
const PIPELINES = [
  { id: "pipeline-core-api", name: "Core API", env: "prod" },
  { id: "pipeline-web-frontend", name: "Web Frontend", env: "prod" },
  { id: "pipeline-worker-jobs", name: "Worker Jobs", env: "staging" },
  { id: "pipeline-mobile-app", name: "Mobile App", env: "staging" },
  { id: "pipeline-data-pipeline", name: "Data Pipeline", env: "prod" }
];

const TRIGGERED_BY = [
  "github-actions[bot]",
  "jenkins-ci",
  "circleci",
  "gitlab-runner",
  "yash.raj",
  "platform-team",
  "release-bot"
];

const STATUS = {
  SUCCESS: "success",
  FAIL: "failed",
  RUNNING: "running"
};

const MAX_BUILDS = 40; // Max rows kept in the table
const UPDATE_INTERVAL_MS = 5000; // Real-time update interval

// -----------------------------
// API Functions
// -----------------------------

async function fetchDashboardMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/dashboard`);
    if (!response.ok) throw new Error('Failed to fetch dashboard metrics');
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return null;
  }
}

async function fetchRecentBuilds() {
  try {
    const response = await fetch(`${API_BASE_URL}/builds/recent`);
    if (!response.ok) throw new Error('Failed to fetch recent builds');
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent builds:', error);
    return [];
  }
}

async function fetchPipelines() {
  try {
    const response = await fetch(`${API_BASE_URL}/pipelines`);
    if (!response.ok) throw new Error('Failed to fetch pipelines');
    return await response.json();
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return [];
  }
}

// -----------------------------
// State
// -----------------------------

/** @type {Array<Build>} */
let builds = [];
let pipelines = [];

let filters = {
  pipelineId: "all",
  env: "all",
  search: ""
};

// Charts instances
let buildHistoryChart;
let deploymentPieChart;
let buildsPerPipelineChart;

// Types via JSDoc for clarity
/**
 * @typedef {"success" | "failed" | "running"} BuildStatus
 */

/**
 * @typedef {Object} Build
 * @property {string} id
 * @property {string} pipelineId
 * @property {string} pipelineName
 * @property {string} env
 * @property {string} triggeredBy
 * @property {BuildStatus} status
 * @property {number} durationSeconds
 * @property {Date} timestamp
 * @property {boolean} isDeployment
 */

// -----------------------------
// Utility Functions
// -----------------------------

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Debounce utility to optimize rapid input events
function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
// Zero pad numbers
function pad(num, length = 4) {
  return String(num).padStart(length, "0");
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) {
    return s ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

function formatTimestamp(date) {
  return date.toLocaleString(undefined, {
    hour12: false,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

/**
 * Animated number counting
 * @param {HTMLElement} el
 * @param {number} newValue
 * @param {number} durationMs
 * @param {(v:number)=>string} formatter
 */
function animateCounter(el, newValue, durationMs = 600, formatter = v => String(v)) {
  const prevValue = Number(el.dataset.value || "0");
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / durationMs);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3);
    const value = prevValue + (newValue - prevValue) * eased;
    el.textContent = formatter(value);
    el.dataset.value = String(newValue);
    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// -----------------------------
// Data Transformation (for API data)
// -----------------------------

function transformBuildData(apiBuilds) {
  return apiBuilds.map(build => ({
    id: `#${String(build._id).slice(-4).toUpperCase()}`,
    pipelineId: build.pipelineId?._id || build.pipelineId,
    pipelineName: build.pipelineId?.name || 'Unknown',
    env: 'prod', // Default for now, could be enhanced
    triggeredBy: build.triggeredBy,
    status: build.status,
    durationSeconds: build.duration,
    timestamp: new Date(build.timestamp),
    isDeployment: Math.random() < 0.4 && build.status !== STATUS.RUNNING
  }));
}

function transformPipelineData(apiPipelines) {
  return apiPipelines.map(pipeline => ({
    id: pipeline._id,
    name: pipeline.name,
    env: 'prod' // Default for now
  }));
}

// -----------------------------
// Legacy Functions (kept for compatibility)
// -----------------------------

let buildCounter = 1;

function generateRandomBuild() {
  const pipeline = randomChoice(pipelines.length > 0 ? pipelines : PIPELINES);

  // Biased probabilities: success > running > failed
  const r = Math.random();
  /** @type {BuildStatus} */
  let status;
  if (r < 0.65) status = STATUS.SUCCESS;
  else if (r < 0.85) status = STATUS.RUNNING;
  else status = STATUS.FAIL;

  const isDeployment = Math.random() < 0.4 && status !== STATUS.RUNNING;

  const durationSeconds = randomInt(45, 1200); // 45s - 20m

  const build = {
    id: `#${pad(buildCounter++, 4)}`,
    pipelineId: pipeline.id || pipeline._id,
    pipelineName: pipeline.name,
    env: pipeline.env || 'prod',
    triggeredBy: randomChoice(TRIGGERED_BY),
    status,
    durationSeconds,
    timestamp: new Date(),
    isDeployment
  };

  return build;
}

function seedInitialData() {
  // This function is no longer needed as we use real data
  console.log('Using real API data instead of seeded data');
}

// -----------------------------
// DOM Helpers
// -----------------------------

const el = {
  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  totalBuildsCount: document.getElementById("totalBuildsCount"),
  successfulBuildsCount: document.getElementById("successfulBuildsCount"),
  failedBuildsCount: document.getElementById("failedBuildsCount"),
  deploymentRate: document.getElementById("deploymentRate"),
  deploymentRateSubtitle: document.getElementById("deploymentRateSubtitle"),
  buildsTableBody: document.getElementById("buildsTableBody"),
  pipelineFilter: document.getElementById("pipelineFilter"),
  envFilter: document.getElementById("envFilter"),
  buildSearch: document.getElementById("buildSearch")
};

// -----------------------------
// Rendering: Table
// -----------------------------

/**
 * Filter builds based on current filters
 * @returns {Build[]}
 */
function getFilteredBuilds() {
  return builds
    .filter(b => {
      if (filters.pipelineId !== "all" && b.pipelineId !== filters.pipelineId) return false;
      if (filters.env !== "all" && b.env !== filters.env) return false;

      if (filters.search.trim()) {
        const s = filters.search.toLowerCase();
        const haystack = [
          b.id,
          b.pipelineName,
          b.triggeredBy,
          b.status,
          b.env,
          formatTimestamp(b.timestamp)
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(s)) return false;
      }

      return true;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function createStatusBadge(status) {
  const span = document.createElement("span");
  span.classList.add("badge", "badge--status");

  switch (status) {
    case STATUS.SUCCESS:
      span.classList.add("badge--success");
      span.textContent = "Success";
      break;
    case STATUS.FAIL:
      span.classList.add("badge--danger");
      span.textContent = "Failed";
      break;
    case STATUS.RUNNING:
      span.classList.add("badge--warning");
      span.textContent = "Running";
      break;
  }

  return span;
}

function renderTable() {
  const rows = getFilteredBuilds();

  el.buildsTableBody.innerHTML = "";

  rows.forEach(build => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.className = "table__id";
    tdId.textContent = build.id;

    const tdPipe = document.createElement("td");
    tdPipe.className = "table__pipeline";
    tdPipe.textContent = build.pipelineName;

    const tdUser = document.createElement("td");
    tdUser.className = "table__user";
    tdUser.textContent = build.triggeredBy;

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(build.status));

    const tdDuration = document.createElement("td");
    tdDuration.className = "table__duration";
    tdDuration.textContent = formatDuration(build.durationSeconds);

    const tdTs = document.createElement("td");
    tdTs.className = "table__timestamp";
    tdTs.textContent = formatTimestamp(build.timestamp);

    tr.append(tdId, tdPipe, tdUser, tdStatus, tdDuration, tdTs);
    el.buildsTableBody.appendChild(tr);
  });
}

// -----------------------------
// Rendering: Summary Cards
// -----------------------------

function computeSummary() {
  // Use real data if available, otherwise use current builds array
  const total = builds.length;
  const successes = builds.filter(b => b.status === STATUS.SUCCESS).length;
  const failures = builds.filter(b => b.status === STATUS.FAIL).length;

  const deployments = builds.filter(b => b.isDeployment);
  const deploymentSuccess = deployments.filter(
    d => d.status === STATUS.SUCCESS
  ).length;

  const deploymentRate =
    deployments.length === 0
      ? 0
      : Math.round((deploymentSuccess / deployments.length) * 100);

  return {
    total,
    successes,
    failures,
    deployments: deployments.length,
    deploymentSuccess,
    deploymentRate
  };
}

function renderSummary() {
  const summary = computeSummary();

  animateCounter(
    el.totalBuildsCount,
    summary.total,
    600,
    v => Math.round(v).toLocaleString()
  );

  animateCounter(
    el.successfulBuildsCount,
    summary.successes,
    600,
    v => Math.round(v).toLocaleString()
  );

  animateCounter(
    el.failedBuildsCount,
    summary.failures,
    600,
    v => Math.round(v).toLocaleString()
  );

  animateCounter(
    el.deploymentRate,
    summary.deploymentRate,
    800,
    v => `${Math.round(v)}%`
  );

  el.deploymentRateSubtitle.textContent = `${summary.deploymentSuccess} / ${summary.deployments} deployments`;
}

// -----------------------------
// Rendering: Charts
// -----------------------------

function makeBaseChartConfig() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#9ca3af",
          font: { family: "Inter", size: 11 }
        }
      },
      tooltip: {
        backgroundColor: "#020617",
        borderColor: "rgba(148, 163, 184, 0.6)",
        borderWidth: 1,
        titleColor: "#e5e7eb",
        bodyColor: "#9ca3af",
        displayColors: true
      }
    },
    scales: {
      x: {
        ticks: {
          color: "#6b7280",
          font: { size: 10 }
        },
        grid: {
          color: "rgba(31, 41, 55, 0.6)"
        }
      },
      y: {
        ticks: {
          color: "#6b7280",
          font: { size: 10 },
          precision: 0
        },
        grid: {
          color: "rgba(31, 41, 55, 0.6)"
        },
        beginAtZero: true
      }
    }
  };
}

function initCharts() {
  const historyCtx = document.getElementById("buildHistoryChart").getContext("2d");
  const pieCtx = document.getElementById("deploymentPieChart").getContext("2d");
  const barCtx = document.getElementById("buildsPerPipelineChart").getContext("2d");
  const baseConfig = makeBaseChartConfig();

  const { labels, successCounts, failCounts } = computeBuildHistorySeries(20);
  const { success: depSuccess, failed: depFailed } = computeDeploymentOutcomes();
  const buildsPerPipeline = computeBuildsPerPipeline();

  buildHistoryChart = new Chart(historyCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Success",
          data: successCounts,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.12)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2.2
        },
        {
          label: "Failed",
          data: failCounts,
          borderColor: "#f97373",
          backgroundColor: "rgba(248, 113, 113, 0.18)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2
        }
      ]
    },
   options: {
  ...baseConfig,
      interaction: {
        intersect: false,
        mode: "index"
      }
    }
  });

  deploymentPieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Success", "Failed"],
      datasets: [
        {
          data: [depSuccess, depFailed],
          backgroundColor: ["#22c55e", "#f97373"],
          borderColor: "#020617",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#9ca3af",
            font: { family: "Inter", size: 11 }
          }
        }
      }
    }
  });

  buildsPerPipelineChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: buildsPerPipeline.labels,
      datasets: [
        {
          label: "Builds",
          data: buildsPerPipeline.counts,
          backgroundColor: "rgba(56, 189, 248, 0.6)",
          borderRadius: 6,
          borderWidth: 1,
          borderColor: "rgba(37, 99, 235, 0.8)"
        }
      ]
    },
    options: {
  ...baseConfig,
  plugins: {
    ...baseConfig.plugins,
        legend: { display: false }
      }
    }
  });
}

/**
 * Group builds into time buckets for chart
 * @param {number} bucketCount
 */
function computeBuildHistorySeries(bucketCount) {
  const sorted = [...builds].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  if (sorted.length === 0) {
    return { labels: [], successCounts: [], failCounts: [] };
  }

  const startTime = sorted[0].timestamp.getTime();
  const endTime = sorted[sorted.length - 1].timestamp.getTime();
  const range = endTime - startTime || 1;
  const bucketSize = range / bucketCount;

  const labels = [];
  const successCounts = new Array(bucketCount).fill(0);
  const failCounts = new Array(bucketCount).fill(0);

  for (let i = 0; i < bucketCount; i++) {
    const t = new Date(startTime + bucketSize * i);
    labels.push(
      t.toLocaleTimeString(undefined, {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
      })
    );
  }

  sorted.forEach(build => {
    const idx = Math.min(
      bucketCount - 1,
      Math.floor(((build.timestamp.getTime() - startTime) / range) * bucketCount)
    );
    if (build.status === STATUS.SUCCESS) successCounts[idx] += 1;
    if (build.status === STATUS.FAIL) failCounts[idx] += 1;
  });

  return { labels, successCounts, failCounts };
}

function computeDeploymentOutcomes() {
  const deployments = builds.filter(b => b.isDeployment);
  const success = deployments.filter(b => b.status === STATUS.SUCCESS).length;
  const failed = deployments.filter(b => b.status === STATUS.FAIL).length;
  return { success, failed };
}

function computeBuildsPerPipeline() {
  const counts = new Map();
  
  // Use real pipelines if available, otherwise use mock data
  const availablePipelines = pipelines.length > 0 ? pipelines : PIPELINES;
  availablePipelines.forEach(p => counts.set(p.id || p._id, 0));
  
  builds.forEach(b => {
    const pipelineId = b.pipelineId;
    counts.set(pipelineId, (counts.get(pipelineId) || 0) + 1);
  });

  const labels = availablePipelines.map(p => p.name);
  const values = availablePipelines.map(p => counts.get(p.id || p._id) || 0);
  return { labels, counts: values };
}

function updateCharts() {
  if (!buildHistoryChart || !deploymentPieChart || !buildsPerPipelineChart) return;

  const { labels, successCounts, failCounts } = computeBuildHistorySeries(20);
  const { success: depSuccess, failed: depFailed } = computeDeploymentOutcomes();
  const buildsPerPipeline = computeBuildsPerPipeline();

  buildHistoryChart.data.labels = labels;
  buildHistoryChart.data.datasets[0].data = successCounts;
  buildHistoryChart.data.datasets[1].data = failCounts;
  buildHistoryChart.update("active");

  deploymentPieChart.data.datasets[0].data = [depSuccess, depFailed];
  deploymentPieChart.update("active");

  buildsPerPipelineChart.data.labels = buildsPerPipeline.labels;
  buildsPerPipelineChart.data.datasets[0].data = buildsPerPipeline.counts;
  buildsPerPipelineChart.update("active");
}

// -----------------------------
// Event Handlers
// -----------------------------

function onSidebarToggle() {
  // On desktop: collapse; on mobile we use translateX via CSS, so toggling class still works
  el.sidebar.classList.toggle("sidebar--collapsed");
}

function onPipelineFilterChange(e) {
  filters.pipelineId = e.target.value;
  renderTable();
}

function onEnvFilterChange(e) {
  filters.env = e.target.value;
  renderTable();
}

function onSearchInput(e) {
  filters.search = e.target.value;
  renderTable();
}

// -----------------------------
// Initialization
// -----------------------------

function populatePipelineFilter() {
  // Clear existing options except the default
  el.pipelineFilter.innerHTML = '<option value="all">All Pipelines</option>';
  
  // Use real pipelines if available, otherwise use mock data
  const availablePipelines = pipelines.length > 0 ? pipelines : PIPELINES;
  
  availablePipelines.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id || p._id;
    opt.textContent = `${p.name} (${p.env || 'prod'})`;
    el.pipelineFilter.appendChild(opt);
  });
}

function attachEventListeners() {
  el.sidebarToggle.addEventListener("click", onSidebarToggle);
  el.pipelineFilter.addEventListener("change", onPipelineFilterChange);
  el.envFilter.addEventListener("change", onEnvFilterChange);
  el.buildSearch.addEventListener("input", debounce(onSearchInput, 300));
}

// -----------------------------
// Real-time Data Updates
// -----------------------------

async function updateDashboardData() {
  try {
    // Fetch all data in parallel
    const [metricsData, buildsData, pipelinesData] = await Promise.all([
      fetchDashboardMetrics(),
      fetchRecentBuilds(),
      fetchPipelines()
    ]);

    // Update pipelines data
    if (pipelinesData && pipelinesData.length > 0) {
      pipelines = transformPipelineData(pipelinesData);
      populatePipelineFilter();
    }

    // Update builds data
    if (buildsData && buildsData.length > 0) {
      builds = transformBuildData(buildsData);
    }

    // Update metrics if we have them from the API
    if (metricsData) {
      // Update summary cards with real metrics
      animateCounter(
        el.totalBuildsCount,
        metricsData.totalBuilds || 0,
        600,
        v => Math.round(v).toLocaleString()
      );

      animateCounter(
        el.successfulBuildsCount,
        metricsData.successfulBuilds || 0,
        600,
        v => Math.round(v).toLocaleString()
      );

      animateCounter(
        el.failedBuildsCount,
        metricsData.failedBuilds || 0,
        600,
        v => Math.round(v).toLocaleString()
      );

      animateCounter(
        el.deploymentRate,
        metricsData.deploymentSuccessRate || 0,
        800,
        v => `${Math.round(v)}%`
      );

      el.deploymentRateSubtitle.textContent = 
        `${metricsData.successfulDeployments || 0} / ${metricsData.totalDeployments || 0} deployments`;
    } else {
      // Fallback to computed metrics
      renderSummary();
    }

    // Update table and charts
    renderTable();
    updateCharts();
    
  } catch (error) {
    console.error('Error updating dashboard data:', error);
    // Fallback to existing data
    renderSummary();
    renderTable();
    updateCharts();
  }
}

function startRealtimeSimulation() {
  // Update dashboard every 5 seconds with real data
  setInterval(updateDashboardData, UPDATE_INTERVAL_MS);
  
  // Initial data load
  updateDashboardData();
}

function init() {
  // No need to seed initial data as we use real API data
  attachEventListeners();
  
  // Initialize charts with empty data first
  initCharts();
  
  // Start real-time updates
  startRealtimeSimulation();
}

// Ensure Chart.js is loaded (script tag uses defer, so DOM is ready here)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
