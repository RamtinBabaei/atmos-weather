import { z } from 'zod';
import { locationsSchema, weatherSchema } from './schema.ts';

export class WeatherServiceError extends Error {
  status: number;
  constructor(message: string, status = 502) { super(message); this.status = status; }
}
export type Fetcher = typeof fetch;
export async function fetchValidated<T>(url: string, schema: z.ZodType<T>, fetcher: Fetcher = fetch): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetcher(url, {signal: AbortSignal.timeout(8000), headers: {Accept:'application/json'}});
      if (!response.ok) {
        if ((response.status >= 500 || response.status === 429) && attempt === 0) continue;
        throw new WeatherServiceError(response.status === 429 ? 'The weather service is busy. Please try again shortly.' : 'The weather service is temporarily unavailable.', response.status === 429 ? 429 : 502);
      }
      const parsed = schema.safeParse(await response.json());
      if (!parsed.success) throw new WeatherServiceError('The weather service returned incomplete data. Please try again.');
      return parsed.data;
    } catch (error) {
      if (error instanceof WeatherServiceError) throw error;
      if (attempt === 1) throw new WeatherServiceError('Unable to reach the weather service. Please try again.', 503);
    }
  }
  throw new WeatherServiceError('Weather is temporarily unavailable.',503);
}
const coordinatesSchema = z.object({ latitude:z.coerce.number().finite().min(-90).max(90), longitude:z.coerce.number().finite().min(-180).max(180) });
export function forecastURL(latitude: string | null, longitude: string | null) {
  if(latitude === null || longitude === null || latitude.trim()==='' || longitude.trim()==='') throw new WeatherServiceError('A valid latitude and longitude are required.',400);
  const parsed = coordinatesSchema.safeParse({latitude,longitude});
  if(!parsed.success) throw new WeatherServiceError('A valid latitude and longitude are required.',400);
  const params = new URLSearchParams({
    latitude:parsed.data.latitude.toFixed(4),longitude:parsed.data.longitude.toFixed(4), timezone:'auto',forecast_days:'7',
    current:'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day',
    daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max',
    hourly:'temperature_2m,weather_code,precipitation_probability,is_day',
    temperature_unit:'celsius',wind_speed_unit:'kmh',precipitation_unit:'mm',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}
function errorResponse(error:unknown) {
  return Response.json({error:error instanceof WeatherServiceError ? error.message : 'Something went wrong. Please try again.'}, {status:error instanceof WeatherServiceError ? error.status : 500,headers:{'Cache-Control':'no-store'}});
}
export async function weatherResponse(request:Request, fetcher:Fetcher = fetch) {
  try {
    const params = new URL(request.url).searchParams;
    const url = forecastURL(params.get('latitude'),params.get('longitude'));
    const data = await fetchValidated(url, weatherSchema, fetcher);
    return Response.json(data,{headers:{'Cache-Control':'public, max-age=60, s-maxage=300'}});
  } catch(error) { return errorResponse(error); }
}
export async function searchResponse(request:Request, fetcher:Fetcher = fetch) {
  try {
    const query = (new URL(request.url).searchParams.get('q') ?? '').trim();
    if(query.length < 2 || query.length > 100) throw new WeatherServiceError('Enter a location between 2 and 100 characters.',400);
    const params = new URLSearchParams({name:query,count:'6',language:'en',format:'json'});
    const data = await fetchValidated(`https://geocoding-api.open-meteo.com/v1/search?${params}`, locationsSchema, fetcher);
    return Response.json({results:data.results ?? []},{headers:{'Cache-Control':'public, max-age=300, s-maxage=3600'}});
  } catch(error) { return errorResponse(error); }
}
