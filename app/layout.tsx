import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Atmos — Weather, beautifully clear',
  description: 'A little clarity for your everyday. Explore current weather, hourly updates and seven-day forecasts anywhere in the world.',
  icons:{icon:'/favicon.svg'},
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
