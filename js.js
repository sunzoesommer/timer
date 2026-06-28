// ─── PRESETS (Sekunden) ───
const PRESETS = {
    rede:        { green: 300, yellow: 360, red: 420, blue: 450 },
    stehgreif:   { green: 120, yellow: 150, red: 180, blue: 210 },
    evaluation:  { green: 120, yellow: 150, red: 180, blue: 210 },
    individuell: { green: 0,   yellow: 0,   red: 0,   blue: 0   }
};

const COLORS = {
    green:  { bg: 'bg-green',  bar: '#4caf50' },
    yellow: { bg: 'bg-yellow', bar: '#ffeb3b' },
    red:    { bg: 'bg-red',    bar: '#f44336' },
    blue:   { bg: 'bg-blue',   bar: '#2196f3' }
};

let currentMode = 'rede';
let times       = { ...PRESETS.rede };
let elapsed     = 0;
let running     = false;
let intervalId  = null;
let shownCards  = { green: false, yellow: false, red: false, blue: false };
let gongPlayed  = false;

// ─── FORMAT: immer MM:SS ───
function secToStr(s) {
    const m  = Math.floor(s / 60);
    const ss = s % 60;
    return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

function strToSec(str) {
    str = str.trim();
    if (!str) return NaN;
    if (str.includes(':')) {
        const [m, s] = str.split(':');
        return parseInt(m) * 60 + parseInt(s || 0);
    }
    return parseInt(str);
}

// ─── MENÜ AUTO-HIDE ───
let hideTimeout = null;
const menu       = document.getElementById('menu');
const menuToggle = document.getElementById('menuToggle');

function showMenu() {
    menu.classList.remove('hidden');
    menuToggle.classList.remove('visible');
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(hideMenu, 4000);
}

function hideMenu() {
    menu.classList.add('hidden');
    menuToggle.classList.add('visible');
}

['mousemove', 'mousedown', 'touchstart', 'touchmove'].forEach(evt => {
    document.addEventListener(evt, showMenu, { passive: true });
});

menuToggle.addEventListener('click', showMenu);
menuToggle.addEventListener('touchend', e => { e.preventDefault(); showMenu(); });

hideTimeout = setTimeout(hideMenu, 4000);

// ─── AUDIO – Gong ───
function playGong() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // ─── Hauptton (tiefe Klangschale) ───
    const osc1  = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(220, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(196, ctx.currentTime + 4);
    gain1.gain.setValueAtTime(0.001, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.3);  // Anschwellen
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 4);

    // ─── Oberton 1 ───
    const osc2  = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(392, ctx.currentTime + 3);
    gain2.gain.setValueAtTime(0.001, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);  // Anschwellen
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 4);

    // ─── Oberton 2 ───
    const osc3  = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(880, ctx.currentTime);
    osc3.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 1.5);
    gain3.gain.setValueAtTime(0.001, ctx.currentTime);
    gain3.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3);  // Anschwellen
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
    osc3.start(ctx.currentTime);
    osc3.stop(ctx.currentTime + 3);

    // ─── Anschlag ───
    const osc4  = ctx.createOscillator();
    const gain4 = ctx.createGain();
    osc4.connect(gain4);
    gain4.connect(ctx.destination);
    osc4.type = 'triangle';
    osc4.frequency.setValueAtTime(300, ctx.currentTime);
    gain4.gain.setValueAtTime(0.4, ctx.currentTime);
    gain4.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc4.start(ctx.currentTime);
    osc4.stop(ctx.currentTime + 0.3);
}


// ─── MODE ───
function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach((b, i) => {
        b.classList.toggle('active',
            ['rede', 'stehgreif', 'evaluation', 'individuell'][i] === mode);
    });

    times = { ...PRESETS[mode] };

    const readOnly = (mode !== 'individuell');
    ['green', 'yellow', 'red', 'blue'].forEach(c => {
        const inp = document.getElementById('inp-' + c);
        inp.readOnly = readOnly;
        inp.style.opacity = readOnly ? '0.6' : '1';
        inp.value = times[c] ? secToStr(times[c]) : '';
    });

    document.getElementById('settingsTitle').textContent =
        '⏱ ' + {
            rede:        'Rede',
            stehgreif:   'Stehgreifreden',
            evaluation:  'Evaluationsrede',
            individuell: 'Individuell'
        }[mode];

    resetTimer();
}

// ─── CUSTOM INPUT ───
function onCustomInput() {
    if (currentMode !== 'individuell') return;
    ['green', 'yellow', 'red', 'blue'].forEach(c => {
        const val = strToSec(document.getElementById('inp-' + c).value);
        times[c] = isNaN(val) ? 0 : val;
    });
}

// ─── TIMER LOGIC ───
function startTimer() {
    if (running) return;
    running = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;

    intervalId = setInterval(() => {
        elapsed++;
        updateDisplay();
        checkCards();
    }, 1000);
}

function pauseTimer() {
    if (!running) return;
    running = false;
    clearInterval(intervalId);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function resetTimer() {
    pauseTimer();
    elapsed    = 0;
    shownCards = { green: false, yellow: false, red: false, blue: false };
    gongPlayed = false;

    document.getElementById('timeValue').textContent = '00:00';

    const bg = document.getElementById('bgOverlay');
    bg.style.background = '#1a1a2e';
    bg.className = '';

    document.getElementById('progressBar').style.width      = '0%';
    document.getElementById('progressBar').style.background = '#4caf50';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function updateDisplay() {
    document.getElementById('timeValue').textContent = secToStr(elapsed);
    const max = times.blue || 1;
    const pct = Math.min((elapsed / max) * 100, 100);
    document.getElementById('progressBar').style.width = pct + '%';
}

function checkCards() {
    let activeCard = null;
    if      (times.blue   && elapsed >= times.blue)   activeCard = 'blue';
    else if (times.red    && elapsed >= times.red)    activeCard = 'red';
    else if (times.yellow && elapsed >= times.yellow) activeCard = 'yellow';
    else if (times.green  && elapsed >= times.green)  activeCard = 'green';

    if (activeCard) {
        const info = COLORS[activeCard];
        const bgMap = {
            'bg-green':  '#1a7a1a',
            'bg-yellow': '#8a7a00',
            'bg-red':    '#8a1a1a',
            'bg-blue':   '#0a2a8a'
        };
        document.getElementById('bgOverlay').style.background = bgMap[info.bg];
        document.getElementById('progressBar').style.background = info.bar;
    }

    if (times.blue && elapsed >= times.blue && !gongPlayed) {
        gongPlayed = true;
        playGong();
    }
}

// ─── INIT ───
setMode('rede');
