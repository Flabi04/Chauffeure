const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function sendJson(res, statusCode, payload) {
  setCors(res);
  res.status(statusCode).send(JSON.stringify(payload));
}

function envError() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return "SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt.";
  }
  return null;
}

function restUrl(query) {
  return `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${query}`;
}

function headers(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body;
}

function normalizeFahrt(row) {
  return {
    id: row.id,
    created_at: row.created_at,
    fahrer_name: row.fahrer_name || "",
    fahrzeug: row.fahrzeug || "",
    tour: row.tour || "",
    datum: row.datum || "",
    startzeit: row.startzeit ? String(row.startzeit).slice(0, 5) : "",
    endzeit: row.endzeit ? String(row.endzeit).slice(0, 5) : "",
    km_start: Number(row.km_start || 0),
    km_ende: Number(row.km_ende || 0),
    probleme: Array.isArray(row.probleme) ? row.probleme : [],
    bemerkung: row.bemerkung || ""
  };
}

function validateFahrt(fahrt) {
  const required = ["fahrer_name", "fahrzeug", "tour", "datum", "startzeit", "endzeit", "km_start", "km_ende"];
  const missing = required.filter(field => String(fahrt[field] ?? "").trim() === "");
  if (missing.length) return `Bitte ausfuellen: ${missing.join(", ")}`;

  const kmStart = Number(fahrt.km_start);
  const kmEnde = Number(fahrt.km_ende);
  if (!Number.isFinite(kmStart) || !Number.isFinite(kmEnde)) return "Kilometer muessen Zahlen sein.";
  if (kmEnde < kmStart) return "Kilometer Ende darf nicht kleiner als Kilometer Start sein.";

  return null;
}

async function handleGet(res) {
  const response = await fetch(restUrl("fahrten?select=*&order=created_at.desc"), {
    method: "GET",
    headers: headers()
  });
  const data = await readJson(response);

  if (!response.ok) {
    sendJson(res, response.status, { ok: false, error: data?.message || "Fahrten konnten nicht geladen werden." });
    return;
  }

  sendJson(res, 200, { ok: true, fahrten: Array.isArray(data) ? data.map(normalizeFahrt) : [] });
}

async function handlePost(req, res) {
  let body;
  try {
    body = readBody(req);
  } catch (error) {
    sendJson(res, 400, { ok: false, error: "Ungueltiges JSON." });
    return;
  }

  const validationError = validateFahrt(body);
  if (validationError) {
    sendJson(res, 400, { ok: false, error: validationError });
    return;
  }

  const payload = {
    fahrer_name: String(body.fahrer_name).trim(),
    fahrzeug: String(body.fahrzeug).trim(),
    tour: String(body.tour).trim(),
    datum: String(body.datum).trim(),
    startzeit: String(body.startzeit).trim(),
    endzeit: String(body.endzeit).trim(),
    km_start: Number(body.km_start),
    km_ende: Number(body.km_ende),
    probleme: Array.isArray(body.probleme) ? body.probleme.map(String) : [],
    bemerkung: String(body.bemerkung || "").trim()
  };

  const response = await fetch(restUrl("fahrten?select=*"), {
    method: "POST",
    headers: headers({
      "Content-Type": "application/json",
      Prefer: "return=representation"
    }),
    body: JSON.stringify(payload)
  });
  const data = await readJson(response);

  if (!response.ok) {
    sendJson(res, response.status, { ok: false, error: data?.message || "Fahrt konnte nicht gespeichert werden." });
    return;
  }

  const saved = Array.isArray(data) ? data[0] : data;
  sendJson(res, 201, { ok: true, fahrt: normalizeFahrt(saved) });
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(200).send(JSON.stringify({ ok: true }));
    return;
  }

  const missingEnv = envError();
  if (missingEnv) {
    sendJson(res, 500, { ok: false, error: missingEnv });
    return;
  }

  try {
    if (req.method === "GET") {
      await handleGet(res);
      return;
    }

    if (req.method === "POST") {
      await handlePost(req, res);
      return;
    }

    sendJson(res, 405, { ok: false, error: "Methode nicht erlaubt." });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || "Serverfehler." });
  }
};
