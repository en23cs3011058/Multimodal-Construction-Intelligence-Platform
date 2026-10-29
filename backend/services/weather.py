"""Live weather via Open-Meteo (free, no API key). Returns None on any failure so the
daily advisory degrades gracefully instead of erroring."""
import logging
from typing import Optional

import httpx

from schemas import WeatherSnapshot

log = logging.getLogger("weather")

WMO = {0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Rime fog",
       51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
       71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers", 81: "Heavy showers", 82: "Violent showers",
       95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm with hail"}


async def get_weather(location: str) -> Optional[WeatherSnapshot]:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            geo = await client.get("https://geocoding-api.open-meteo.com/v1/search",
                                   params={"name": location.split(",")[0].strip(), "count": 1})
            results = geo.json().get("results") or []
            if not results:
                return None
            place = results[0]
            fc = await client.get("https://api.open-meteo.com/v1/forecast", params={
                "latitude": place["latitude"], "longitude": place["longitude"], "timezone": "auto", "forecast_days": 1,
                "current": "temperature_2m,wind_speed_10m,weather_code",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max"})
            data = fc.json()
            cur, daily = data.get("current", {}), data.get("daily", {})
            first = lambda k: (daily.get(k) or [None])[0]
            return WeatherSnapshot(
                place=f"{place['name']}, {place.get('admin1') or place.get('country', '')}".strip(", "),
                temperature_c=cur.get("temperature_2m"), wind_kmh=cur.get("wind_speed_10m"),
                precipitation_mm_today=first("precipitation_sum"), rain_probability_pct=first("precipitation_probability_max"),
                max_temp_c=first("temperature_2m_max"), min_temp_c=first("temperature_2m_min"),
                description=WMO.get(cur.get("weather_code"), None))
    except Exception as exc:
        log.warning("Weather lookup failed: %s", exc)
        return None
