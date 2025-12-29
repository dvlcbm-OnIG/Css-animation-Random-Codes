const numbersInput = document.getElementById('numbers');
const maxIterationsInput = document.getElementById('maxIterations');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');

const iterationEl = document.getElementById('iteration');
const elapsedEl = document.getElementById('elapsed');
const lengthEl = document.getElementById('length');
const stateEl = document.getElementById('state');
const progressBar = document.getElementById('progressBar');
const badge = document.getElementById('badge');
const arrayView = document.getElementById('arrayView');
const logArea = document.getElementById('log');

let data = [];
let operations = 0;
let running = false;
let startTime = 0;
let audioCtx = null;

const parseNumbers = () => {
    const raw = numbersInput.value.trim();
    if (!raw) return [];
    return raw
        .split(/[ ,]+/)
        .map(Number)
        .filter((n) => Number.isFinite(n));
};

const computeRanks = (arr) => {
    if (!arr.length) return [];
    const sorted = arr
        .map((v, idx) => ({ v, idx }))
        .sort((a, b) => (a.v === b.v ? a.idx - b.idx : a.v - b.v));
    const buckets = new Map();
    sorted.forEach((item, i) => {
        if (!buckets.has(item.v)) buckets.set(item.v, []);
        buckets.get(item.v).push(i);
    });
    return arr.map((v) => buckets.get(v).shift());
};

const renderArray = () => {
    if (!data.length) {
        arrayView.classList.add('empty');
        arrayView.textContent = 'No data to show';
        return;
    }

    arrayView.classList.remove('empty');
    const ranks = computeRanks(data);
    const maxRank = Math.max(1, data.length - 1);

    arrayView.innerHTML = data
        .map((n, idx) => {
            const rank = ranks[idx];
            const heightPct = data.length === 1 ? 100 : 20 + (80 * rank) / maxRank;
            const isPos = n >= 0;
            const gradientTop = isPos ? '#34d399' : '#fbbf24';
            const gradientBottom = isPos ? '#0ea5e9' : '#f97316';
            const extraClass = n === 0 ? ' zero' : '';
            return `
                <div class="bar${extraClass}" style="height:${heightPct}%; background: linear-gradient(180deg, ${gradientTop}, ${gradientBottom});">
                    <span class="value">${n}</span>
                </div>
            `;
        })
        .join('');
};

const log = (message) => {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] ${message}`;
    logArea.textContent = `${entry}\n${logArea.textContent}`.trim().slice(0, 4000);
};

const updateStats = (status = 'Sorting') => {
    const maxOps = Number(maxIterationsInput.value) || 1;
    const elapsed = running ? performance.now() - startTime : 0;
    iterationEl.textContent = operations;
    elapsedEl.textContent = elapsed.toFixed(1);
    lengthEl.textContent = data.length;
    stateEl.textContent = status;
    const denom = Math.max(1, (data.length || 1) ** 2);
    const pct = Math.min(100, (operations / denom) * 100);
    progressBar.style.width = `${pct}%`;
};

const setBadge = (text, positive = false) => {
    badge.textContent = text;
    badge.style.borderColor = positive ? 'rgba(45, 212, 191, 0.55)' : 'rgba(245, 165, 36, 0.55)';
    badge.style.color = positive ? 'var(--accent-2)' : 'var(--accent)';
    badge.style.backgroundColor = positive ? 'rgba(45, 212, 191, 0.1)' : 'rgba(245, 165, 36, 0.1)';
};

const playSwapSound = (value) => {
    const vol = 0.12;
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtx = Ctx ? new Ctx() : null;
    }
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const norm = Math.tanh(value || 0);
    osc.type = 'square';
    osc.frequency.value = 220 + Math.abs(norm) * 320;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const stopRun = (reason = 'Stopped') => {
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setBadge(reason, reason === 'Sorted!');
    updateStats(reason);
};

const quickSortAnimate = async () => {
    const maxOps = Number(maxIterationsInput.value) || 1;
    const stack = [[0, data.length - 1]];

    while (stack.length && running) {
        const [low, high] = stack.pop();
        if (low >= high) continue;

        let i = low;
        let j = high;
        const pivot = data[Math.floor((low + high) / 2)];

        while (i <= j && running) {
            while (data[i] < pivot) i += 1;
            while (data[j] > pivot) j -= 1;
            if (i <= j) {
                [data[i], data[j]] = [data[j], data[i]];
                operations += 1;
                renderArray();
                updateStats('Sorting');
                playSwapSound(data[i]);
                if (operations >= maxOps) {
                    log('Stopped: max operations reached');
                    stopRun('Capped');
                    return;
                }
                i += 1;
                j -= 1;
                await sleep(30);
            }
        }

        if (low < j) stack.push([low, j]);
        if (i < high) stack.push([i, high]);
    }

    if (running) {
        log('Sorted via quick sort');
        stopRun('Sorted!');
    }
};

const start = async () => {
    data = parseNumbers();
    if (!data.length) {
        log('Enter at least one number.');
        setBadge('Need data');
        return;
    }

    operations = 0;
    running = true;
    startTime = performance.now();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    setBadge('Sorting…');
    renderArray();
    updateStats('Sorting');
    log(`Starting quick sort with [${data.join(', ')}] (n=${data.length})`);
    await quickSortAnimate();
};

const reset = () => {
    data = parseNumbers();
    operations = 0;
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setBadge('Waiting…');
    renderArray();
    updateStats('Idle');
    log('Reset state');
};

startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', () => {
    log('Stopped by user');
    stopRun('Paused');
});
resetBtn.addEventListener('click', reset);

numbersInput.addEventListener('change', reset);
maxIterationsInput.addEventListener('change', reset);

// initial render
reset();
