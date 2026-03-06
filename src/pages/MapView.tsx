import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { subscribeToOrders, Order } from "@/lib/orders";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { IndianRupee } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MapView = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [center, setCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center
  const navigate = useNavigate();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setCenter([pos.coords.latitude, pos.coords.longitude]);
    });
    const unsub = subscribeToOrders(setOrders);
    return unsub;
  }, []);

  const openOrders = orders.filter((o) => o.status === "open" && o.delivery_lat && o.delivery_lng);

  return (
    <Layout>
      <div className="px-4 pt-6 pb-2">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Errand Map</h1>
        <p className="text-sm text-muted-foreground mb-4">See open errands near you</p>
      </div>
      <div className="px-4 pb-4">
        <div className="rounded-xl overflow-hidden border border-border shadow-card" style={{ height: "60vh" }}>
          <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {openOrders.map((o) => (
              <Marker key={o.id} position={[o.delivery_lat!, o.delivery_lng!]} icon={greenIcon}>
                <Popup>
                  <div className="p-1">
                    <p className="font-semibold text-sm">{o.title}</p>
                    <p className="text-xs text-gray-500 mb-1">{o.pickup_location}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <IndianRupee className="h-3 w-3" />
                      <span>{o.item_budget + o.delivery_fee}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/order/${o.id}`)}
                      className="mt-1 text-xs text-blue-600 underline"
                    >
                      View details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </Layout>
  );
};

export default MapView;
