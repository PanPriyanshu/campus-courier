import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { subscribeToOrders, Order } from "@/lib/orders";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MapView = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    navigator.geolocation?.getCurrentPosition((pos) => {
      map.setView([pos.coords.latitude, pos.coords.longitude], 14);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeToOrders(setOrders);
    return unsub;
  }, []);

  // Update markers when orders change
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
      <div className="px-4 pb-4">
        <div
          ref={mapContainerRef}
          className="rounded-xl overflow-hidden border border-border shadow-card"
          style={{ height: "60vh" }}
        />
      </div>
    </Layout>
  );
};

export default MapView;
