/**
 * Leaflet map preview for profile address — geocodes typed address via Nominatim (OSM).
 * Loaded with `next/dynamic({ ssr: false })` from the profile form.
 */

"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocoders } from "leaflet-control-geocoder";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

import { cn } from "@/lib/utils";

const DEFAULT_CENTER: L.LatLngTuple = [20, 0];
const DEFAULT_ZOOM = 2;
const PIN_ZOOM = 16;
const GEOCODE_DEBOUNCE_MS = 3000;
const MIN_QUERY_LEN = 3;

/** Leaflet marker assets — CDN avoids broken `import` URLs under Next/Turbopack. */
const LEAFLET_MARKER_IMAGES =
  "https://unpkg.com/leaflet@1.9.4/dist/images";

/** Set `NEXT_PUBLIC_NOMINATIM_CONTACT_EMAIL` in production (OSM usage policy). */
const NOMINATIM_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_NOMINATIM_CONTACT_EMAIL ?? "dev@equus.local";

const nominatimGeocoder = geocoders.nominatim({
  geocodingQueryParams: { email: NOMINATIM_CONTACT_EMAIL },
});

const defaultMarkerIcon = L.icon({
  iconUrl: `${LEAFLET_MARKER_IMAGES}/marker-icon.png`,
  iconRetinaUrl: `${LEAFLET_MARKER_IMAGES}/marker-icon-2x.png`,
  shadowUrl: `${LEAFLET_MARKER_IMAGES}/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export type ProfileAddressMapProps = {
  addressQuery: string;
  /** Saved pin as `[latitude, longitude]` (Mongo stores `[lng, lat]`). */
  initialPosition?: [number, number] | null;
  onCoordinatesChange: (coords: [number, number] | null) => void;
  className?: string;
};

export function ProfileAddressMap({
  addressQuery,
  initialPosition = null,
  onCoordinatesChange,
  className,
}: ProfileAddressMapProps) {
  const t = useTranslations("profile.addressMap");
  const query = addressQuery.trim();
  const queryReady = query.length >= MIN_QUERY_LEN;

  const [geocodedPin, setGeocodedPin] = useState<L.LatLngTuple | null>(
    initialPosition,
  );
  const [geoHint, setGeoHint] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [settledQuery, setSettledQuery] = useState<string | null>(null);

  const pin = queryReady ? geocodedPin : initialPosition;

  useEffect(() => {
    if (!queryReady) {
      queueMicrotask(() => {
        onCoordinatesChange(
          initialPosition ? [initialPosition[1], initialPosition[0]] : null,
        );
      });
      return;
    }

    let cancelled = false;
    const delay =
      settledQuery !== null && settledQuery !== query ? GEOCODE_DEBOUNCE_MS : 0;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setIsGeocoding(true);

      void nominatimGeocoder.geocode(query).then(
        (results) => {
          if (cancelled) return;
          setIsGeocoding(false);
          setSettledQuery(query);

          const first = results[0];
          if (first?.center) {
            const lat = first.center.lat;
            const lng = first.center.lng;
            const nextPin: L.LatLngTuple = [lat, lng];
            setGeocodedPin(nextPin);
            setGeoHint(null);
            onCoordinatesChange([lng, lat]);
            return;
          }

          setGeocodedPin(null);
          setGeoHint(t("geoNotFound"));
          onCoordinatesChange(null);
        },
        () => {
          if (cancelled) return;
          setIsGeocoding(false);
          setSettledQuery(query);
          setGeocodedPin(null);
          setGeoHint(t("geoFailed"));
          onCoordinatesChange(null);
        },
      );
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setIsGeocoding(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- geocode on query change only
  }, [query, queryReady, t]);

  const center = pin ?? DEFAULT_CENTER;
  const zoom = pin ? PIN_ZOOM : DEFAULT_ZOOM;
  const mapKey = pin ? `pin-${pin[0]}-${pin[1]}` : "world";

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{t("title")}</p>
        {isGeocoding ? (
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
            {t("loading")}
          </p>
        ) : null}
      </div>
      <div className="relative isolate z-0 h-56 w-full min-h-0 overflow-hidden rounded-lg border sm:h-64 md:h-[min(50vh,22rem)] md:min-h-72">
        <MapContainer
          key={mapKey}
          center={center}
          zoom={zoom}
          className="z-0 h-full! w-full! rounded-none border-0"
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          {/* Leaflet attribution HTML — external OpenStreetMap link, not app navigation */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pin ? <Marker position={pin} icon={defaultMarkerIcon} /> : null}
        </MapContainer>
      </div>
      {query.length > 0 && !queryReady ? (
        <p className="text-xs text-muted-foreground">{t("hintShortQuery")}</p>
      ) : null}
      {geoHint ? (
        <p className="text-xs text-amber-800 dark:text-amber-200" role="status">
          {geoHint}
        </p>
      ) : null}
      <p className="text-[11px] leading-snug text-muted-foreground">
        {t("footerNotice")}
      </p>
    </div>
  );
}
