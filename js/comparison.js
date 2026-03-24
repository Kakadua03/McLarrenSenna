let allData = [];
let chart;

// Load CSV Data
Papa.parse("../web-application/carapi-opendatafeed-sample/models-sample.csv", {
  download: true,
  header: true,
  complete: function(results) {
    allData = results.data.filter(row => row["Make Name"]);

    populateDropdown(allData);
    updateChart(allData);
  }
});

// Fill Dropdown
function populateDropdown(data) {
  const brands = [...new Set(data.map(item => item["Make Name"]))];
  const select = document.getElementById("brandFilter");

  brands.forEach(brand => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    select.appendChild(option);
  });
}

// Event Listener
document.getElementById("search").addEventListener("input", filterData);
document.getElementById("brandFilter").addEventListener("change", filterData);

// Filter Funktion
function filterData() {
  const searchValue = document.getElementById("search").value.toLowerCase();
  const selectedBrand = document.getElementById("brandFilter").value;

  let filtered = allData;

  // Filter Brand
  if (selectedBrand) {
    filtered = filtered.filter(item => item["Make Name"] === selectedBrand);
  }

  // Filter Search
  if (searchValue) {
    filtered = filtered.filter(item =>
      item["Make Name"].toLowerCase().includes(searchValue) ||
      item["Model Name"].toLowerCase().includes(searchValue)
    );
  }

  updateChart(filtered);
}

// Update Chart
function updateChart(data) {

  const counts = {};

  data.forEach(item => {
    const make = item["Make Name"];
    counts[make] = (counts[make] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(document.getElementById("myChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Models per Make",
        data: values,
        backgroundColor: "rgba(75, 192, 192, 0.6)"
      }]
    }
  });
}