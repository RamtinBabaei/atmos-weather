'use client';
import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, ArrowUpRight, LoaderCircle, X } from 'lucide-react';
import { apiErrorMessage, locationsSchema, QUICK_LOCATIONS, type Location } from '@/lib/weather/schema';
export function LocationSearch({onSelect}:{onSelect:(location:Location)=>void}) {
  const [query,setQuery]=useState('');
  const [open,setOpen]=useState(false);
  const [results,setResults]=useState<Location[]>([]);
  const [status,setStatus]=useState<'idle'|'loading'|'done'|'error'>('idle');
  const [error,setError]=useState('');
  const [active,setActive]=useState(-1);
  const [retry,setRetry]=useState(0);
  const wrapper=useRef<HTMLDivElement>(null);
  const input=useRef<HTMLInputElement>(null);
  const term=query.trim();
  const choices=term.length<2?QUICK_LOCATIONS:results;
  function choose(place:Location) {onSelect(place);setQuery('');setOpen(false);setActive(-1);input.current?.blur();}
  useEffect(()=>{
    function outside(e:PointerEvent) {if(!wrapper.current?.contains(e.target as Node)) setOpen(false);}
    document.addEventListener('pointerdown',outside);
    return ()=>document.removeEventListener('pointerdown',outside);
  },[]);
  useEffect(()=>{
    const controller=new AbortController();let activeRequest=true;
    setResults([]);setActive(-1);setError('');
    if(term.length<2) {setStatus('idle');return ()=>controller.abort();}
    setStatus('loading');
    let timeout:ReturnType<typeof setTimeout>;
    const debounce=setTimeout(async()=>{
      timeout=setTimeout(()=>controller.abort(),20000);
      try {
        const response=await fetch(`/api/search?q=${encodeURIComponent(term)}`,{signal:controller.signal});
        const json=await response.json();
        if(!response.ok) throw new Error(apiErrorMessage(json,'Search is temporarily unavailable.'));
        const parsed=locationsSchema.safeParse(json);
        if(!parsed.success) throw new Error('Search returned an unexpected result.');
        if(activeRequest) {setResults(parsed.data.results??[]);setStatus('done');}
      } catch(e) {if(activeRequest) {setError(e instanceof Error&&!controller.signal.aborted?e.message:'Search could not connect. Please try again.');setStatus('error');}}
      finally {clearTimeout(timeout);}
    },350);
    return ()=>{activeRequest=false;clearTimeout(debounce);clearTimeout(timeout);controller.abort();};
  },[term,retry]);
  return <div className="search-wrap" ref={wrapper}>
    <form className="search-form" role="search" onSubmit={e=>{e.preventDefault();setOpen(true);if(term.length<2) {setError('Enter at least 2 characters to search.');input.current?.focus();} else if(choices.length) choose(choices[active>=0?active:0]);}}>
      <div className="search-input-wrap"><Search size={20}/><input ref={input} aria-label="Search for a city" placeholder="Search for a city or place…" value={query} maxLength={100} onFocus={()=>setOpen(true)} onChange={e=>{setQuery(e.target.value);setOpen(true);}} role="combobox" aria-expanded={open} aria-autocomplete="list" aria-controls="location-results" aria-activedescendant={open&&active>=0?`location-option-${active}`:undefined} onKeyDown={e=>{
        if(e.key==='Escape') {setOpen(false);setActive(-1);}
        if(e.key==='ArrowDown'||e.key==='ArrowUp') {e.preventDefault();setOpen(true);setActive(i=>choices.length?(i+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length:-1);}
        if(e.key==='Enter'&&open&&active>=0&&choices[active]) {e.preventDefault();choose(choices[active]);}
      }}/>{query&&<button type="button" className="clear-search" aria-label="Clear search" onClick={()=>{setQuery('');input.current?.focus();}}><X size={17}/></button>}</div>
      <button className="search-button" type="submit">Search <ArrowUpRight size={17}/></button>
    </form>
    {open&&<div className="search-dropdown"><p className="dropdown-caption">{term.length<2?'Explore a little further':'Matching locations'}</p>
      {error&&<div className="search-message" role="alert">{error}{status==='error'&&<button type="button" onClick={()=>setRetry(n=>n+1)}>Try again</button>}</div>}
      {status==='loading'&&<p className="search-message" role="status"><LoaderCircle size={18} className="spin"/> Finding your place…</p>}
      {status==='done'&&results.length===0&&<p className="search-message" role="status">No places found. Try a nearby city or add a country.</p>}
      <ul id="location-results" role="listbox" aria-label="Locations">{choices.map((place,i)=><li key={`${place.latitude}-${place.longitude}`} id={`location-option-${i}`} role="option" aria-selected={i===active}><button type="button" tabIndex={-1} className={i===active?'active':''} onPointerEnter={()=>setActive(i)} onClick={()=>choose(place)}><MapPin size={17}/><span><strong>{place.name}</strong><small>{[place.admin1,place.country].filter(Boolean).join(', ')}</small></span><ArrowUpRight size={16}/></button></li>)}</ul>
    </div>}
  </div>;
}
