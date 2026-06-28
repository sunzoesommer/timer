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
    const audio = new Audio('gong.mp3');
    audio.volume = 0.8;
    audio.play();
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
