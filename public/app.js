const form = document.querySelector("#fahrtForm");
const statusEl = document.querySelector("#status");
const datumEl = document.querySelector("#datum");

datumEl.value = new Date().toISOString().slice(0, 10);

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

async function postFahrt(fahrt) {
  const response = await fetch("/api/fahrten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fahrt)
  });
  const data = await response.json().catch(() => ({ error: "API hat kein JSON geliefert." }));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Fahrt konnte nicht gespeichert werden.");
  }

  return data.fahrt;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  setStatus("Speichern laeuft...");

  try {
    const formData = new FormData(form);
    const fahrt = Object.fromEntries(formData.entries());
    fahrt.probleme = formData.getAll("probleme");

    if (Number(fahrt.km_ende) < Number(fahrt.km_start)) {
      throw new Error("Kilometer Ende darf nicht kleiner als Kilometer Start sein.");
    }

    await postFahrt(fahrt);

    const fahrerName = fahrt.fahrer_name;
    form.reset();
    document.querySelector("#fahrerName").value = fahrerName;
    datumEl.value = new Date().toISOString().slice(0, 10);
    setStatus("Fahrt wurde gespeichert.", "success");
  } catch (error) {
    setStatus(error.message || "Fahrt konnte nicht gespeichert werden.", "error");
  }
});
