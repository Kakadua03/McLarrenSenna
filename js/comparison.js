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
    }
  });
}