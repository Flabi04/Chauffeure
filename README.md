# Chauffeur Control

Statische Fahrer-App mit Vercel API und Supabase.

## Dateien

```text
api/fahrten.js
public/index.html
public/admin.html
public/app.js
public/admin.js
public/styles.css
public/api-test.html
supabase-schema.sql
vercel.json
package.json
README.md
```

## Supabase

Im Supabase SQL Editor `supabase-schema.sql` ausfuehren.

## Vercel Environment Variables

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Der Service Role Key darf nur in Vercel als Environment Variable stehen.

## Test

1. `/api-test.html` oeffnen.
2. GET testen.
3. POST testen.
4. Danach `/admin.html` oeffnen und den Testeintrag pruefen.
