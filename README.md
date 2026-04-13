# ZAPATA NAILS WhatsApp Backend

Backend inicial en Node.js + Express para identificar y validar clientas desde un webhook compatible con UChat.

## Estructura

```text
.
|-- .env.example
|-- package.json
|-- README.md
|-- src
|   |-- app.js
|   |-- server.js
|   |-- config
|   |   |-- env.js
|   |   `-- googleSheets.js
|   |-- constants
|   |   |-- clientStatus.js
|   |   |-- errorCodes.js
|   |   `-- routes.js
|   |-- controllers
|   |   `-- clientIdentificationController.js
|   |-- routes
|   |   `-- clientIdentificationRoutes.js
|   |-- services
|   |   |-- clientIdentificationService.js
|   |   |-- googleSheetsService.js
|   |   `-- loggingService.js
|   |-- validators
|   |   `-- clientIdentificationValidator.js
|   `-- utils
|       |-- phone.js
|       |-- profile.js
|       `-- routing.js
`-- tests
    |-- clientIdentificationService.test.js
    |-- phone.test.js
    `-- routing.test.js
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

- `PORT`: puerto local del servidor
- `GOOGLE_SHEETS_SPREADSHEET_ID`: ID del Google Sheet
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: email de la service account
- `GOOGLE_PRIVATE_KEY`: private key de la service account
- `CLIENTES_SHEET_NAME`: nombre de la hoja de clientes
- `AUTOMATION_LOG_SHEET_NAME`: nombre de la hoja de logs
- `CLIENT_REQUIRED_FIELDS`: columnas requeridas para considerar perfil completo
- `CLIENT_OPTIONAL_FIELDS`: columnas opcionales para distinguir COMPLETE vs PARTIAL

## Configuración de Google Sheets

- `GOOGLE_SHEETS_SPREADSHEET_ID`: es el identificador del archivo de Google Sheets. Se obtiene desde la URL del documento, en el tramo entre `/d/` y `/edit`.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: sale del JSON de la service account de Google Cloud, en la clave `client_email`.
- `GOOGLE_PRIVATE_KEY`: sale del mismo JSON, en la clave `private_key`. Debes pegarla dentro de comillas en el `.env` y conservar los saltos de línea como `\n`.

Ejemplo de formato correcto:

```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nLINEA_1\nLINEA_2\n-----END PRIVATE KEY-----\n"
```

- Comparte la hoja de cálculo con el `GOOGLE_SERVICE_ACCOUNT_EMAIL`, o Google devolverá error de permisos aunque las credenciales estén bien.
- Los nombres de pestañas esperados por defecto son exactamente `CLIENTES` y `AUTOMATION_LOG`.

Cómo debe quedar `GOOGLE_PRIVATE_KEY` en `.env`:

```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_LINEA_1\nTU_LINEA_2\n-----END PRIVATE KEY-----\n"
```

El código carga `dotenv`, limpia comillas externas y convierte `\n` en saltos reales de línea antes de crear el cliente JWT de Google.

## Formato esperado del webhook

`POST /api/webhooks/client-identification`

```json
{
  "phone_raw": "612 34 56 78",
  "display_name": "Maria",
  "message_text": "Hola quiero reservar",
  "timestamp": "2026-04-10T14:10:00Z",
  "source": "whatsapp"
}
```

## Respuesta JSON

```json
{
  "ok": true,
  "request_id": "uuid",
  "source": "whatsapp",
  "received_at": "2026-04-10T14:10:00.000Z",
  "phone_raw": "612 34 56 78",
  "phone_normalized": "+34612345678",
  "is_phone_valid": true,
  "client_status": "EXISTING",
  "profile_status": "PARTIAL",
  "next_route": "profile_completion",
  "matched_records": 1,
  "client_record": {
    "phone_normalized": "+34612345678",
    "display_name": "Maria"
  },
  "error_code": null,
  "error_message": null
}
```

## Requisitos para Google Sheets

La hoja `CLIENTES` debe tener una fila de encabezados e incluir al menos la columna `phone_normalized`.

La hoja `AUTOMATION_LOG` puede usar este orden recomendado:

1. `logged_at`
2. `request_id`
3. `source`
4. `phone_raw`
5. `phone_normalized`
6. `display_name`
7. `message_text`
8. `timestamp`
9. `client_status`
10. `profile_status`
11. `next_route`
12. `notes`

## Ejecutar localmente

```bash
npm install
npm run dev
```

Servidor local:

```text
http://localhost:3000
```

## Tests

```bash
npm test
```

## Prueba manual mínima de Google Sheets

Con el `.env` completo, ejecuta:

```bash
npm run check:sheets
```

Resultado esperado:

- `Google Sheets connection OK.`
- el título del spreadsheet
- la lista de pestañas disponibles
- confirmación de que existen `CLIENTES` y `AUTOMATION_LOG`

Si falla, el script mostrará un mensaje orientado a la causa más común:

- falta compartir la hoja con la service account
- `GOOGLE_SHEETS_SPREADSHEET_ID` incorrecto
- pestaña inexistente o con nombre distinto
- `GOOGLE_PRIVATE_KEY` mal pegada

## Validación de arranque

Cuando el servidor inicia:

- si faltan variables críticas, verás mensajes específicos para `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` y `GOOGLE_PRIVATE_KEY`
- si la private key está mal formateada, verás una advertencia específica
- si la configuración está completa, el servidor intentará validar:
  - autenticación con Google
  - acceso al spreadsheet
  - existencia de las pestañas `CLIENTES` y `AUTOMATION_LOG`

El endpoint `POST /api/webhooks/client-identification` no cambia.
