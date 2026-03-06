import { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        const latlng: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
        myLatLngRef.current = latlng;
        if (!myLocationRef.current) {
          map.setView(latlng, 15);
        }
        if (myLocationRef.current) {
          myLocationRef.current.setLatLng(latlng);
        } else {
          myLocationRef.current = L.marker(latlng, { icon: blueDotIcon, zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup("You are here");
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      if (watchId !== undefined) navigator.geolocation?.clearWatch(watchId);
      map.remove();
      mapRef.current = null;
    };
  }, []);

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
