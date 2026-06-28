// ─── PRESETS (Sekunden) ───
const PRESETS = {
    rede:        { green: 300, yellow: 360, red: 420, blue: 450 },
    stehgreif:   { green: 120, yellow: 150, red: 180, blue: 210 },
    evaluation:  { green: 120, yellow: 150, red: 180, blue: 210 },
    individuell: { green: 0,   yellow: 0,   red: 0,   blue: 0   },
    test: { green: 1,   yellow: 2,   red: 3,   blue: 4   }
};

const COLORS = {
    green:  { bg: 'bg-green',  bar: '#e1e0da' },
    yellow: { bg: 'bg-yellow', bar: '#e1e0da' },
    red:    { bg: 'bg-red',    bar: '#e1e0da' },
    blue:   { bg: 'bg-blue',   bar: '#e1e0da' }
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
    alert("Gong!");
    const audio = new Audio('gong.mp3');
    audio.volume = 0.8;
    audio.play();
}

// ─── MODE ───
function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach((b, i) => {
        b.classList.toggle('active',
            ['rede', 'stehgreif', 'evaluation', 'individuell', 'test'][i] === mode);
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
            individuell: 'Individuell',
            test:        'Test'
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

    // Unlock – hat funktioniert, behalten!
    const unlock = new Audio('gong.mp3');
    unlock.volume = 0;
    unlock.play().catch(() => {});

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
    bg.style.backgroundColor = bgMap[info.bg];
    bg.style.background = bgMap[info.bg];
    bg.style.opacity = "1";
    bg.className = '';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function updateDisplay() {
    document.getElementById('timeValue').textContent = secToStr(elapsed);
}

function checkCards() {
    let color = '#1a1a2e';

    if (elapsed >= times.blue)
        color = '#026b9c';
    else if (elapsed >= times.red)
        color = '#ff0000';
    else if (elapsed >= times.yellow)
        color = '#ffe101';
    else if (elapsed >= times.green)
        color = '#04ff04';

    document.body.style.backgroundColor = color;

    if (elapsed >= times.blue && !gongPlayed) {
        gongPlayed = true;
        playGong();
    }
}

// ─── INIT ───
setMode('rede');
alert("elapsed=" + elapsed);