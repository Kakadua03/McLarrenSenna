let cars = [];

// McLaren Senna Stats
const senna = {
    name: "McLaren Senna",
    power: 800,
    size: 4.0,
    cylinders: 8
};

// ─── Quarter-mile time estimate ───────────────────────────────────────────────
function estimateQuarterMile(hp) {
    if (!hp || hp <= 0) return 99;
    return parseFloat((756 / Math.pow(hp, 0.65)).toFixed(2));
}

// ─── State ────────────────────────────────────────────────────────────────────
let currentCarHP   = 0;
let currentCarName = "";
let raceRunning    = false;
const exhaustIntervals = { car: null, senna: null };

// Combobox state
let allBrands     = [];
let selectedBrand = "";
let filteredCars  = [];
let selectedCarIdx = 0;
let userHasSelected = false; // tracks whether the user has actively chosen a car

// ─── CSV ──────────────────────────────────────────────────────────────────────
fetch("http://localhost:3000/data")
    .then(res => res.text())
    .then(csv => {
        const result = Papa.parse(csv, { header: true });
        cars = result.data;
        init();
    })
    .catch(err => console.error("CSV loading error:", err));

// ─── Init ─────────────────────────────────────────────────────────────────────
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
    allBrands = [...new Set(cars.map(c => c["Make Name"]))].filter(Boolean).sort();

    const brandInput = document.getElementById("brandInput");
    const brandClear = document.getElementById("brandClear");
    const modelInput = document.getElementById("modelInput");

    // ── Brand combobox ──────────────────────────────────────────────────────
    brandInput.addEventListener("focus", () => {
        renderBrandList(brandInput.value);
        openCombo("brandCombo");
    });
    brandInput.addEventListener("input", () => {
        selectedBrand = "";
        if (brandClear) brandClear.style.display = "none";
        renderBrandList(brandInput.value);
        openCombo("brandCombo");
        refreshModelCombo();
    });
    brandInput.addEventListener("keydown", e =>
        handleComboKey(e, "brandList", idx => {
            const item = document.querySelectorAll("#brandList .combo-option")[idx];
            if (item) selectBrand(item.dataset.value);
        })
    );

    if (brandClear) {
        brandClear.addEventListener("click", () => {
            selectedBrand = "";
            brandInput.value = "";
            brandClear.style.display = "none";
            refreshModelCombo();
        });
    }

    // ── Model combobox ──────────────────────────────────────────────────────
    modelInput.addEventListener("focus", () => {
        renderModelList(modelInput.value);
        openCombo("modelCombo");
    });
    modelInput.addEventListener("input", () => {
        renderModelList(modelInput.value);
        openCombo("modelCombo");
    });
    modelInput.addEventListener("keydown", e =>
        handleComboKey(e, "modelList", idx => {
            const item = document.querySelectorAll("#modelList .combo-option")[idx];
            if (item) { userHasSelected = true; selectCar(Number(item.dataset.index), true); }
        })
    );

    // Close on outside click
    document.addEventListener("click", e => {
        if (!e.target.closest("#brandCombo")) closeCombo("brandCombo");
        if (!e.target.closest("#modelCombo")) closeCombo("modelCombo");
    });

    refreshModelCombo();
    renderEmptyTable();
}

// ─── Keyboard navigation ──────────────────────────────────────────────────────
function handleComboKey(e, listId, selectFn) {
    const list  = document.getElementById(listId);
    const items = Array.from(list.querySelectorAll(".combo-option"));
    const cur   = items.findIndex(li => li.classList.contains("kb-focus"));

    if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(cur + 1, items.length - 1);
        items.forEach(li => li.classList.remove("kb-focus"));
        items[next]?.classList.add("kb-focus");
        items[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(cur - 1, 0);
        items.forEach(li => li.classList.remove("kb-focus"));
        items[prev]?.classList.add("kb-focus");
        items[prev]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (cur >= 0) selectFn(cur);
    } else if (e.key === "Escape") {
        closeCombo(list.closest(".combo-wrap")?.id);
    }
}

// ─── Brand combobox ───────────────────────────────────────────────────────────
function renderBrandList(query) {
    const list = document.getElementById("brandList");
    const q    = (query || "").toLowerCase();
    const hits = allBrands.filter(b => !q || b.toLowerCase().includes(q));

    list.innerHTML = hits.map(b =>
        `<li class="combo-option${b === selectedBrand ? " selected" : ""}" data-value="${b}">${hl(b, q)}</li>`
    ).join("") || `<li class="combo-no-result">No makes found</li>`;

    list.querySelectorAll(".combo-option").forEach(li =>
        li.addEventListener("mousedown", e => { e.preventDefault(); selectBrand(li.dataset.value); })
    );

    const sel = list.querySelector(".selected");
    sel?.scrollIntoView({ block: "nearest" });
}

