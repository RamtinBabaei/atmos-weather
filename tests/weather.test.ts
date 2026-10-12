import { test } from 'node:test';
import assert from 'node:assert/strict';
import { temperature, precipitation, wind, condition, dateLabel, hourLabel, hourlyIndices } from '../lib/weather/format.ts';
import { METRIC, IMPERIAL, weatherSchema } from '../lib/weather/schema.ts';
import { sampleWeather } from '../lib/weather/sample.ts';
import { forecastURL, weatherResponse, searchResponse, fetchValidated } from '../lib/weather/service.ts';
import type { Fetcher } from '../lib/weather/service.ts';
import { z } from 'zod';
const fixture=sampleWeather();
const mock=(body:unknown,status=200):Fetcher => async()=>Response.json(body,{status});
test('temperature conversion is accurate and unavailable values stay unavailable',()=>{
  assert.equal(temperature(0,METRIC),'0°');assert.equal(temperature(0,IMPERIAL),'32°');
  assert.equal(temperature(-40,IMPERIAL),'-40°');assert.equal(temperature(20,IMPERIAL),'68°');
  assert.equal(temperature(-0.1,METRIC),'0°');assert.equal(temperature(null,METRIC),'—');
});
test('wind and precipitation conversions preserve units and precision',()=>{
  assert.equal(wind(16.09344,IMPERIAL),'10 mph');assert.equal(wind(16,METRIC),'16 km/h');
  assert.equal(precipitation(25.4,IMPERIAL),'1.00 in');assert.equal(precipitation(0,METRIC),'0.0 mm');
  assert.equal(wind(null,METRIC),'—');assert.equal(precipitation(null,IMPERIAL),'—');
});
test('hour labels handle midnight, noon and late evening',()=>{
  assert.equal(hourLabel('2026-10-12T00:00'),'12 AM');assert.equal(hourLabel('2026-10-12T12:00'),'12 PM');assert.equal(hourLabel('2026-10-12T23:00'),'11 PM');
});
test('calendar date labels do not shift with the host timezone',()=>{
  assert.equal(dateLabel('2026-10-12',{weekday:'long'}),'Monday');
  assert.equal(dateLabel('2026-10-12T00:00',{month:'short',day:'numeric'}),'Oct 12');
});
test('hourly selection isolates a full day and supports the last forecast day',()=>{
  const indices=hourlyIndices(fixture,fixture.daily.time[6]);assert.equal(indices.length,24);
  assert.equal(indices[0],144);assert.equal(indices.at(-1),167);
  assert.deepEqual(hourlyIndices(fixture,'1900-01-01'),[]);
});
test('all documented WMO groups have appropriate conditions',()=>{
  assert.equal(condition(0).type,'sun');assert.equal(condition(2).type,'partly');assert.equal(condition(3).type,'cloud');
  assert.equal(condition(48).type,'fog');assert.equal(condition(57).type,'rain');assert.equal(condition(67).type,'rain');
  assert.equal(condition(82).type,'rain');assert.equal(condition(86).type,'snow');assert.equal(condition(96).type,'storm');
  assert.equal(condition(null).label,'Conditions unavailable');
});
test('forecast URL accepts equator and negative coordinates and enforces canonical units',()=>{
  const u=new URL(forecastURL('0','-74.006'));assert.equal(u.searchParams.get('latitude'),'0.0000');
  assert.equal(u.searchParams.get('timezone'),'auto');assert.equal(u.searchParams.get('forecast_days'),'7');
  assert.equal(u.searchParams.get('temperature_unit'),'celsius');
});
test('invalid or missing coordinates never reach the upstream API',async()=>{
  for(const params of ['', '?latitude=&longitude=0','?latitude=91&longitude=0','?latitude=0&longitude=181','?latitude=abc&longitude=0']) {
    let calls=0;const response=await weatherResponse(new Request(`https://example.com/api/weather${params}`),async()=>{calls++;return Response.json(fixture);});
    assert.equal(response.status,400);assert.equal(calls,0);
  }
});
test('valid weather is returned with caching headers',async()=>{
  const response=await weatherResponse(new Request('https://example.com/api/weather?latitude=52.52&longitude=13.41'),mock(fixture));
  assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control')! ,/s-maxage=300/);
  assert.deepEqual(await response.json(),fixture);
});
test('schema rejects incomplete arrays and invalid timezones',()=>{
  assert.equal(weatherSchema.safeParse({...fixture, daily:{...fixture.daily,weather_code:[0]}}).success,false);
  assert.equal(weatherSchema.safeParse({...fixture, hourly:{...fixture.hourly,temperature_2m:[]}}).success,false);
  assert.equal(weatherSchema.safeParse({...fixture,timezone:'not/a/timezone'}).success,false);
});
test('invalid upstream weather becomes a safe, uncached error',async()=>{
  const r=await weatherResponse(new Request('https://example.com/api/weather?latitude=0&longitude=0'),mock({secret:'internal'}));
  assert.equal(r.status,502);assert.equal(r.headers.get('Cache-Control'),'no-store');
  assert.match(z.object({error:z.string()}).parse(await r.json()).error,/incomplete/);
});
test('temporary upstream failures retry once and recover',async()=>{
  let calls=0;const response=await weatherResponse(new Request('https://example.com/api/weather?latitude=0&longitude=0'),async()=>{calls++;return calls===1?new Response('',{status:503}):Response.json(fixture);});
  assert.equal(calls,2);assert.equal(response.status,200);
});
test('network failures retry once and return a helpful 503',async()=>{
  let calls=0;const r=await weatherResponse(new Request('https://example.com/api/weather?latitude=0&longitude=0'),async()=>{calls++;throw new TypeError('Failed to fetch');});
  assert.equal(calls,2);assert.equal(r.status,503);assert.match(z.object({error:z.string()}).parse(await r.json()).error,/reach/);
});
test('rate limiting is surfaced without pretending data is available',async()=>{
  const r=await weatherResponse(new Request('https://example.com/api/weather?latitude=0&longitude=0'),mock({},429));
  assert.equal(r.status,429);assert.match(z.object({error:z.string()}).parse(await r.json()).error,/busy/);
});
test('search requires a meaningful bounded query',async()=>{
  for(const q of ['','a',' '.repeat(3),'x'.repeat(101)]) {
    const r=await searchResponse(new Request(`https://example.com/api/search?q=${encodeURIComponent(q)}`),mock({}));
    assert.equal(r.status,400);
  }
});
test('search accepts multilingual input and distinguishes cities by coordinates',async()=>{
  let seen='';const matches=[{name:'تهران',country:'Iran',latitude:35.7,longitude:51.4},{name:'Paris',country:'France',latitude:48.8,longitude:2.3}];
  const r=await searchResponse(new Request('https://example.com/api/search?q=%D8%AA%D9%87%D8%B1%D8%A7%D9%86'),async input=>{seen=String(input);return Response.json({results:matches});});
  assert.equal(r.status,200);assert.equal(new URL(seen).searchParams.get('name'),'تهران');assert.deepEqual(z.object({results:z.array(z.unknown())}).parse(await r.json()).results,matches);
});
test('no matches is an empty list rather than a runtime error',async()=>{
  const r=await searchResponse(new Request('https://example.com/api/search?q=zzzzzz'),mock({}));
  assert.equal(r.status,200);assert.deepEqual(await r.json(),{results:[]});
});
test('invalid location data is rejected',async()=>{
  const r=await searchResponse(new Request('https://example.com/api/search?q=Paris'),mock({results:[{name:'Paris',latitude:999,longitude:0}]}));
  assert.equal(r.status,502);
});
test('invalid JSON retries and reports connection failure',async()=>{
  let calls=0;await assert.rejects(()=>fetchValidated('https://example.com',z.object({}),async()=>{calls++;return new Response('<html>Unavailable</html>');}),/reach/);assert.equal(calls,2);
});
test('nullable measurements are valid and do not break forecasting',()=>{
  const partial={...fixture,current:{...fixture.current,temperature_2m:null,precipitation:null}};
  assert.equal(weatherSchema.safeParse(partial).success,true);
});
