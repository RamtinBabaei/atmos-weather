'use client';
import { useId } from 'react';
import { condition } from '@/lib/weather/format';
export function WeatherIcon({code,day=true,size=64,decorative=false}:{code:number|null;day?:boolean;size?:number;decorative?:boolean}) {
  const id=useId().replace(/:/g,'');
  const {type,label}=condition(code);
  const cloudy=type!=='sun';
  return <svg width={size} height={size} viewBox="0 0 100 100" className={`weather-icon weather-${type}`} aria-hidden={decorative || undefined} role={decorative?'presentation':'img'} aria-label={decorative?undefined:!day&&type==='sun'?'Clear night':label}>
    <defs><linearGradient id={`${id}-sun`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe294"/><stop offset="1" stopColor="#ffa44f"/></linearGradient><linearGradient id={`${id}-cloud`} x1="0" y1="0" x2="0.7" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#b8c6e6"/></linearGradient></defs>
    {(type==='sun'||type==='partly') && (day?<g transform={cloudy?'translate(-12,-13) scale(.88)':'translate(0,-2)'}><g stroke="#ffcd77" strokeWidth="4" strokeLinecap="round">{Array.from({length:8},(_,i)=><path key={i} d="M50 9v7" transform={`rotate(${i*45} 50 50)`}/>)}</g><circle cx="50" cy="50" r="25" fill={`url(#${id}-sun)`}/></g>:<path d="M65 18a32 32 0 1 0 18 53A35 35 0 0 1 65 18" fill="#d6deff" transform={cloudy?'translate(-8,-9) scale(.8)':undefined}/>)}
    {cloudy&&<path d="M23 72h51a17 17 0 0 0 1-34 25 25 0 0 0-46-5 20 20 0 0 0-6 39Z" fill={`url(#${id}-cloud)`} transform={['rain','snow','storm','fog'].includes(type)?'translate(0,-8)':undefined}/>}
    {type==='rain'&&<g stroke="#79b3ff" strokeWidth="5" strokeLinecap="round"><path d="m30 75-4 10m25-10-4 10m25-10-4 10"/></g>}
    {type==='snow'&&<g fill="#d6eaff"><circle cx="28" cy="81" r="3"/><circle cx="49" cy="88" r="3"/><circle cx="71" cy="81" r="3"/></g>}
    {type==='storm'&&<path d="m54 62-16 20h12l-4 17 20-24H54l7-13Z" fill="#ffcf74"/>}
    {type==='fog'&&<g stroke="#c1cee4" strokeWidth="4" strokeLinecap="round"><path d="M20 78h59M30 89h41"/></g>}
  </svg>;
}
