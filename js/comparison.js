let cars = [];

// McLaren Senna Stats
const senna = {
    name: "McLaren Senna",
    power: 800,
    size: 4.0,
    cylinders: 8
};

// ─── 0-100 km/h estimate ─────────────────────────────────────────────────────
// t = 216 / HP^0.65
// Senna (800 PS) → 216 / 800^0.65 ≈ 2.8 s  ✓
// 200 PS compact → 216 / 200^0.65 ≈ 6.9 s  ✓
function estimateTime(hp) {
    if (!hp || hp <= 0) return 99;
    return parseFloat((216 / Math.pow(hp, 0.65)).toFixed(2));
}

// ─── State ────────────────────────────────────────────────────────────────────
let currentCarHP   = 0;
let currentCarName = "";
let raceRunning    = false;

// ─── CSV ──────────────────────────────────────────────────────────────────────
fetch("http://10.214.6.33:3000/data")
    .then(res => res.text())
    .then(csv => {
        const result = Papa.parse(csv, {
            header: true
        });

        cars = result.data;
        init();
    })
    .catch(err => {
        console.error("CSV loading error:", err);
    });

function init() {
    const map = new Map();
    cars.forEach(c => {
        const key = `${c["Make Name"]}_${c["Model Name"]}`;
        const ps  = Number(c["Engine Horsepower Hp"]) || 0;
        if (!map.has(key) || ps > Number(map.get(key)["Engine Horsepower Hp"])) {
            map.set(key, c);
        }
    });
    cars = Array.from(map.values());

    const brands      = [...new Set(cars.map(c => c["Make Name"]))];
    const brandFilter = document.getElementById("brandFilter");
    brands.forEach(b => {
        if (!b) return;
        const opt = document.createElement("option");
        opt.value = b; opt.textContent = b;
        brandFilter.appendChild(opt);
    });

    brandFilter.addEventListener("change", updateDropdown);
    updateDropdown();
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function updateDropdown() {
    const brand    = document.getElementById("brandFilter").value;
    const dropdown = document.getElementById("carDropdown");
    dropdown.innerHTML = `<option value="">Select a car...</option>`;

    const filtered = cars.filter(c => !brand || c["Make Name"] === brand);
    filtered.forEach((c, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `${c["Make Name"]} ${c["Model Name"]}`;
        dropdown.appendChild(opt);
    });

    if (filtered.length > 0) {
        let bestIndex = 0, maxPS = 0;
        filtered.forEach((c, i) => {
            const ps = Number(c["Engine Horsepower Hp"]) || 0;
            if (ps > maxPS) { maxPS = ps; bestIndex = i; }
        });
        dropdown.value = bestIndex;
        updateComparison(filtered);
    }

    dropdown.onchange = () => updateComparison(filtered);
}

// ─── Comparison table ─────────────────────────────────────────────────────────
function updateComparison(list) {
    const dropdown = document.getElementById("carDropdown");
    const index    = dropdown.value;
    const car      = list[index];
    if (!car) return;

    const carName  = `${car["Make Name"]} ${car["Model Name"]}`;
    currentCarHP   = Number(car["Engine Horsepower Hp"]) || 0;
    currentCarName = carName;

    const metrics = [
        { label: "PS",          carVal: currentCarHP,                            sennaVal: senna.power,     unit: " PS" },
        { label: "Engine Size", carVal: Number(car["Engine Size"]),               sennaVal: senna.size,      unit: " L"  },
        { label: "Cylinders",   carVal: parseCylinders(car["Engine Cylinders"]),  sennaVal: senna.cylinders, unit: ""    }
    ];

    const rows = metrics.map(m => {
        const max      = Math.max(m.carVal, m.sennaVal) || 1;
        const carPct   = (m.carVal   / max * 100).toFixed(1);
        const sennaPct = (m.sennaVal / max * 100).toFixed(1);
        return `
        <tr>
            <td class="metric-label">${m.label}</td>
            <td class="val-cell car-val">${m.carVal}${m.unit}</td>
            <td class="val-cell senna-val">${m.sennaVal}${m.unit}</td>
            <td class="bar-cell">
                <div class="bar-track">
                    <div class="bar car-bar"   data-width="${carPct}%"   style="width:0"></div>
                </div>
                <div class="bar-track">
                    <div class="bar senna-bar" data-width="${sennaPct}%" style="width:0"></div>
                </div>
            </td>
        </tr>`;
    }).join("");

    document.getElementById("compareData").innerHTML = `
        <h3 class="comparison-title">${carName} vs McLaren Senna</h3>
        <table class="table table-dark table-bordered comparison-table">
            <thead>
                <tr>
                    <th></th>
                    <th class="th-car">${carName}</th>
                    <th class="th-senna">McLaren Senna</th>
                    <th class="th-bars">
                        <span class="legend-dot car-dot"></span>${carName}
                        &nbsp;&nbsp;
                        <span class="legend-dot senna-dot"></span>McLaren Senna
                        <span class="legend-hint">&nbsp;(% of higher value per metric)</span>
                    </th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelectorAll(".bar[data-width]").forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        });
    });

    updateRaceUI();
}

// ─── Race UI setup ────────────────────────────────────────────────────────────
function updateRaceUI() {
    const section = document.getElementById("raceSection");
    if (!section) return;

    section.style.display = "block";

    document.getElementById("lane-car-label").textContent = currentCarName;
    document.getElementById("info-car-name").textContent  = currentCarName;

    const tCar   = estimateTime(currentCarHP);
    const tSenna = estimateTime(senna.power);
    document.getElementById("info-car-time").textContent   = tCar   + "s";
    document.getElementById("info-senna-time").textContent = tSenna + "s";
    document.getElementById("raceInfoRow").style.display   = "flex";

    const btn = document.getElementById("raceBtn");
    btn.innerHTML = `<span class="race-btn-icon">&#9654;</span> START RACE`;
    btn.disabled  = false;

    resetCars();
    document.getElementById("raceResult").style.display = "none";
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function resetCars() {
    const carEl   = document.getElementById("raceCar");
    const sennaEl = document.getElementById("raceSenna");
    if (carEl)   { carEl.style.left   = "2%"; carEl.classList.remove("car-bounce"); }
    if (sennaEl) { sennaEl.style.left = "2%"; sennaEl.classList.remove("car-bounce"); }

    document.getElementById("time-car").textContent   = "0.00s";
    document.getElementById("time-senna").textContent = "0.00s";

    stopExhaust();
}

// ─── Race ─────────────────────────────────────────────────────────────────────
function startRace() {
    if (raceRunning) return;
    raceRunning = true;
    resetCars();

    const btn    = document.getElementById("raceBtn");
    const result = document.getElementById("raceResult");
    btn.disabled         = true;
    result.style.display = "none";

    const tCar   = estimateTime(currentCarHP);
    const tSenna = estimateTime(senna.power);

    // ECHTZEIT: 1 Sekunde = 1 Sekunde Animation, kein Scaling
    const carVisualMs   = tCar   * 1000;
    const sennaVisualMs = tSenna * 1000;

    const TRACK_PCT = 88;

    const carEl       = document.getElementById("raceCar");
    const sennaEl     = document.getElementById("raceSenna");
    const timeCarEl   = document.getElementById("time-car");
    const timeSennaEl = document.getElementById("time-senna");

    let startTs       = null;
    let carFinished   = false;
    let sennaFinished = false;

    startExhaust();

    function frame(ts) {
        if (!startTs) startTs = ts;
        const elapsed = ts - startTs;

        const carProgress   = Math.min(elapsed / carVisualMs,   1);
        const sennaProgress = Math.min(elapsed / sennaVisualMs, 1);

        // easeIn (t²) = konstante Beschleunigung, wie s = ½at²
        carEl.style.left   = `${2 + easeIn(carProgress)   * TRACK_PCT}%`;
        sennaEl.style.left = `${2 + easeIn(sennaProgress) * TRACK_PCT}%`;

        // Live-Timer zählt jede Frame mit
        if (!carFinished)   timeCarEl.textContent   = (elapsed / 1000).toFixed(2) + "s";
        if (!sennaFinished) timeSennaEl.textContent = (elapsed / 1000).toFixed(2) + "s";

        // Ziel erreicht → Timer einfrieren + Bounce
        if (carProgress >= 1 && !carFinished) {
            carFinished = true;
            timeCarEl.textContent = tCar + "s";
            carEl.classList.add("car-bounce");
        }
        if (sennaProgress >= 1 && !sennaFinished) {
            sennaFinished = true;
            timeSennaEl.textContent = tSenna + "s";
            sennaEl.classList.add("car-bounce");
        }

        if (!carFinished || !sennaFinished) {
            requestAnimationFrame(frame);
        } else {
            raceFinished(tCar, tSenna, btn, result);
        }
    }

    requestAnimationFrame(frame);
}

function raceFinished(tCar, tSenna, btn, result) {
    stopExhaust();
    raceRunning = false;

    const winner = tSenna <= tCar
        ? "🏆 McLaren Senna gewinnt!"
        : `🏆 ${currentCarName} gewinnt!`;
    const diff = Math.abs(tCar - tSenna).toFixed(2);

    result.innerHTML     = `<span class="result-winner">${winner}</span><span class="result-diff">Differenz: ${diff}s</span>`;
    result.style.display = "flex";

    btn.disabled  = false;
    btn.innerHTML = `<span class="race-btn-icon">&#8635;</span> NOCHMAL`;
}

// ─── Physik ───────────────────────────────────────────────────────────────────
function easeIn(t) { return t * t; }

// ─── Auspuff-Partikel ─────────────────────────────────────────────────────────
let exhaustIntervals = [];

function startExhaust() {
    stopExhaust();
    ["exhaust-car", "exhaust-senna"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const iv = setInterval(() => spawnParticle(el), 70);
        exhaustIntervals.push(iv);
    });
}

function stopExhaust() {
    exhaustIntervals.forEach(iv => clearInterval(iv));
    exhaustIntervals = [];
}

function spawnParticle(container) {
    const p = document.createElement("div");
    p.className = "exhaust-particle";
    const size = 5 + Math.random() * 7;
    p.style.cssText = `
        width:${size}px; height:${size}px;
        top:${8 + Math.random() * 10}px;
        opacity:${0.4 + Math.random() * 0.5};
        animation-duration:${0.35 + Math.random() * 0.3}s;
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), 700);
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function parseCylinders(value) {
    if (!value) return 0;
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : 0;
}