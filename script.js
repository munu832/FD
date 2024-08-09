// Google Sheets API key and spreadsheet ID
const API_KEY = 'YOUR_API_KEY';
const SPREADSHEET_ID = '1VlNJVG9gyH5QsbBeqU7QT1_6b18jfvEznrX-Sod0gPU';

// Function to fetch data from Google Sheets
async function fetchSheetData() {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A:I?key=${API_KEY}`);
    const data = await response.json();
    return data.values;
}

// Function to process the data and update the dashboard
async function updateDashboard() {
    const sheetData = await fetchSheetData();
    const headers = sheetData[0];
    const values = sheetData.slice(1);

    // Update summary statistics
    const totalDeposits = values.length;
    const totalInvested = values.reduce((sum, row) => sum + parseFloat(row[2]), 0);
    const avgInterestRate = values.reduce((sum, row) => sum + parseFloat(row[3]), 0) / totalDeposits;
    const expectedReturns = values.reduce((sum, row) => sum + parseFloat(row[7]) - parseFloat(row[2]), 0);

    document.getElementById('totalDeposits').textContent = totalDeposits;
    document.getElementById('totalInvested').textContent = `$${totalInvested.toFixed(2)}`;
    document.getElementById('avgInterestRate').textContent = `${(avgInterestRate * 100).toFixed(2)}%`;
    document.getElementById('expectedReturns').textContent = `$${expectedReturns.toFixed(2)}`;

    // Update bank distribution chart
    const bankData = {};
    values.forEach(row => {
        const bank = row[1];
        const amount = parseFloat(row[2]);
        bankData[bank] = (bankData[bank] || 0) + amount;
    });

    new Chart(document.getElementById('bankDistribution'), {
        type: 'pie',
        data: {
            labels: Object.keys(bankData),
            datasets: [{
                data: Object.values(bankData),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Investments Across Banks'
                }
            }
        }
    });

    // Update maturity timeline chart
    const maturityData = {};
    values.forEach(row => {
        const maturityDate = new Date(row[5]);
        const month = maturityDate.toLocaleString('default', { month: 'short' });
        const amount = parseFloat(row[7]);
        maturityData[month] = (maturityData[month] || 0) + amount;
    });

    new Chart(document.getElementById('maturityTimeline'), {
        type: 'line',
        data: {
            labels: Object.keys(maturityData),
            datasets: [{
                label: 'Maturing Amount',
                data: Object.values(maturityData),
                borderColor: '#4BC0C0',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Maturity Timeline'
                }
            }
        }
    });

    // Update upcoming maturities table
    const table = document.getElementById('maturitiesTable');
    const today = new Date();
    const threeMonthsLater = new Date(today.setMonth(today.getMonth() + 3));

    values.filter(row => new Date(row[5]) <= threeMonthsLater)
          .sort((a, b) => new Date(a[5]) - new Date(b[5]))
          .slice(0, 5)
          .forEach(row => {
              const tableRow = table.insertRow();
              [0, 1, 2, 5].forEach(index => {
                  const cell = tableRow.insertCell();
                  cell.textContent = row[index];
              });
          });
}

// Call the updateDashboard function when the page loads
window.onload = updateDashboard;
