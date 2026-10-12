import type { Weather } from './schema.ts';
// Deliberately opt-in example data, never presented as a live forecast.
export function sampleWeather(): Weather {
  const base = new Date().toISOString().slice(0,10);
  const dates = Array.from({length:7},(_,i)=>new Date(new Date(`${base}T12:00:00Z`).getTime()+i*86400000).toISOString().slice(0,10));
  const codes = [2,3,61,80,2,0,1];
  const times = dates.flatMap(day=>Array.from({length:24},(_,h)=>`${day}T${String(h).padStart(2,'0')}:00`));
  return {
    timezone:'Europe/Berlin', current:{time:`${base}T14:00`,temperature_2m:20,apparent_temperature:18,relative_humidity_2m:64,precipitation:0,weather_code:2,wind_speed_10m:14,is_day:1},
    daily:{time:dates,weather_code:codes,temperature_2m_max:[22,21,19,18,20,23,24],temperature_2m_min:[14,13,12,12,14,15,16],precipitation_probability_max:[10,20,85,65,15,0,5],sunrise:dates.map(d=>`${d}T07:18`),sunset:dates.map(d=>`${d}T18:24`),uv_index_max:[3,2,1,2,3,4,4]},
    hourly:{time:times,temperature_2m:times.map((_,i)=>Math.round(17+4*Math.sin((i%24-7)/24*Math.PI*2))),weather_code:times.map((_,i)=>codes[Math.floor(i/24)]),precipitation_probability:times.map((_,i)=>codes[Math.floor(i/24)]===61?80:10),is_day:times.map((_,i)=>i%24>=7 && i%24<19?1:0)},
  };
}
