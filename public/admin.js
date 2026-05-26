const tbody = document.querySelector("#fahrtenTbody");
const statusEl = document.querySelector("#adminStatus");
const reloadButton = document.querySelector("#reloadButton");

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

async function getFahrten() {
  const response = await fetch("/api/fahrten");
  const data = await response.json().catch(() => ({ error: "API hat kein JSON geliefert." }));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Fahrten konnten nicht geladen werden.");
  }

  return data.fahrten || [];
}

function renderFahrten(fahrten) {
  if (!fahrten.length) {
    tbody.innerHTML = `<tr><td colspan="8">Keine Fahrten gespeichert.</td></tr>`;
    return;
  }

  tbody.innerHTML = fahrten.map(fahrt => {
    const km = `${fahrt.km_start} - ${fahrt.km_ende} (${fahrt.km_ende - fahrt.km_start} km)`;
    const probleme = fahrt.probleme?.length ? fahrt.probleme.join(", ") : "Nein";

    return `
      <tr>
        <td>${escapeHtml(fahrt.datum)}</td>
        <td>${escapeHtml(fahrt.fahrer_name)}</td>
        <td>${escapeHtml(fahrt.fahrzeug)}</td>
        <td>${escapeHtml(fahrt.tour)}</td>
        <td>${escapeHtml(fahrt.startzeit)} - ${escapeHtml(fahrt.endzeit)}</td>
        <td>${escapeHtml(km)}</td>
        <td>${escapeHtml(probleme)}</td>
        <td>${escapeHtml(fahrt.bemerkung)}</td>
      </tr>
    `;
  }).join("");
}

async function loadFahrten() {
  setStatus("Fahrten werden geladen...");

  try {
    const fahrten = await getFahrten();
    renderFahrten(fahrten);
    setStatus(`${fahrten.length} Fahrten geladen.`, "success");
  } catch (error) {
    renderFahrten([]);
    setStatus(error.message || "Fahrten konnten nicht geladen werden.", "error");
  }
}

reloadButton.addEventListener("click", loadFahrten);
loadFahrten();