function selectBrand(brand) {
    selectedBrand = brand;
    const brandInput = document.getElementById("brandInput");
    const brandClear = document.getElementById("brandClear");
    brandInput.value = brand;
    if (brandClear) brandClear.style.display = "flex";
    closeCombo("brandCombo");
    refreshModelCombo();
}

// ─── Model combobox ───────────────────────────────────────────────────────────
function refreshModelCombo() {
    const modelInput = document.getElementById("modelInput");
    modelInput.value = "";
    buildFiltered("");

    let best = 0, maxPS = 0;
    filteredCars.forEach((c, i) => {
        const ps = Number(c["Engine Horsepower Hp"]) || 0;
        if (ps > maxPS) { maxPS = ps; best = i; }
    });

    selectedCarIdx = best;

    if (filteredCars[best] && userHasSelected) {
        updateComparison();
    }

    updateFilterCount();
}

function buildFiltered(query) {
    const q = (query || "").toLowerCase();
    filteredCars = cars.filter(c => {
        const matchBrand = !selectedBrand || c["Make Name"] === selectedBrand;
        const fullName   = `${c["Make Name"]} ${c["Model Name"]}`.toLowerCase();
        return matchBrand && (!q || fullName.includes(q));
    });
}

function renderModelList(query) {
    buildFiltered(query);
    updateFilterCount();

    const list = document.getElementById("modelList");
    const q    = (query || "").toLowerCase();

    list.innerHTML = filteredCars.map((c, i) => {
        const name = `${c["Make Name"]} ${c["Model Name"]}`;
        return `<li class="combo-option${i === selectedCarIdx ? " selected" : ""}" data-index="${i}">${hl(name, q)}</li>`;
    }).join("") || `<li class="combo-no-result">No models found</li>`;

    list.querySelectorAll(".combo-option").forEach(li =>
        li.addEventListener("mousedown", e => { e.preventDefault(); selectCar(Number(li.dataset.index), true); })
    );

    list.querySelector(".selected")?.scrollIntoView({ block: "nearest" });
}

function selectCar(idx, closeAfter) {
    if (!filteredCars[idx]) return;
    selectedCarIdx = idx;
    userHasSelected = true;
    const car        = filteredCars[idx];
    const modelInput = document.getElementById("modelInput");
    modelInput.value = `${car["Make Name"]} ${car["Model Name"]}`;
    if (closeAfter) closeCombo("modelCombo");
    updateComparison();
}

// ─── Highlight match ──────────────────────────────────────────────────────────
function hl(text, q) {
    if (!q) return text;
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return text;
    return text.slice(0, i) + `<mark>${text.slice(i, i + q.length)}</mark>` + text.slice(i + q.length);
}

function updateFilterCount() {
    const el = document.getElementById("filterCount");
    if (!el) return;
    const n = filteredCars.length;
    el.innerHTML = n > 0 ? `<span>${n}</span> model${n !== 1 ? "s" : ""} found` : `No results`;
}

// ─── Open / Close combo ───────────────────────────────────────────────────────
function openCombo(id)  { document.getElementById(id)?.classList.add("open");    }
function closeCombo(id) { document.getElementById(id)?.classList.remove("open"); }

// ─── Empty table on first load ────────────────────────────────────────────────
function renderEmptyTable() {
    const metrics = [
        { label: "PS",          sennaVal: senna.power,     unit: " PS" },
        { label: "Engine Size", sennaVal: senna.size,      unit: " L"  },
        { label: "Cylinders",   sennaVal: senna.cylinders, unit: ""    }
    ];

    const rows = metrics.map(m => `
        <tr>
            <td class="metric-label">${m.label}</td>
            <td class="val-cell car-val" style="color: var(--bs-secondary, #6c757d);">–</td>
            <td class="val-cell senna-val">${m.sennaVal}${m.unit}</td>
            <td class="bar-cell">
                <div class="bar-track">
                    <div class="bar car-bar" style="width:0"></div>
                </div>
                <div class="bar-track">
                    <div class="bar senna-bar" data-width="100%" style="width:0"></div>
                </div>
            </td>
        </tr>`
    ).join("");

    document.getElementById("compareData").innerHTML = `
        <table class="table table-dark table-bordered comparison-table">
            <thead>
                <tr>
                    <th></th>
                    <th class="th-car" style="color: var(--bs-secondary, #6c757d);">Select a car…</th>
                    <th class="th-senna">McLaren Senna</th>
                    <th class="th-bars">
                        <span class="legend-dot car-dot"></span>Rival
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

    // Also show the race section with empty rival values
    const section = document.getElementById("raceSection");
    if (section) {
        section.style.display = "block";
        document.getElementById("lane-car-label").textContent = "–";
        document.getElementById("info-car-name").textContent  = "–";
        document.getElementById("info-car-time").textContent  = "–";
        document.getElementById("info-senna-time").textContent = estimateQuarterMile(senna.power) + "s";
        document.getElementById("raceInfoRow").style.display  = "flex";
        const btn = document.getElementById("raceBtn");
        btn.innerHTML = `<span class="race-btn-icon">&#9654;</span> START RACE`;
        btn.disabled  = true;
        document.getElementById("raceResult").style.display = "none";
    }
}

