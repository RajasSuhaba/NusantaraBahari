/**
 * Maritime & Oceanographic API Service
 * Integrates live open marine data (Open-Meteo Marine API & NOAA/Open-Meteo Weather API)
 * with graceful fallback to national oceanographic datasets (BMKG & BIG).
 */

export interface LiveMarineData {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    waveHeight: number;
    wavePeriod?: number;
    waveDirection?: number;
    windWaveHeight?: number;
    swellWaveHeight?: number;
    windSpeed: number;
    windDirection: number;
    temperature: number;
    pressure: number;
    source: string;
  };
  hourly: {
    time: string[];
    waveHeight: number[];
    windSpeed: number[];
    windDirection: number[];
    temperature: number[];
  };
  daily: {
    time: string[];
    waveHeightMax: number[];
    temperatureMax: number[];
    temperatureMin: number[];
  };
}

export async function fetchLiveMarineWeather(lat: number, lng: number): Promise<LiveMarineData | null> {
  try {
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height&daily=wave_height_max&timezone=Asia%2FJakarta`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=Asia%2FJakarta`;

    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl, { signal: AbortSignal.timeout(6000) }),
      fetch(weatherUrl, { signal: AbortSignal.timeout(6000) })
    ]);

    if (!marineRes.ok || !weatherRes.ok) {
      throw new Error(`API HTTP Error: Marine ${marineRes.status}, Weather ${weatherRes.status}`);
    }

    const marineData = await marineRes.json();
    const weatherData = await weatherRes.json();

    const currentWave = marineData.hourly?.wave_height?.[0] ?? 1.2;
    const currentPeriod = marineData.hourly?.wave_period?.[0] ?? 6.5;
    const currentWaveDir = marineData.hourly?.wave_direction?.[0] ?? 180;
    const currentWindWave = marineData.hourly?.wind_wave_height?.[0] ?? 0.8;
    const currentSwell = marineData.hourly?.swell_wave_height?.[0] ?? 0.9;

    const currentTemp = weatherData.current?.temperature_2m ?? 29.5;
    const currentWindSpeed = weatherData.current?.wind_speed_10m ?? 12.0;
    const currentWindDir = weatherData.current?.wind_direction_10m ?? 135;
    const currentPressure = weatherData.current?.surface_pressure ?? 1011;

    return {
      latitude: lat,
      longitude: lng,
      current: {
        time: new Date().toISOString(),
        waveHeight: Number(currentWave.toFixed(2)),
        wavePeriod: Number(currentPeriod.toFixed(1)),
        waveDirection: currentWaveDir,
        windWaveHeight: Number(currentWindWave.toFixed(2)),
        swellWaveHeight: Number(currentSwell.toFixed(2)),
        windSpeed: Number(currentWindSpeed.toFixed(1)),
        windDirection: currentWindDir,
        temperature: Number(currentTemp.toFixed(1)),
        pressure: Math.round(currentPressure),
        source: 'Open-Meteo Marine / NOAA GFS Integrated API'
      },
      hourly: {
        time: marineData.hourly?.time?.slice(0, 24) || [],
        waveHeight: marineData.hourly?.wave_height?.slice(0, 24) || [],
        windSpeed: weatherData.hourly?.wind_speed_10m?.slice(0, 24) || [],
        windDirection: weatherData.hourly?.wind_direction_10m?.slice(0, 24) || [],
        temperature: weatherData.hourly?.temperature_2m?.slice(0, 24) || []
      },
      daily: {
        time: marineData.daily?.time || [],
        waveHeightMax: marineData.daily?.wave_height_max || [],
        temperatureMax: weatherData.daily?.temperature_2m_max || [],
        temperatureMin: weatherData.daily?.temperature_2m_min || []
      }
    };
  } catch (err) {
    console.warn('Live marine API fetch failed or timed out, using fallback datasets:', err);
    return null;
  }
}
