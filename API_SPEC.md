# API Specifications - Aleocrophic Premium Payments

## Base URL
`/api/premium/`

## Endpoints

### 1. Check License Status
**URL:** `/check-status` or `/api/premium/check-status.php`
**Method:** `GET` | `POST`
**Parameters:**
- `email` (string, required): The email address used for the transaction.

**Response (Success):**
```json
{
  "status": "success",
  "data": {
    "supporter_name": "...",
    "tier": "ULTIMATE",
    "license_key": "ACRO-ULT-...",
    "created_at": "..."
  },
  "history": [...]
}
```

**Response (Auto-Approved Success):**
```json
{
  "status": "success",
  "message": "License automatically generated for your account.",
  "data": { ... }
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Error description"
}
```

### 2. Trakteer Webhook
**URL:** `/webhook` or `/api/premium/webhook.php`
**Method:** `POST`
**Headers:**
- `X-Trakteer-Hash`: Signature for verification.

**Response:**
```json
{
  "status": "success",
  "message": "License generated successfully",
  "data": {
    "tier": "...",
    "license_key": "..."
  }
}
```

## System Architecture
- **Environment Management**: Moved database and token configuration to a `.env` file at the root.
- **Directory Structure**: Renamed directory to `api/premium` to ensure URL compatibility and resolve 404 errors.
- **Auto-Approval System**: Introduced a validation mechanism in `config.php` that allows specific emails or domains to be automatically granted licenses upon checking status.
- **Error Handling**: Implemented centralized logging and standardized JSON error responses.

