let chartInstance = null; // Global variable to store the chart instance

// DOM constants
const amountInput = document.getElementById("amount");
const currencySelect = document.getElementById("currency");
const form = document.getElementById("form");
const resultDiv = document.getElementById("result");
const historyCanvas = document.getElementById("history").getContext("2d");

// Function to fetch currency data from the API
async function fetchCurrencies() {
  try {
    const response = await fetch("https://mindicador.cl/api");
    if (!response.ok) {
      throw new Error("Error al obtener las divisas desde la API");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    resultDiv.innerText = `Error: ${error.message}`;
    throw error;
  }
}

// Function to render only UF, Dollar, and Euro in the <select>
async function renderCurrencies() {
  const currencies = await fetchCurrencies();

  // Only show UF, Dollar, and Euro
  const allowedCurrencies = ["uf", "dolar", "euro"];
  allowedCurrencies.forEach((currency) => {
    const option = document.createElement("option");
    option.value = currency;
    option.innerText = currencies[currency].nombre; // Keep the currency names in Spanish
    currencySelect.appendChild(option);
  });
}

// Function to render the chart with the provided data
function renderChart(labels, values, currency) {
  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(historyCanvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Historial últimos 10 días de ${currency.toUpperCase()}`,
          data: values,
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: false,
        },
      },
    },
  });
}

// Function that initiates the query and rendering of data
async function startConversion(event) {
  event.preventDefault(); // Prevent the form from reloading the page

  const amount = amountInput.value;
  const currency = currencySelect.value;

  if (!amount || isNaN(amount) || amount <= 0) {
    resultDiv.innerText = "Por favor, ingrese una cantidad válida en CLP.";
    return;
  }

  if (!currency) {
    resultDiv.innerText = "Por favor, seleccione una moneda válida.";
    return;
  }

  try {
    const response = await fetch(`https://mindicador.cl/api/${currency}`);
    if (!response.ok) {
      throw new Error("Error al obtener los datos de la API");
    }

    const data = await response.json();

    if (!data.serie || data.serie.length === 0) {
      throw new Error("No se encontraron datos para la moneda seleccionada");
    }

    const currencyValue = data.serie[0].valor;
    const result = amount / currencyValue;

    // Get the currency symbol
    let symbol = "";
    switch (currency) {
      case "dolar":
        symbol = "$";
        break;
      case "euro":
        symbol = "€";
        break;
      case "uf":
        symbol = "UF";
        break;
      default:
        symbol = "";
    }

    // Display the result with the appropriate symbol
    resultDiv.innerText = `Resultado: ${symbol} ${result.toFixed(2)}`;

    // Get data for the last 10 days
    const labels = data.serie
      .slice(0, 10)
      .reverse()
      .map((d) => d.fecha.split("T")[0]);
    const values = data.serie
      .slice(0, 10)
      .reverse()
      .map((d) => d.valor);

    // Render the chart
    renderChart(labels, values, currency);
  } catch (error) {
    resultDiv.innerText = `Error: ${error.message}`;
  }
}

// Load currencies when the page loads
document.addEventListener("DOMContentLoaded", renderCurrencies);

// Capture the form submit event
form.addEventListener("submit", startConversion);
