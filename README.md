# Atmos Weather

A responsive solution to built with React 19, TypeScript, Tailwind CSS 4, and Open-Meteo.

## 🌤️ Live Demo

[Open Atmos Weather →](https://atmos-weather.ramtinbabaei-portfolio.workers.dev/)

## Preview

[![Atmos Weather preview](docs/preview.png)](https://atmos-weather.ramtinbabaei-portfolio.workers.dev/)


## Features

- Global city search with debounced requests, keyboard navigation, and country/region disambiguation.
- Current temperature, feels like, humidity, wind and precipitation.
- Seven-day forecast; select any day to see all its hourly temperatures.
- Independent Celsius/Fahrenheit, km/h/mph, and mm/in preferences, plus metric/imperial presets.
- Sunrise and sunset in the selected city's local time.
- Light/dark themes and up to eight saved places, persisted in browser storage.
- Optional geolocation with clear handling of denied permission and unavailable positioning.
- Loading skeletons, retryable failures, empty search states, request cancellation and timeouts.
- Clearly labeled, opt-in sample forecast for exploring the app when the provider is unavailable.
- Accessible focus styles, native dialog focus trapping, reduced motion support, and responsive layouts.

## Stack and architecture

React components provide the UI; Tailwind utilities and a shared CSS token layer handle layout and themes. Next.js-compatible App Router routes run through Vinext and Vite on Cloudflare Workers. Zod validates all external data and persisted user preferences. The framework adapter is a beta dependency supplied by the hosting environment; the forecast domain modules are independent of it.

`app/api/search` and `app/api/weather` proxy fixed Open-Meteo endpoints with bounded inputs, an 8-second upstream timeout, one retry for transient failures and HTTP caching. All data is requested in canonical metric units. The UI performs conversions without extra network calls. Location-local dates are formatted without applying the browser timezone.

```
app/                    Pages, metadata, API routes and theme styles
components/weather/     Search, unit dialog, SVG weather icons and dashboard
hooks/use-weather.ts    Cancellable forecast lifecycle
lib/weather/            Schemas, API service, formatters and opt-in example data
tests/weather.test.ts   Domain and API boundary regression tests
```

## Run locally

Requires Node.js 22.13+ and pnpm 11.

```bash
pnpm install
pnpm dev
```

Open the address printed by the development command. No API key is required for Open-Meteo's noncommercial endpoint. This repository includes the Sites deployment configuration; private hosted access and API routes run together.

## Validate and build

```bash
pnpm typecheck
pnpm test
pnpm build
```

Tests cover conversions, midnight/noon, local dates, hourly day selection, WMO conditions, validation, multilingual search, empty results, malformed JSON, upstream failures, retries, rate limits and null measurements.

## Configuration and limitations

- Open-Meteo requires a commercial plan for commercial use; review its current terms before production commercial deployment.
- Preferences and saved places are local to this browser. No user account or cross-device sync is implied.
- Geolocation requires HTTPS and user permission. Coordinates are sent to Open-Meteo to retrieve the forecast.
- Weather forecasts depend on upstream availability and are not severe-weather alerts.
- Example data is synthetic and appears only after explicitly choosing “Explore sample forecast.” It never replaces live data silently.

## Credits

Weather data: [Open-Meteo](https://open-meteo.com/). Location data: [GeoNames](https://www.geonames.org/), via Open-Meteo. Challenge: Frontend Mentor. Interface icons: Lucide. Weather illustrations are SVG assets created for this implementation.
