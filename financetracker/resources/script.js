const canvas = document.getElementById('displayWindow').getContext('2d');

const masterData = {
  Essentials: {
    subCategory: {
      Housing: { amount: 0, color: "#374E70" },
      Utilities: { amount: 0, color: "#50688A" },
      Groceries: { amount: 0, color: "#6A82A4" },
      Transport: { amount: 0, color: "#839BBD" },
      Health: { amount: 0, color: "#9CB4D6" }
    },
    color: "#1D3557"
  },

  Luxury: {
    subCategory: {
      Food: { amount: 0, color: "#8B1C28" },
      Entertainment: { amount: 0, color: "#A83642" },
      Shopping: { amount: 0, color: "#C64F5B" }
    },
    color: "#6A040F"
  },

  Growth: {
    subCategory: {
      Savings: { amount: 0, color: "#33594A" },
      Investment: { amount: 0, color: "#4D7563" },
      Education: { amount: 0, color: "#68817C" }
    },
    color: "#1B4332"
  }
};

let data = masterData;

const emptyChartData = {
  labels: ["No data"],
  datasets: [{
    data: [1],
    backgroundColor: ["#8c8c8c"],
  }]
};

function sumCategories(group) {
  return Object.values(group.subCategory).reduce((sum, entry) => sum + entry.amount, 0);
}

function loadData() {
  const savedUserFinanceData = localStorage.getItem('userFinanceData');
  if (savedUserFinanceData) {
    Object.assign(data, JSON.parse(savedUserFinanceData));
  }
}

function exportData() {
  const exportUserFinanceData = JSON.stringify(data, null, 2);
  const blob = new Blob([exportUserFinanceData], { type: 'application/json' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = 'SimpleFinanceTrackerUserData.json';
  downloadLink.click();
}

function validateImportData(dataToCheck) {
  function checkKeys(a, b) {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();

    if (aKeys.length !== bKeys.length) return false;

    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) {
        return false;
      }
    }
    return true;
  }

  function checkStructure(a, b) {
    if (typeof a !== 'object' || typeof b !== 'object') return true;

    if (!checkKeys(a, b)) return false;

    for (let key in a) {
      if (a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
        if (!checkStructure(a[key], b[key])) {
          return false;
        }
      }
    }
    return true;
  }

  if (typeof dataToCheck !== 'object' || dataToCheck === null) return false;

  return checkStructure(dataToCheck, masterData);
}

function clearData() {

  if (confirm("Are you sure you want to clear your data?")) {
    localStorage.clear();

    data = masterData;
    location.reload(true);
  }
}

function updateLegend(summedDataSet) {
  const legend = document.getElementById("legend");
  legend.innerHTML = "";

  const legendGrid = document.createElement("div");
  legendGrid.style.display = "grid";
  legendGrid.style.gridTemplateColumns = "auto auto";
  legendGrid.style.width = "100%";

  summedDataSet.forEach(category => {

    const legendItem = document.createElement("span");
    legendItem.classList.add("legend-item");

    const colorBox = document.createElement("span");
    colorBox.style.backgroundColor = data[category.mainCategories].color;
    colorBox.classList.add("legend-color-box");
    legendItem.appendChild(colorBox);

    const legendLabel = document.createElement("span");
    legendLabel.innerHTML = `${category.mainCategories}<br>Total: $${category.total}`;
    legendItem.appendChild(legendLabel);

    const subCategoryList = document.createElement("ul");
    subCategoryList.style.display = "flex";
    subCategoryList.style.listStyleType = "none";
    subCategoryList.style.flexDirection = "column";


    Object.entries(data[category.mainCategories].subCategory).forEach(([subCategory, subCategoryData]) => {
      const subCategoryItem = document.createElement("li");

      const subCategoryColorBox = document.createElement("span");
      subCategoryColorBox.style.backgroundColor = subCategoryData.color;
      subCategoryColorBox.classList.add("legend-color-box");
      subCategoryItem.appendChild(subCategoryColorBox);

      const subCategoryLabel = document.createElement("span");
      subCategoryLabel.textContent = `${subCategory}: $${subCategoryData.amount}`;
      subCategoryItem.appendChild(subCategoryLabel);

      subCategoryList.append(subCategoryItem);
    });
    legendGrid.appendChild(legendItem);
    legendGrid.appendChild(subCategoryList);
  });

  legend.appendChild(legendGrid);

}

