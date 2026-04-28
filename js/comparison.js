let cars = [];

// McLaren Senna Stats
const senna = {
    name: "McLaren Senna",
    power: 800,
    size: 4.0,
    cylinders: 8
};

// CSV
Papa.parse("../web-application/carapi-opendatafeed-sample/engines-sample.csv", {
    download: true,
    header: true,
    complete: function(results) {
        cars = results.data;
        init();
    }
});

function init() {
    // Remove Duplicates (Highest PS)
    const map = new Map();
    cars.forEach(c => {
        const key = `${c["Make Name"]}_${c["Model Name"]}`;
        const ps = Number(c["Engine Horsepower Hp"]) || 0;
        if (!map.has(key) || ps > Number(map.get(key)["Engine Horsepower Hp"])) {
            map.set(key, c);
        }
    });
    cars = Array.from(map.values());

    // Make List
    const brands = [...new Set(cars.map(c => c["Make Name"]))];
    const brandFilter = document.getElementById("brandFilter");
    brands.forEach(b => {
        if (!b) return;
        let opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        brandFilter.appendChild(opt);
    });

    brandFilter.addEventListener("change", updateDropdown);
    updateDropdown();
}

// Dropdown
function updateDropdown() {
    const brand = document.getElementById("brandFilter").value;
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

// Build unified table with inline CSS bars
function updateComparison(list) {
    const dropdown = document.getElementById("carDropdown");
    const index = dropdown.value;
    const car = list[index];
    if (!car) return;

    const carName = `${car["Make Name"]} ${car["Model Name"]}`;

    const metrics = [
        { label: "PS",          carVal: Number(car["Engine Horsepower Hp"]),    sennaVal: senna.power,     unit: " PS" },
        { label: "Engine Size", carVal: Number(car["Engine Size"]),              sennaVal: senna.size,      unit: " L"  },
        { label: "Cylinders",   carVal: parseCylinders(car["Engine Cylinders"]), sennaVal: senna.cylinders, unit: ""    }
    ];

    // Each metric is normalised independently: higher value = 100%
    const rows = metrics.map(m => {
        const max = Math.max(m.carVal, m.sennaVal) || 1;
        const carPct   = (m.carVal  / max * 100).toFixed(1);
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

    // Trigger CSS transition animation after first paint
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelectorAll(".bar[data-width]").forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        });
    });
}

// Helper: Parse Cylinders (e.g. "V8" → 8)
function parseCylinders(value) {
    if (!value) return 0;
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : 0;
}