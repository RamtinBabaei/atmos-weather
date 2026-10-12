'use client';
import { useEffect, useState } from 'react';
import { apiErrorMessage, weatherSchema, type Location, type Weather } from '@/lib/weather/schema';
import { sampleWeather } from '@/lib/weather/sample';
export function useWeather(location:Location,refresh:number,sample:boolean) {
  const [state,setState]=useState<{data:Weather|null;loading:boolean;error:string|null}>({data:null,loading:true,error:null});
  useEffect(()=>{
    const controller=new AbortController();
    let active=true;
    if(sample) { setState({data:sampleWeather(),loading:false,error:null}); return ()=>{active=false;}; }
    setState({data:null,loading:true,error:null});
    const timeout=setTimeout(()=>controller.abort(new DOMException('Request timed out','TimeoutError')),20000);
    async function load() {
      try {
        const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude)});
        const response=await fetch(`/api/weather?${params}`,{signal:controller.signal,cache:refresh?'no-store':'default'});
        const json=await response.json();
        if(!response.ok) throw new Error(apiErrorMessage(json,'Unable to load the forecast. Please try again.'));
        const parsed=weatherSchema.safeParse(json);
        if(!parsed.success) throw new Error('This forecast is incomplete. Please try again.');
        if(active) setState({data:parsed.data,loading:false,error:null});
      } catch(error) {
        if(active) setState({data:null,loading:false,error:controller.signal.aborted?'The forecast took too long to load. Please try again.':error instanceof Error?error.message:'Unable to load the forecast.'});
      } finally {clearTimeout(timeout);}
    }
    void load();
    return ()=>{active=false;clearTimeout(timeout);controller.abort();};
  },[location.latitude,location.longitude,refresh,sample]);
  return state;
}
