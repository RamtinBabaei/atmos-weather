import type { Weather, Units } from './schema.ts';
export function temperature(value: number | null | undefined, units: Units, symbol = true): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const converted = units.temperature === 'fahrenheit' ? value * 9 / 5 + 32 : value;
  return `${Math.round(converted) === 0 ? 0 : Math.round(converted)}${symbol ? '°' : ''}`;
}
export function wind(value: number | null | undefined, units: Units): string {
  return value == null ? '—' : `${Math.round(units.wind === 'mph' ? value / 1.609344 : value)} ${units.wind === 'mph' ? 'mph' : 'km/h'}`;
}
export function precipitation(value: number | null | undefined, units: Units): string {
  return value == null ? '—' : `${(units.precipitation === 'inch' ? value / 25.4 : value).toFixed(units.precipitation === 'inch' ? 2 : 1)} ${units.precipitation === 'inch' ? 'in' : 'mm'}`;
}
export function dateLabel(value: string, options: Intl.DateTimeFormatOptions = {weekday:'short'}) {
  // Forecast dates are location-local calendar dates, not UTC instants.
  return new Intl.DateTimeFormat('en-US', {...options, timeZone:'UTC'}).format(new Date(`${value.slice(0,10)}T12:00:00Z`));
}
export function hourLabel(value: string) {
  const hour = Number(value.slice(11,13));
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
}
export type Condition = 'sun' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm';
export function condition(code: number | null): {type: Condition; label:string} {
  if(code === 0) return {type:'sun',label:'Clear skies'};
  if(code === 1 || code === 2) return {type:'partly',label:code === 1 ? 'Mostly clear' : 'Partly cloudy'};
  if(code === 3) return {type:'cloud',label:'Overcast'};
  if(code === 45 || code === 48) return {type:'fog',label:'Foggy'};
  if(code != null && [71,73,75,77,85,86].includes(code)) return {type:'snow',label:'Snow'};
  if(code != null && [95,96,99].includes(code)) return {type:'storm',label:'Thunderstorms'};
  if(code != null && [51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return {type:'rain',label:code < 60 ? 'Drizzle' : 'Rain'};
  return {type:'cloud',label:'Conditions unavailable'};
}
export function hourlyIndices(weather: Weather, day: string) {
  return weather.hourly.time.map((time,index)=>({time,index})).filter(({time})=>time.slice(0,10)===day).map(({index})=>index);
}
