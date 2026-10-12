'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}) {
  return <main className="empty-state min-h-screen"><h1>Let’s clear things up.</h1><p>The app encountered an unexpected problem.</p><button className="primary-button" onClick={reset}>Try again</button></main>;
}
