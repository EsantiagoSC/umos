import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat/dist/leaflet-heat.js";

// Cuánto "calor" aporta cada evento según su severidad (0 a 1).
const SEVERITY_INTENSITY = { HIGH: 1.0, MEDIUM: 0.6, LOW: 0.3 };

/**
 * Capa de calor del tráfico encima del mapa. Recibe los eventos activos
 * (lat, lon, radio, severidad) y los pinta como un degradado de verde a rojo.
 * Si el evento tiene un radio grande, sembramos puntitos alrededor para que
 * el calor no quede concentrado en un solo pixel.
 */
export default function TrafficHeatLayer({ events, visible }) {
  const map = useMap();

  useEffect(() => {
    if (!visible || !events?.length) return;

    const points = [];
    for (const ev of events) {
      const intensity = SEVERITY_INTENSITY[ev.severity] ?? 0.5;
      points.push([ev.latitude, ev.longitude, intensity]);

      // Sembramos 4 puntos alrededor proporcional al radio del evento.
      const radDeg = (ev.radius_m || 500) / 111000; // metros → grados (aprox)
      if (radDeg > 0.003) {
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI) / 2;
          points.push([
            ev.latitude + Math.cos(ang) * radDeg * 0.7,
            ev.longitude + Math.sin(ang) * radDeg * 0.7,
            intensity * 0.7,
          ]);
        }
      }
    }

    const layer = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      gradient: {
        0.3: "#22c55e",   // verde (poco tráfico)
        0.55: "#eab308",  // amarillo
        0.8: "#f97316",   // naranja
        1.0: "#dc2626",   // rojo (congestionado)
      },
    });
    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, events, visible]);

  return null;
}