const tableBody = document.getElementById("table-body");
const countryCodeInput = document.getElementById("cc-input");
const yearInput = document.getElementById("y-input");
const dateInput = document.getElementById("holiday-date");
const holidayForm = document.getElementById("holidayForm");
const statusMessage = document.getElementById("status-message");
const submitButton = holidayForm.querySelector('button[type="submit"]');

fetch("https://nagerholidays.com/api/v4/Holidays/AT/2026")
  .then((res) => {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  })
  .then(console.log)
  .catch(console.error);

fetch('https://openworkdays.com/api/v1/countries.json')
  .then(res => res.json())
  .then(console.log);

fetch('https://dummyjson.com/test')
.then(res => res.json())
.then(console.log);

// Contoh API tanpa key (OpenWorkdays)
const API_URL = "https://openworkdays.com/api/v1";

function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message";

    if (type) {
        statusMessage.classList.add(type);
    }
}

function setTableMessage(message) {
    tableBody.replaceChildren();

    const row = tableBody.insertRow();
    const cell = row.insertCell();

    cell.colSpan = 4;
    cell.className = "empty-state";
    cell.textContent = message;
}

function addRows(holidays) {
    tableBody.replaceChildren();

    holidays.forEach((holiday) => {
        const row = tableBody.insertRow();

        row.insertCell().textContent = holiday.date;
        row.insertCell().textContent = holiday.weekday || "";
        row.insertCell().textContent = holiday.name || "Unnamed Holiday";

        let type = "Public";
        if (holiday.observed) {
            type = "Observed";
        } else if (holiday.estimated) {
            type = "Estimated";
        }

        row.insertCell().textContent = type;
    });
}

// Fungsi update julat tarikh bila tahun berubah
function updateDateRange() {
    const year = Number(yearInput.value);

    if (!Number.isInteger(year) || year < 2024 || year > 2030) {
        return;
    }

    dateInput.min = `${year}-01-01`;
    dateInput.max = `${year}-12-31`;

    if (!dateInput.value || Number(dateInput.value.slice(0, 4)) !== year) {
        dateInput.value = `${year}-01-01`;
    }
}

yearInput.addEventListener("change", updateDateRange);

// Hantar borang menggunakan cara .then() / .catch()
holidayForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const countryCode = countryCodeInput.value.trim().toLowerCase();
    const year = Number(yearInput.value);
    const date = dateInput.value;

    if (!/^[a-z]{2}$/.test(countryCode)) {
        setStatus("Sila masukkan kod negara 2 huruf yang sah, contohnya MY atau US.", "error");
        countryCodeInput.focus();
        return;
    }

    if (!Number.isInteger(year) || year < 2024 || year > 2030) {
        setStatus("Sila masukkan tahun antara 2024 dan 2030.", "error");
        yearInput.focus();
        return;
    }

    if (!date || Number(date.slice(0, 4)) !== year) {
        setStatus("Sila pilih tarikh yang sepadan dengan tahun dipilih.", "error");
        dateInput.focus();
        return;
    }

    // Mula proses mendapatkan data cuti
    setStatus("Memuatkan data cuti...");
    setTableMessage("Loading...");
    submitButton.disabled = true;

    const url = `${API_URL}/${countryCode}/${year}.json`;

    // Contoh penggunaan .then() dan .catch()
    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    response.status === 404
                        ? "Data cuti tidak dijumpai. Semak kod negara dan tahun."
                        : `Ralat API: ${response.status}`
                );
            }
            // Tukar respons kepada format JSON
            return response.json();
        })
        .then((data) => {
            if (!data || !Array.isArray(data.holidays)) {
                throw new Error("Respons API tidak sah. Sila cuba lagi.");
            }

            const holidays = data.holidays
                .filter((holiday) => holiday.date && holiday.name)
                .sort((a, b) => a.date.localeCompare(b.date));

            if (holidays.length > 0) {
                addRows(holidays);
            } else {
                setTableMessage("Tiada cuti umum dijumpai untuk negara dan tahun ini.");
            }

            // Semak tarikh yang dipilih pengguna
            const selectedDateHolidays = holidays.filter(
                (holiday) => holiday.date === date
            );

            let dateMessage;
            if (selectedDateHolidays.length > 0) {
                dateMessage = `${date} adalah cuti umum di ${data.country || countryCode.toUpperCase()}: ` +
                    selectedDateHolidays.map((h) => h.name).join(", ");
            } else {
                dateMessage = `${date} bukan cuti umum di ${data.country || countryCode.toUpperCase()}.`;
            }

            setStatus(`Jumpa ${holidays.length} cuti umum. ${dateMessage}`, "success");
        })
        .catch((error) => {
            console.error("Carian cuti gagal:", error);
            setTableMessage("Data cuti gagal dimuatkan.");
            setStatus(
                error instanceof TypeError
                    ? "Sambungan gagal. Sila semak sambungan internet anda."
                    : error.message,
                "error"
            );
        })
        .finally(() => {
            // Blok ini akan sentiasa dijalankan sama ada berjaya atau gagal
            submitButton.disabled = false;
        });
});

// Tetapan nilai lalai (default)
const today = new Date();
const currentYear = today.getFullYear();

yearInput.value = Math.min(2030, Math.max(2024, currentYear));
dateInput.value = currentYear >= 2024 && currentYear <= 2030
    ? `${currentYear}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    : `${yearInput.value}-01-01`;

updateDateRange();