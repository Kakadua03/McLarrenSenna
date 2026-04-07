<<<<<<< HEAD
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
=======
console.log("APP JS GELADEN");

let allData = [];
let chart;

// CSV Datei laden (lokal über File Input)
document.getElementById("csvFile").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {

      const unique = {};

      results.data.forEach(row => {
        const hp = row["Engine Horsepower Hp"];
        if (!hp) return;

        const key = row["Make Name"] + row["Model Name"] + hp;

        if (!unique[key]) {
          unique[key] = row;
        }
      });

      allData = Object.values(unique);

      populateDropdowns(allData);

      console.log("CSV geladen:", allData);
    }
  });
});

// Dropdowns füllen
function populateDropdowns(data) {
  const select1 = document.getElementById("car1");
  const select2 = document.getElementById("car2");

  select1.innerHTML = "";
  select2.innerHTML = "";

  data.forEach(car => {
    const name = `${car["Make Name"]} ${car["Model Name"]} (${car["Engine Horsepower Hp"]} PS)`;

    select1.add(new Option(name, name));
    select2.add(new Option(name, name));
  });
}

// Vergleich starten
function compareCars() {
  const car1 = document.getElementById("car1").value;
  const car2 = document.getElementById("car2").value;

  const selected = allData.filter(car => {
    const name = `${car["Make Name"]} ${car["Model Name"]} (${car["Engine Horsepower Hp"]} PS)`;
    return name === car1 || name === car2;
  });

  updateChart(selected);
}

// Chart erstellen
function updateChart(cars) {

  const labels = cars.map(car =>
    `${car["Make Name"]} ${car["Model Name"]}`
  );

  const horsepower = cars.map(car =>
    parseInt(car["Engine Horsepower Hp"]) || 0
  );

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(document.getElementById("myChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "PS (Horsepower)",
        data: horsepower
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Auto Leistungsvergleich"
        }
      }
>>>>>>> refs/remotes/origin/main
    }

    dropdown.onchange = () => updateComparison(filtered);
}

// Update Comparison
function updateComparison(list) {
    const dropdown = document.getElementById("carDropdown");
    const index = dropdown.value;
    const car = list[index];

    if (!car) return;

    const div = document.getElementById("compareData");
    div.innerHTML = `
        <h3>${car["Make Name"]} ${car["Model Name"]} vs McLaren Senna</h3>
        <table class="table table-dark table-bordered">
            <tr>
                <th></th>
                <th>${car["Model Name"]}</th>
                <th>McLaren Senna</th>
            </tr>
            <tr>
                <td>PS</td>
                <td>${car["Engine Horsepower Hp"]}</td>
                <td>${senna.power}</td>
            </tr>
            <tr>
                <td>Hubraum</td>
                <td>${car["Engine Size"]} L</td>
                <td>${senna.size} L</td>
            </tr>
            <tr>
                <td>Zylinder</td>
                <td>${car["Engine Cylinders"]}</td>
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
            labels: ["PS", "Hubraum", "Zylinder"],
            datasets: [
                {
                    label: car["Model Name"],
                    data: [
                        Number(car["Engine Horsepower Hp"]),
                        Number(car["Engine Size"]),
                        Number(car["Engine Cylinders"])
                    ],
                    backgroundColor: "blue"
                },
                {
                    label: "McLaren Senna",
                    data: [
                        senna.power,
                        senna.size,
                        senna.cylinders
                    ],
                    backgroundColor: "orange"
                }
            ]
        }
    });
}