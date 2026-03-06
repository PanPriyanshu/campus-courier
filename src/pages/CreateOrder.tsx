import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createOrder, CATEGORIES, suggestTip } from "@/lib/orders";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, IndianRupee, Navigation } from "lucide-react";
import { toast } from "sonner";

const CreateOrder = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | undefined>();
  const [deliveryLng, setDeliveryLng] = useState<number | undefined>();
  const [itemBudget, setItemBudget] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryLat(pos.coords.latitude);
        setDeliveryLng(pos.coords.longitude);
        setDeliveryLocation(`My Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        toast.success("Location captured!");
        // Suggest tip
        const suggestedFee = suggestTip(1.5); // ~1.5km avg
        if (!deliveryFee) setDeliveryFee(String(suggestedFee));
      },
      () => toast.error("Could not get location")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) { toast.error("Please login first"); return; }
    if (!title || !description || !category || !pickupLocation || !deliveryLocation || !itemBudget) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await createOrder({
        requester_id: user.uid,
        requester_name: profile.displayName,
        title,
        description,
        category,
        pickup_location: pickupLocation,
        delivery_location: deliveryLocation,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        item_budget: Number(itemBudget),
        delivery_fee: Number(deliveryFee) || 30,
      });
      toast.success("Errand posted!");
      navigate("/feed");
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Post an Errand</h1>
        <p className="text-sm text-muted-foreground mb-6">Describe what you need and where to get it</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>What do you need?</Label>
            <Input placeholder="e.g., Blue Pilot pen, Dolo 650" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea placeholder="Brand, quantity, any specifics..." value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pickup from (shop/market)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="e.g., Campus Road Stationery Shop" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deliver to</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="e.g., Hostel 5, Room 302" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} className="pl-10" required />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={useMyLocation} className="mt-1">
              <Navigation className="h-3 w-3 mr-1" /> Use my location
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Item Budget (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="number" placeholder="200" value={itemBudget} onChange={(e) => setItemBudget(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Delivery Tip (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="number" placeholder="50" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Suggested tip: ₹30–100 based on distance</p>

          <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={loading}>
            {loading ? "Posting..." : "Post Errand"}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default CreateOrder;
