'use client';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, Bookmark, CalendarDays, Check, ChevronLeft, ChevronRight, Compass, Droplets, LocateFixed, MapPin, Moon, RefreshCw, Star, Sun, Sunrise, Sunset, Thermometer, Wind, CloudOff, X, LoaderCircle } from 'lucide-react';
import { DEFAULT_LOCATION, METRIC, locationSchema, unitsSchema, type Location, type Units, type Weather } from '@/lib/weather/schema';
import { condition, dateLabel, hourLabel, hourlyIndices, precipitation, temperature, wind } from '@/lib/weather/format';
import { useWeather } from '@/hooks/use-weather';
import { WeatherIcon } from './WeatherIcon';
import { LocationSearch } from './LocationSearch';
import { UnitDialog } from './UnitDialog';

function readStorage(key:string):unknown {try {return JSON.parse(localStorage.getItem(key)??'null');} catch {return null;}}
function persist(key:string,value:unknown) {try {localStorage.setItem(key,JSON.stringify(value));} catch {/* Weather remains usable when browser storage is blocked. */}}
function samePlace(a:Location,b:Location) {return a.latitude===b.latitude && a.longitude===b.longitude;}
export default function WeatherDashboard() {
  const [location,setLocation]=useState<Location>(DEFAULT_LOCATION);
  const [units,setUnits]=useState<Units>(METRIC);
  const [favorites,setFavorites]=useState<Location[]>([]);
  const [savedView,setSavedView]=useState(false);
  const [theme,setTheme]=useState<'dark'|'light'>('dark');
  const [refresh,setRefresh]=useState(0);
  const [sample,setSample]=useState(false);
  const [day,setDay]=useState('');
  const [hourPage,setHourPage]=useState(0);
  const [message,setMessage]=useState('');
  const [locating,setLocating]=useState(false);
  const [hydrated,setHydrated]=useState(false);
  const {data,loading,error}=useWeather(location,refresh,sample);
  useEffect(()=>{
    const storedUnits=unitsSchema.safeParse(readStorage('atmos.units'));
    if(storedUnits.success) setUnits(storedUnits.data);
    const storedLocation=locationSchema.safeParse(readStorage('atmos.location'));
    if(storedLocation.success) setLocation(storedLocation.data);
    const storedFavorites=locationSchema.array().max(8).safeParse(readStorage('atmos.favorites'));
    if(storedFavorites.success) setFavorites(storedFavorites.data);
    const storedTheme=readStorage('atmos.theme');
    if(storedTheme==='light') setTheme('light');
    setHydrated(true);
  },[]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;if(hydrated) persist('atmos.theme',theme);},[theme,hydrated]);
  useEffect(()=>{if(hydrated){persist('atmos.units',units);persist('atmos.location',location);persist('atmos.favorites',favorites);}},[units,location,favorites,hydrated]);
  useEffect(()=>{if(data) {setDay(data.daily.time[0]);setHourPage(Math.min(Math.floor(Number(data.current.time.slice(11,13))/8),2));}},[data]);
  useEffect(()=>{if(!message) return;const timer=setTimeout(()=>setMessage(''),4500);return ()=>clearTimeout(timer);},[message]);
  const saved=favorites.some(place=>samePlace(place,location));
  function selectLocation(place:Location) {setLocation(place);setSample(false);setSavedView(false);setDay('');setHourPage(0);}
  function toggleSave() {
    if(saved) {setFavorites(favorites.filter(place=>!samePlace(place,location)));setMessage('Location removed from your saved places.');}
    else if(favorites.length>=8) setMessage('You can save up to 8 places. Remove one to add another.');
    else {setFavorites([...favorites,location]);setMessage(`${location.name} saved for next time.`);}
  }
  function locate() {
    if(!navigator.geolocation) {setMessage('Your browser does not support location access. Search for your city instead.');return;}
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position=>{
      selectLocation({name:'Your location',country:`${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°`,latitude:position.coords.latitude,longitude:position.coords.longitude});
      setLocating(false);
    },e=>{setLocating(false);setMessage(e.code===1?'Location access was declined. You can search for a city instead.':'We could not find your location. Try searching for a city.');},{timeout:10000,maximumAge:300000});
  }
  function showSample() {setLocation(DEFAULT_LOCATION);setSample(true);setSavedView(false);}
  const selectedDay=day || data?.daily.time[0] || '';
  const allHours=data?hourlyIndices(data,selectedDay):[];
  const pages=Math.max(1,Math.ceil(allHours.length/8));
  const page=Math.min(hourPage,pages-1);
  const hours=allHours.slice(page*8,page*8+8);
  return <div className="app-shell">
    <a className="skip-link" href="#forecast">Skip to forecast</a>
    <header className="site-header">
      <a href="/" className="brand" aria-label="Atmos home"><div className="brand-icon"><WeatherIcon code={2} size={42} decorative/></div><span>atmos<span className="brand-dot">.</span></span></a>
      <nav className="header-nav" aria-label="Main navigation"><button className={!savedView?'active':''} aria-current={!savedView?'page':undefined} onClick={()=>setSavedView(false)}>Forecast</button><button className={savedView?'active':''} aria-current={savedView?'page':undefined} onClick={()=>setSavedView(true)}>Saved places {favorites.length>0&&<span>{favorites.length}</span>}</button></nav>
      <div className="header-actions"><button className="icon-button theme-toggle" title={`Switch to ${theme==='dark'?'light':'dark'} theme`} aria-label={`Switch to ${theme==='dark'?'light':'dark'} theme`} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button><UnitDialog units={units} onChange={setUnits}/></div>
    </header>
    <main id="forecast" className="main-container">
      <section className="intro"><span className="eyebrow"><span/> A LITTLE CLARITY FOR YOUR EVERYDAY</span><h1>How’s the sky looking?</h1><p>Big plans or slow mornings. Start with the weather.</p><LocationSearch onSelect={selectLocation}/><button className="location-button" onClick={locate} disabled={locating}>{locating?<LoaderCircle size={14} className="spin"/>:<LocateFixed size={14}/>} {locating?'Finding your location…':'Use my location'}</button></section>
      {savedView?<section className="saved-section"><div className="section-heading"><h2><Bookmark size={18}/> Your saved places</h2><span className="muted text-sm">{favorites.length} / 8 places</span></div>{favorites.length===0?<div className="empty-state"><div className="empty-icon"><Star size={30}/></div><h3>A world of familiar places</h3><p>Save a city with the star on its forecast.<br/>It’ll be waiting here the next time you visit.</p><button className="primary-button" onClick={()=>setSavedView(false)}>Explore the forecast <ArrowUpRight size={16}/></button></div>:<div className="saved-grid">{favorites.map(place=><article className="saved-card" key={`${place.latitude}-${place.longitude}`}><MapPin size={24}/><h3>{place.name}</h3><p>{place.country??'Saved location'}</p><div className="flex justify-between mt-5 gap-3"><button className="text-button" onClick={()=>selectLocation(place)}>View forecast <ArrowUpRight size={16}/></button><button className="icon-button" aria-label={`Remove ${place.name} from saved places`} onClick={()=>{setFavorites(favorites.filter(p=>!samePlace(p,place)));setMessage(`${place.name} removed.`);}}><X size={16}/></button></div></article>)}</div>}</section>:<>
        <div className="forecast-toolbar"><div className="flex items-center gap-2"><span className={`status-dot ${sample?'sample':''}`}/><span>{sample?'Sample forecast':'Your local forecast'}</span>{data&&!sample&&<span className="update-label">Updated {hourLabel(data.current.time)} · local time</span>}</div><button className="text-button" onClick={()=>{setSample(false);setRefresh(n=>n+1);}} disabled={loading}><RefreshCw size={14} className={loading?'spin':''}/>Refresh</button></div>
        {sample&&<div className="sample-banner"><span><Compass size={16}/> You’re exploring example data for Berlin. This is not live weather.</span><button onClick={()=>{setSample(false);setRefresh(n=>n+1);}}>Go live <ArrowUpRight size={14}/></button></div>}
        {loading?<ForecastSkeleton location={location}/>:error?<div className="empty-state error-state" role="alert"><div className="empty-icon"><CloudOff size={32}/></div><h2>A cloudy connection</h2><p>{error}</p><div className="flex flex-wrap justify-center gap-3"><button className="primary-button" onClick={()=>setRefresh(n=>n+1)}><RefreshCw size={16}/> Try again</button><button className="secondary-button" onClick={showSample}>Explore sample forecast</button></div></div>:data&&<div className="dashboard-grid">
          <div className="forecast-left">
            <CurrentWeather data={data} location={location} units={units} saved={saved} onSave={toggleSave}/>
            <div className="metrics-grid">
              <Metric icon={<Thermometer size={18}/>} label="Feels like" value={`${temperature(data.current.apparent_temperature,units)}${units.temperature==='celsius'?'C':'F'}`} description="How it feels outside"/>
              <Metric icon={<Droplets size={18}/>} label="Humidity" value={data.current.relative_humidity_2m==null?'—':`${Math.round(data.current.relative_humidity_2m)}%`} description="Moisture in the air"/>
              <Metric icon={<Wind size={18}/>} label="Wind" value={wind(data.current.wind_speed_10m,units)} description="A little movement"/>
              <Metric icon={<CloudRainSmall/>} label="Precipitation" value={precipitation(data.current.precipitation,units)} description="Current rainfall"/>
            </div>
            <section className="daily-section"><div className="section-heading"><h2><CalendarDays size={17}/> The week ahead</h2><span className="muted text-xs">7-day forecast</span></div><div className="daily-grid">{data.daily.time.slice(0,7).map((date,i)=><button className={`daily-card ${selectedDay===date?'selected':''}`} key={date} aria-pressed={selectedDay===date} aria-label={`${dateLabel(date,{weekday:'long',month:'short',day:'numeric'})}: ${condition(data.daily.weather_code[i]).label}, high ${temperature(data.daily.temperature_2m_max[i],units)}, low ${temperature(data.daily.temperature_2m_min[i],units)}. View hourly forecast.`} onClick={()=>{setDay(date);setHourPage(0);}}><span className="day-name">{i===0?'Today':dateLabel(date)}</span><span className="day-date">{dateLabel(date,{month:'short',day:'numeric'})}</span><WeatherIcon code={data.daily.weather_code[i]} size={47} decorative/><span className="daily-temps"><strong>{temperature(data.daily.temperature_2m_max[i],units)}</strong><span>{temperature(data.daily.temperature_2m_min[i],units)}</span></span><span className="rain-chance"><Droplets size={10}/>{data.daily.precipitation_probability_max[i]??'—'}%</span></button>)}</div><p className="daily-hint">Choose a day to explore its hourly forecast.</p></section>
            <section className="sun-card"><div className="sun-info"><Sunrise size={25}/><div><span>Sunrise</span><strong>{hourLabel(data.daily.sunrise[0])}</strong></div></div><div className="sun-arc" aria-hidden="true"><div/><Sun size={20}/><span>Make the most of daylight</span></div><div className="sun-info"><Sunset size={25}/><div><span>Sunset</span><strong>{hourLabel(data.daily.sunset[0])}</strong></div></div></section>
          </div>
          <section className="hourly-panel"><div className="hourly-heading"><h2>Hour by hour</h2><span className="muted text-xs">{units.temperature==='celsius'?'°C':'°F'}</span></div><label className="day-selector"><CalendarDays size={15}/><select aria-label="Hourly forecast day" value={selectedDay} onChange={e=>{setDay(e.target.value);setHourPage(0);}}>{data.daily.time.slice(0,7).map((date,i)=><option value={date} key={date}>{i===0?'Today':dateLabel(date,{weekday:'long'})}, {dateLabel(date,{month:'short',day:'numeric'})}</option>)}</select></label><div className="hourly-column-labels"><span>LOCAL TIME</span><span>TEMP.</span></div><div className="hourly-list" aria-live="polite">{hours.map(index=><div className="hourly-row" key={data.hourly.time[index]}><WeatherIcon code={data.hourly.weather_code[index]} day={Boolean(data.hourly.is_day[index])} size={39} decorative/><div><strong>{hourLabel(data.hourly.time[index])}</strong><span>{condition(data.hourly.weather_code[index]).label}</span></div><strong className="hourly-temperature">{temperature(data.hourly.temperature_2m[index],units)}</strong></div>)}</div><div className="hourly-pagination"><button className="icon-button" aria-label="Previous hours" disabled={page===0} onClick={()=>setHourPage(n=>Math.max(0,n-1))}><ChevronLeft size={18}/></button><span>{hourLabel(data.hourly.time[hours[0]]??`${selectedDay}T00:00`)} – {hourLabel(data.hourly.time[hours.at(-1)??0]??`${selectedDay}T00:00`)}</span><button className="icon-button" aria-label="Next hours" disabled={page===pages-1} onClick={()=>setHourPage(n=>Math.min(pages-1,n+1))}><ChevronRight size={18}/></button></div><div className="hourly-note"><span className="status-dot"/> Forecasts follow {location.name}’s local time.</div></section>
        </div>}
      </>}
      <div className="bottom-note"><Compass size={17}/><p>A world of weather. One clear view.</p></div>
    </main>
    <footer className="site-footer"><span>Designed for the everyday.</span><span>Weather by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo <ArrowUpRight size={11}/></a> <span className="footer-separator">/</span> <a href="https://www.frontendmentor.io/challenges/weather-app-K1FhddVm49" target="_blank" rel="noreferrer">Frontend Mentor</a></span></footer>
    {message&&<div className="toast" role="status"><Check size={17}/><span>{message}</span><button aria-label="Dismiss notification" onClick={()=>setMessage('')}><X size={15}/></button></div>}
  </div>;
}
function CurrentWeather({data,location,units,saved,onSave}:{data:Weather;location:Location;units:Units;saved:boolean;onSave:()=>void}) {
  const c=data.current;
  const description=condition(c.weather_code).label;
  return <section className="current-card" aria-label="Current weather"><div className="sky-orbit orbit-one"/><div className="sky-orbit orbit-two"/><div className="sky-dot dot-one"/><div className="sky-dot dot-two"/><div className="sky-dot dot-three"/><div className="current-top"><span className="current-tag"><span/> RIGHT NOW</span><button className={`save-button ${saved?'saved':''}`} aria-pressed={saved} aria-label={`${saved?'Unsave':'Save'} ${location.name}`} onClick={onSave}><Star size={18} fill={saved?'currentColor':'none'}/></button></div><div className="current-content"><div className="current-place"><div className="current-location"><MapPin size={16}/><span>{location.country??'Your selected place'}</span></div><h2>{location.name}</h2><p>{dateLabel(c.time,{weekday:'long',month:'long',day:'numeric'})}</p><span className="condition-pill">{description}</span></div><div className="current-temperature"><WeatherIcon code={c.weather_code} day={Boolean(c.is_day)} size={105} decorative/><span>{temperature(c.temperature_2m,units)}<small>{units.temperature==='celsius'?'C':'F'}</small></span></div></div><div className="current-bottom"><span>A fresh perspective on your day.</span><div><ArrowUp size={13}/> {temperature(data.daily.temperature_2m_max[0],units)} <span className="temp-separator"/> <ArrowDown size={13}/> {temperature(data.daily.temperature_2m_min[0],units)}</div></div></section>;
}
function Metric({icon,label,value,description}:{icon:React.ReactNode;label:string;value:string;description:string}) {
  return <article className="metric-card"><div className="metric-label">{icon}<span>{label}</span></div><p className="metric-value">{value}</p><p className="metric-description">{description}</p></article>;
}
function CloudRainSmall() {return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 15a4 4 0 1 1 0-8 6 6 0 0 1 11-1 4.5 4.5 0 0 1 1 9M8 18l-1 3m6-3-1 3m6-3-1 3"/></svg>;}
function ForecastSkeleton({location}:{location:Location}) {
  return <div className="dashboard-grid" role="status" aria-label={`Loading forecast for ${location.name}`}><div className="forecast-left"><div className="current-card skeleton-current"><div className="current-tag"><LoaderCircle size={14} className="spin"/> FINDING YOUR FORECAST</div><h2>{location.name}</h2><div className="skeleton-bar w-1/2 h-5"/><div className="skeleton-bar w-1/3 h-12 mt-6"/></div><div className="metrics-grid">{[0,1,2,3].map(i=><div className="metric-card" key={i}><div className="skeleton-bar h-3 w-3/4"/><div className="skeleton-bar h-8 w-1/2 mt-6"/><div className="skeleton-bar h-2 w-full mt-3"/></div>)}</div><div className="section-heading"><h2><CalendarDays size={17}/> The week ahead</h2></div><div className="daily-grid">{[0,1,2,3,4,5,6].map(i=><div className="daily-card skeleton-day" key={i}><div className="skeleton-bar h-3 w-3/4"/><div className="skeleton-bar h-10 w-10 mt-5"/><div className="skeleton-bar h-3 w-full mt-5"/></div>)}</div></div><div className="hourly-panel"><h2>Hour by hour</h2><div className="skeleton-bar h-10 w-full my-5"/>{[0,1,2,3,4,5,6,7].map(i=><div className="skeleton-bar h-12 w-full mb-3" key={i}/>)}</div></div>;
}
