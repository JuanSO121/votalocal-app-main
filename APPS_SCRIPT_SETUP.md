# Backend — Google Apps Script + Google Sheets

Este proyecto **no usa base de datos**. La evidencia oficial se guarda en un
Google Sheets mediante un Web App de Google Apps Script.

## 1) Crear la hoja de cálculo

1. Vaya a https://drive.google.com y cree un nuevo Google Sheets.
2. Renombre la primera pestaña a `Votos`.
3. Copie estas cabeceras en la fila 1 (columnas A–H):

```
id | fecha_hora | nombre | documento | correo | dependencia | candidato_id | candidato_nombre
```

4. Copie el **ID del Sheets** de la URL:
   `https://docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`

## 2) Publicar el Web App

En el mismo Sheets: **Extensiones → Apps Script**. Reemplace el contenido con:

```js
// ============================================================
// CONFIGURACIÓN — reemplace estos valores
// ============================================================
const SHEET_ID  = 'PEGUE_AQUI_EL_ID_DEL_SHEETS';
const SHEET_TAB = 'Votos';

// Anti-doble-envío: cache por documento durante 24h.
const CACHE_TTL_SECONDS = 60 * 60 * 24;

function doPost(e) {
  const lock = LockService.getScriptLock();
  // Espera hasta 15s para evitar condiciones de carrera con votos simultáneos.
  lock.waitLock(15000);
  try {
    const payload = JSON.parse(e.postData.contents || '{}');

    // --- Validación defensiva (replica el schema del frontend) ---
    const required = ['id','nombre','documento','correo','candidato_id','candidato_nombre','fecha_hora'];
    for (const k of required) {
      if (!payload[k] || String(payload[k]).trim() === '') {
        return json({ ok:false, error:'Campo requerido: ' + k });
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo)) {
      return json({ ok:false, error:'Correo inválido' });
    }
    if (!/^[0-9]{5,20}$/.test(payload.documento)) {
      return json({ ok:false, error:'Documento inválido' });
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_TAB);
    if (!sheet) return json({ ok:false, error:'Hoja no encontrada' });

    // --- Deduplicación por ID de voto y por documento ---
    const cache = CacheService.getScriptCache();
    if (cache.get('vote:' + payload.id)) {
      return json({ ok:true, id: payload.id, duplicated:true });
    }
    if (cache.get('doc:' + payload.documento)) {
      return json({ ok:false, error:'Este documento ya registró un voto.' });
    }

    // Doble chequeo en la hoja (a prueba de reinicios de cache).
    const data = sheet.getRange(2, 1, Math.max(sheet.getLastRow()-1,0), 4).getValues();
    for (const row of data) {
      if (row[0] === payload.id) {
        return json({ ok:true, id: payload.id, duplicated:true });
      }
      if (String(row[3]) === String(payload.documento)) {
        return json({ ok:false, error:'Este documento ya registró un voto.' });
      }
    }

    sheet.appendRow([
      payload.id,
      payload.fecha_hora,
      sanitize(payload.nombre),
      sanitize(payload.documento),
      sanitize(payload.correo),
      sanitize(payload.dependencia || ''),
      sanitize(payload.candidato_id),
      sanitize(payload.candidato_nombre),
    ]);

    cache.put('vote:' + payload.id, '1', CACHE_TTL_SECONDS);
    cache.put('doc:' + payload.documento, '1', CACHE_TTL_SECONDS);

    return json({ ok:true, id: payload.id });
  } catch (err) {
    return json({ ok:false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function sanitize(v){ return String(v).replace(/[\u0000-\u001F\u007F]/g,'').trim().slice(0,200); }
function json(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
```

### Publicar

1. Haga clic en **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. **Ejecutar como:** usted mismo.
4. **Quién tiene acceso:** *Cualquier persona*.
5. Copie la **URL del Web App**.

## 3) Configurar el frontend

Cree un archivo `.env` en la raíz del proyecto:

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
```

Al desplegar en Vercel/Netlify agregue esa misma variable en el panel del
proveedor. **Nunca** ponga el ID del Sheets en el frontend: vive dentro del
Apps Script.

## Concurrencia

El endpoint usa `LockService` (bloqueo pesimista de hasta 15s) + `CacheService`
+ doble verificación sobre la hoja para garantizar que ningún voto se pierda ni
se duplique aun cuando muchos usuarios voten al mismo tiempo. El cliente
reintenta hasta 3 veces con backoff exponencial ante errores de red.

## Escalabilidad futura

La arquitectura está lista para agregar:

- Autenticación con Microsoft 365 (validando el correo institucional antes de
  permitir enviar el voto).
- Panel administrativo con resultados en tiempo real (consumiendo un endpoint
  `doGet` del mismo Apps Script).
- Bloqueo automático por fecha (agregar `VOTING_END_DATE` en el script).
- Exportación de resultados y auditoría adicional.