// ─── Comparison table ─────────────────────────────────────────────────────────
function updateComparison() {
    const car = filteredCars[selectedCarIdx];
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

    const tCar   = estimateQuarterMile(currentCarHP);
    const tSenna = estimateQuarterMile(senna.power);
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

// ─── Dynamic track width ──────────────────────────────────────────────────────
function getTrackPct(carEl) {
    const road    = carEl.closest(".lane-road");
    const roadW   = road ? road.offsetWidth : 600;
    const carW    = carEl.offsetWidth || 110;
    const maxLeft = roadW - carW - 52.5;
    const startPx = roadW * 0.02;
    const travel  = maxLeft - startPx;
    return (travel / roadW) * 100;
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

    const tCar   = estimateQuarterMile(currentCarHP);
    const tSenna = estimateQuarterMile(senna.power);

    const carVisualMs   = tCar   * 1000;
    const sennaVisualMs = tSenna * 1000;

    const carEl       = document.getElementById("raceCar");
    const sennaEl     = document.getElementById("raceSenna");
    const timeCarEl   = document.getElementById("time-car");
    const timeSennaEl = document.getElementById("time-senna");

    const carTrackPct   = getTrackPct(carEl);
    const sennaTrackPct = getTrackPct(sennaEl);

    let startTs       = null;
    let carFinished   = false;
    let sennaFinished = false;

    startExhaust();

    function frame(ts) {
        if (!startTs) startTs = ts;
        const elapsed = ts - startTs;

        const carProgress   = Math.min(elapsed / carVisualMs,   1);
        const sennaProgress = Math.min(elapsed / sennaVisualMs, 1);

        carEl.style.left   = `${2 + easeIn(carProgress)   * carTrackPct}%`;
        sennaEl.style.left = `${2 + easeIn(sennaProgress) * sennaTrackPct}%`;

        if (!carFinished)   timeCarEl.textContent   = (elapsed / 1000).toFixed(2) + "s";
        if (!sennaFinished) timeSennaEl.textContent = (elapsed / 1000).toFixed(2) + "s";

        if (carProgress >= 1 && !carFinished) {
            carFinished = true;
            timeCarEl.textContent = tCar + "s";
            carEl.classList.add("car-bounce");
            stopExhaustFor("car");
        }
        if (sennaProgress >= 1 && !sennaFinished) {
            sennaFinished = true;
            timeSennaEl.textContent = tSenna + "s";
            sennaEl.classList.add("car-bounce");
            stopExhaustFor("senna");
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

    const carWins    = tCar < tSenna;
    const winnerName = carWins ? currentCarName : "McLaren Senna";
    const diff       = Math.abs(tCar - tSenna).toFixed(2);

    result.innerHTML = `
        <span class="result-winner">${winnerName} wins!</span>
        <span class="result-diff">Gap: ${diff}s</span>
    `;
    result.classList.toggle("winner-blue", carWins);
    result.style.display = "flex";

    btn.disabled  = false;
    btn.innerHTML = `<span class="race-btn-icon">&#8635;</span> RACE AGAIN`;
}

// ─── Physics ──────────────────────────────────────────────────────────────────
function easeIn(t) { return t * t; }

// ─── Exhaust particles ────────────────────────────────────────────────────────
function startExhaust() {
    stopExhaust();
    const ids = { car: "exhaust-car", senna: "exhaust-senna" };
    Object.entries(ids).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el) return;
        exhaustIntervals[key] = setInterval(() => spawnParticle(el), 70);
    });
}

function stopExhaustFor(which) {
    if (exhaustIntervals[which]) {
        clearInterval(exhaustIntervals[which]);
        exhaustIntervals[which] = null;
    }
}

function stopExhaust() {
    stopExhaustFor("car");
    stopExhaustFor("senna");
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