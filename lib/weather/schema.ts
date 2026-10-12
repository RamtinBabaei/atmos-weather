import { z } from 'zod';

const measurement = z.number().finite().nullable();
const localTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const locationSchema = z.object({
  id: z.number().optional(), name: z.string().min(1).max(150),
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
  country: z.string().optional(), country_code: z.string().optional(),
  admin1: z.string().optional(), timezone: z.string().optional(),
});
export const locationsSchema = z.object({ results: z.array(locationSchema).optional() });
export const weatherSchema = z.object({
  timezone: z.string().refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }),
  current: z.object({ time: localTime, temperature_2m: measurement, apparent_temperature: measurement,
    relative_humidity_2m: measurement, precipitation: measurement, weather_code: measurement,
    wind_speed_10m: measurement, is_day: z.number() }),
  daily: z.object({ time: z.array(date).min(7), weather_code: z.array(measurement),
    temperature_2m_max: z.array(measurement), temperature_2m_min: z.array(measurement),
    precipitation_probability_max: z.array(measurement), sunrise: z.array(localTime), sunset: z.array(localTime),
    uv_index_max: z.array(measurement),
  }).refine(d => Object.values(d).every(a => a.length === d.time.length), 'Daily arrays must have matching lengths'),
  hourly: z.object({ time: z.array(localTime).min(24), temperature_2m: z.array(measurement),
    weather_code: z.array(measurement), precipitation_probability: z.array(measurement), is_day: z.array(z.number()),
  }).refine(h => Object.values(h).every(a => a.length === h.time.length), 'Hourly arrays must have matching lengths'),
});
export type Location = z.infer<typeof locationSchema>;
export type Weather = z.infer<typeof weatherSchema>;
export type Units = { temperature: 'celsius' | 'fahrenheit'; wind: 'kmh' | 'mph'; precipitation: 'mm' | 'inch' };
export const METRIC: Units = { temperature: 'celsius', wind: 'kmh', precipitation: 'mm' };
export const IMPERIAL: Units = { temperature: 'fahrenheit', wind: 'mph', precipitation: 'inch' };
export const unitsSchema = z.object({ temperature: z.enum(['celsius','fahrenheit']), wind: z.enum(['kmh','mph']), precipitation: z.enum(['mm','inch']) });
export const DEFAULT_LOCATION: Location = { id: 2950159, name: 'Berlin', country: 'Germany', country_code: 'DE', latitude: 52.52, longitude: 13.41, timezone: 'Europe/Berlin' };
export const QUICK_LOCATIONS: Location[] = [DEFAULT_LOCATION,
  {name:'London', country:'United Kingdom', latitude:51.5074, longitude:-0.1278},
  {name:'New York', country:'United States', latitude:40.7128, longitude:-74.006},
  {name:'Tokyo', country:'Japan', latitude:35.6762, longitude:139.6503},
  {name:'Tehran', country:'Iran', latitude:35.6892, longitude:51.389},
];

export function apiErrorMessage(value: unknown, fallback: string): string {
  const parsed = z.object({error:z.string().max(500)}).safeParse(value);
  return parsed.success ? parsed.data.error : fallback;
}