function takeInput() {
  const selectedCategory = document.getElementById("category").value;

  let inputValue = parseFloat(document.getElementById("amount").value);

  if (isNaN(inputValue)) {
    return;
  }

  inputValue = Math.floor(inputValue * 100) / 100;

  Object.entries(data).forEach(([category, subCategories]) => {
    if (selectedCategory in subCategories.subCategory) {
      subCategories.subCategory[selectedCategory].amount += inputValue;
      if (subCategories.subCategory[selectedCategory].amount < 0) {
        subCategories.subCategory[selectedCategory].amount = 0;
      }
    }
  });

  updateTracker();
}

function updateTracker() {

  const grandTotal = Object.values(data).reduce((total, category) => {
    return total + sumCategories(category);
  }, 0);

  const summedData = Object.keys(data).map(mainCategories => {
    const total = sumCategories(data[mainCategories]);
    return {
      mainCategories: mainCategories,
      total: total,
      percentage: grandTotal > 0 ? (total / grandTotal * 100).toFixed(2) : 0
    };
  });

  const zeroData = summedData.every(entry => entry.total === 0);

  const chartData = zeroData ? emptyChartData : {
    datasets: [
      {
        label: "Categories",
        labels: summedData.map(entry => entry.mainCategories),
        data: summedData.map(entry => entry.percentage),
        backgroundColor: Object.values(data).map(mainCategories => mainCategories.color)
      },
      {
        label: "Subcategories",
        labels: Object.entries(data).flatMap(([category, { subCategory }]) => Object.keys(subCategory)),
        data: Object.entries(data).flatMap(([category, { subCategory }]) => Object.values(subCategory).map(subCategoryData => subCategoryData.amount)),
        backgroundColor: Object.entries(data).flatMap(([category, { subCategory }]) => Object.values(subCategory).map(subCategoryData => subCategoryData.color))
      }
    ]
  };

  financeChart.data = chartData;

  if (zeroData) {
    financeChart.options = {
      responsive: true,
      elements: {
        arc: {
          borderWidth: 0
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      }
    }
  } else {
    financeChart.options = {
      ...financeChart.options,
      responsive: true,
      elements: {
        arc: {
          borderWidth: 0
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.chart.data.datasets[context.datasetIndex].labels?.[context.dataIndex] ?? 'Null';
              const value = context.formattedValue;
              if (context.datasetIndex === 0) {
                return ` ${label}: ${value}%`;
              } else if (context.datasetIndex === 1) {
                return ` ${label}: $${value}`;
              }
            }
          }
        }
      }
    }
  }

  localStorage.setItem('userFinanceData', JSON.stringify(data));
  updateLegend(summedData);
  financeChart.update();

}


// On load and hooking buttons up to functions
document.getElementById("submitButton").addEventListener('click', takeInput);
document.getElementById("exportDataButton").addEventListener('click', exportData);
document.getElementById("importDataButton").addEventListener('click', function (event) {
  document.getElementById("importFile").click();
});
document.getElementById("importFile").addEventListener('change', function (event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const importData = JSON.parse(e.target.result);
      if (validateImportData(importData)) {
        data = importData;
        localStorage.setItem('userFinanceData', JSON.stringify(data));
        location.reload(true);
      } else {
        alert("Data invalid.")
      }
    } catch (error) {
      alert("Error while reading file.")
    }
  }

  reader.readAsText(file);
});
document.getElementById("clearDataButton").addEventListener('click', clearData);
window.addEventListener('DOMContentLoaded', loadData);
window.addEventListener('DOMContentLoaded', updateTracker);

const financeChart = new Chart(canvas, {
  type: 'doughnut',
  data: emptyChartData,
  options: {
    responsive: true,
    elements: {
      arc: {
        borderWidth: 0
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    }
  }
});