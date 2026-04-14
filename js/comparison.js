let cars = [];
let chart;

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

    // Best Car
    if (filtered.length > 0) {
        let bestIndex = 0;
        let maxPS = 0;
        filtered.forEach((c, i) => {
            const ps = Number(c["Engine Horsepower Hp"]) || 0;
            if (ps > maxPS) {
                maxPS = ps;
                bestIndex = i;
            }
        });
        dropdown.value = bestIndex;
        updateComparison(filtered);
    }

    dropdown.onchange = () => updateComparison(filtered);
}

// Update Comparison
function updateComparison(list) {
    const dropdown = document.getElementById("carDropdown");
    const index = dropdown.value;
    const car = list[index];

    if (!car) return;

    console.log(car);

    const div = document.getElementById("compareData");
    div.innerHTML = `
        <h3>${car["Make Name"]} ${car["Model Name"]} vs McLaren Senna</h3>
        <table class="table table-dark table-bordered">
            <tr>
                <th></th>
                <th>${car["Make Name"]} ${car["Model Name"]}</th>
                <th>McLaren Senna</th>
            </tr>
            <tr>
                <td>PS</td>
                <td>${car["Engine Horsepower Hp"]}</td>
                <td>${senna.power}</td>
            </tr>
            <tr>
                <td>Engine Size</td>
                <td>${car["Engine Size"]} L</td>
                <td>${senna.size} L</td>
            </tr>
            <tr>
                <td>Cylinders</td>
                <td>${parseCylinders(car["Engine Cylinders"])}</td>
                <td>${senna.cylinders}</td>
            </tr>
        </table>
    `;

    updateChart(car);
}

// Chart
function updateChart(car) {
    const ctx = document.getElementById("myChart").getContext("2d");

    if (chart) chart.destroy();
chart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: ["PS", "Engine Size", "Cylinders"],
        datasets: [
            {
                label: `${car["Make Name"]} ${car["Model Name"]}`,
                data: [
                    Number(car["Engine Horsepower Hp"]),
                    Number(car["Engine Size"]),
                    parseCylinders(car["Engine Cylinders"])
                ],
                backgroundColor: "#00A4EF"
            },
            {
                label: "McLaren Senna",
                data: [
                    senna.power,
                    senna.size,
                    senna.cylinders
                ],
                backgroundColor: "#ff8700"
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                display: false
            }
        }
    }
});
}

// Helper: Parse Cylinders (z.B. "V8" → 8)
function parseCylinders(value) {
    if (!value) return 0;
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : 0;
}