# API Contract: OpenSky Proxy Edge Function

**Feature**: 001-flight-anomaly-radar
**Date**: 2026-03-11

## Endpoint

```
GET /functions/v1/opensky-proxy?region={REGION_KEY}
```

**Host**: `https://<project-ref>.supabase.co`
**Auth**: Supabase anon key via `Authorization: Bearer <SUPABASE_ANON_KEY>` header or `apikey` query param.

## Request

### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| region | string | No | EUROPE | Region key from predefined set: `MOROCCO`, `EUROPE`, `NORTH_AMERICA`, `GERMANY`, `GLOBAL` |

### Example Request

```
GET /functions/v1/opensky-proxy?region=EUROPE
Authorization: Bearer eyJhbGc...
```

## Response

### Success (200 OK)

```json
{
  "time": 1741737600,
  "aircraft": [
    {
      "id": "3c6444",
      "callsign": "DLH1234",
      "country": "Germany",
      "lat": 50.0379,
      "lng": 8.5622,
      "altitude": 35000,
      "speed": 452,
      "heading": 270,
      "verticalRate": -200,
      "squawk": "1000",
      "onGround": false,
      "spi": false,
      "source": "ADSB",
      "lastSeen": 1741737595
    }
  ],
  "meta": {
    "region": "EUROPE",
    "count": 3482,
    "cached": false,
    "creditWarning": false
  }
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| time | number | OpenSky server timestamp (Unix epoch) |
| aircraft | Aircraft[] | Array of transformed aircraft objects (see data-model.md) |
| meta.region | string | Requested region key |
| meta.count | number | Number of aircraft in response |
| meta.cached | boolean | Whether response was served from cache |
| meta.creditWarning | boolean | True when daily credits are running low (<500 remaining) |

### Error Responses

| Status | Body | Condition |
|---|---|---|
| 400 | `{ "error": "Invalid region", "valid": ["MOROCCO", ...] }` | Unknown region key |
| 429 | `{ "error": "Rate limit exceeded", "retryAfter": 60 }` | OpenSky daily credits exhausted |
| 502 | `{ "error": "Upstream unavailable" }` | OpenSky API unreachable |
| 500 | `{ "error": "Internal error", "message": "..." }` | Unexpected server error |

## Caching Behavior

- Responses are cached in-memory per region key with a 15-second TTL.
- Cached responses include `meta.cached: true`.
- Cache is cleared on function cold start.

## CORS Headers

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, apikey
```
