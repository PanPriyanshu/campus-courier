import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { subscribeToOrders, Order } from "@/lib/orders";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const blueDotIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(66,133,244,0.6);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/* Try Capacitor Geolocation first, fall back to browser API */
async function getCapacitorGeolocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

async function watchCapacitorGeolocation(
  cb: (lat: number, lng: number) => void
): Promise<string | null> {
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (pos, err) => {
        if (pos) cb(pos.coords.latitude, pos.coords.longitude);
      }
    );
    return id;
  } catch {
    return null;
  }
}

const MapView = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const myLocationRef = useRef<L.Marker | null>(null);
  const myLatLngRef = useRef<L.LatLngExpression | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const recenter = () => {
    if (mapRef.current && myLatLngRef.current) {
      mapRef.current.setView(myLatLngRef.current, 15);
    }
  };

  const updateLocation = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    const latlng: L.LatLngExpression = [lat, lng];
    myLatLngRef.current = latlng;
    if (!myLocationRef.current) {
      map.setView(latlng, 15);
      myLocationRef.current = L.marker(latlng, { icon: blueDotIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup("You are here");
    } else {
      myLocationRef.current.setLatLng(latlng);
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      dragging: true,
      touchZoom: true,
    }).setView([20.5937, 78.9629], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    // Force Leaflet to recalculate size after render (fixes grey tiles in Capacitor WebView)
    setTimeout(() => map.invalidateSize(), 300);

    let browserWatchId: number | undefined;
    let capWatchId: string | null = null;

    // Try Capacitor geolocation, fall back to browser
    (async () => {
      capWatchId = await watchCapacitorGeolocation(updateLocation);
      if (!capWatchId) {
        // Fallback: browser geolocation
        browserWatchId = navigator.geolocation?.watchPosition(
          (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
          (err) => console.warn("Geolocation error:", err.message),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    })();

    return () => {
      if (browserWatchId !== undefined) navigator.geolocation?.clearWatch(browserWatchId);
      if (capWatchId) {
        import("@capacitor/geolocation").then(({ Geolocation }) =>
          Geolocation.clearWatch({ id: capWatchId! })
        ).catch(() => {});
      }
      map.remove();
      mapRef.current = null;
    };
  }, [updateLocation]);

  useEffect(() => {
    const unsub = subscribeToOrders(setOrders);
    return unsub;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers: L.Marker[] = [];
    const openOrders = orders.filter((o) => o.status === "open" && o.delivery_lat && o.delivery_lng);

    openOrders.forEach((o) => {
      const marker = L.marker([o.delivery_lat!, o.delivery_lng!], { icon: greenIcon }).addTo(map);
      marker.bindPopup(`
        <div style="padding:4px">
          <p style="font-weight:600;font-size:14px;margin:0 0 4px">${o.title}</p>
          <p style="font-size:12px;color:#666;margin:0 0 4px">${o.pickup_location}</p>
          <p style="font-size:12px;margin:0 0 4px">₹${o.item_budget + o.delivery_fee}</p>
          <a href="/order/${o.id}" style="font-size:12px;color:#0d9668">View details</a>
        </div>
      `);
      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [orders]);

  return (
    <Layout>
      <div className="px-4 pt-6 pb-2">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Errand Map</h1>
        <p className="text-sm text-muted-foreground mb-4">See open errands near you</p>
      </div>
      <div className="px-4 pb-4 relative">
        <div
          ref={mapContainerRef}
          className="rounded-xl overflow-hidden border border-border shadow-card"
          style={{ height: "60vh" }}
        />
        <Button
          size="icon"
          onClick={recenter}
          className="absolute bottom-8 right-8 z-[1000] h-10 w-10 rounded-full bg-card text-foreground border border-border shadow-lg hover:bg-muted"
        >
          <Crosshair className="h-5 w-5" />
        </Button>
      </div>
    </Layout>
  );
};

export default MapView;
