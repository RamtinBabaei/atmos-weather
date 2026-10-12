import { weatherResponse } from '@/lib/weather/service';
export async function GET(request:Request) { return weatherResponse(request); }
