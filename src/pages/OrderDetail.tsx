import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToOrder, updateOrder, Order,
  subscribeToChat, sendMessage, ChatMessage,
  rateUser, completeDelivery, getDelivererUpi,
} from "@/lib/orders";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, User, Star, Send,
  CheckCircle, Package, Truck, ArrowLeft, CreditCard, Copy,
} from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  open: "Open",
  accepted: "Accepted",
  picked_up: "Picked up",
  delivered: "Delivered – confirm receipt",
  confirmed: "Confirmed ✅",
  cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  accepted: "bg-blue-100 text-blue-700",
  picked_up: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  confirmed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgText, setMsgText] = useState("");
  const [rating, setRating] = useState(0);
  const [paymentSent, setPaymentSent] = useState(false);
  const [delivererUpi, setDelivererUpi] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const unsub1 = subscribeToOrder(id, setOrder);
    const unsub2 = subscribeToChat(id, setMessages);
    return () => { unsub1(); unsub2(); };
  }, [id]);

  // Fetch deliverer UPI when order is delivered
  useEffect(() => {
    if (order?.status === "delivered" && order.deliverer_id && isRequester) {
      getDelivererUpi(order.deliverer_id).then(setDelivererUpi).catch(() => setDelivererUpi(null));
      getDelivererBankingName(order.deliverer_id).then(setDelivererBankingName).catch(() => setDelivererBankingName(null));
    }
  }, [order?.status, order?.deliverer_id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!order) return <Layout><div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div></Layout>;

  const isRequester = user?.uid === order.requester_id;
  const isDeliverer = user?.uid === order.deliverer_id;
  const totalAmount = order.item_budget + order.delivery_fee;
  const timeAgo = getTimeAgo(order.created_at);

  const handleAccept = async () => {
    if (!user || !profile) return;
    await updateOrder(order.id, {
      deliverer_id: user.uid,
      deliverer_name: profile.displayName,
      status: "accepted",
    });
    toast.success("Errand accepted!");
  };

  const handleStatusUpdate = async (newStatus: Order["status"]) => {
    await updateOrder(order.id, { status: newStatus });
    toast.success(`Status updated to ${newStatus}`);
  };

  const handlePayViaApp = () => {
    if (!delivererUpi) {
      toast.error("Deliverer has not set their UPI ID yet.");
      return;
    }
    const upiUri = `upi://pay?pa=${encodeURIComponent(delivererUpi)}&pn=${encodeURIComponent(order.deliverer_name || "Deliverer")}&am=${totalAmount}&cu=INR`;
    window.location.href = upiUri;
    setTimeout(() => setPaymentSent(true), 1000);
  };

  const handleCopyUpi = () => {
    if (!delivererUpi) return;
    navigator.clipboard.writeText(delivererUpi);
    toast.success("UPI ID copied to clipboard!");
  };

  const handleConfirmCompletion = async () => {
    if (!order.deliverer_id || !id) return;
    try {
      await completeDelivery(id, order.deliverer_id, order.delivery_fee);
      if (rating > 0) await rateUser(order.deliverer_id, rating);
      toast.success("Delivery confirmed! Deliverer credited.");
      await refreshProfile();
    } catch {
      toast.error("Failed to confirm delivery.");
    }
  };

  const handleSendMessage = async () => {
    if (!msgText.trim() || !user || !profile || !id) return;
    await sendMessage(id, { sender_id: user.uid, sender_name: profile.displayName, text: msgText.trim() });
    setMsgText("");
  };

  return (
    <Layout>
      <div className="px-4 pt-4 pb-4 space-y-4">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Main card */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-card">
          {/* Title + Status */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">{order.title}</h1>
              <p className="text-sm text-muted-foreground">{order.description}</p>
            </div>
            <Badge className={`text-xs whitespace-nowrap ${statusColors[order.status] || ""}`}>
              {order.status === "delivered" ? "📦 " : ""}{statusLabels[order.status]}
            </Badge>
          </div>

          {/* Locations */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Pickup:</span>
              <span className="text-foreground">{order.pickup_location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-destructive" />
              <span className="font-medium">Deliver to:</span>
              <span className="text-foreground">{order.delivery_location}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-primary/5 rounded-lg p-3">
            <p className="text-2xl font-bold flex items-center gap-1 text-foreground">
              <span>₹</span> {totalAmount}
            </p>
            <p className="text-xs text-muted-foreground">
              Item: ₹{order.item_budget} + Tip: ₹{order.delivery_fee}
            </p>
          </div>

          {/* People */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Posted by <strong>{order.requester_name}</strong></span>
            </div>
            {order.deliverer_name && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>Delivering: <strong>{order.deliverer_name}</strong></span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">Posted {timeAgo}</p>

          {/* Actions */}
          {order.status === "open" && !isRequester && (
            <Button onClick={handleAccept} className="w-full gradient-primary text-primary-foreground font-semibold">
              <Package className="h-4 w-4 mr-1" /> Accept Errand
            </Button>
          )}
          {isDeliverer && order.status === "accepted" && (
            <Button onClick={() => handleStatusUpdate("picked_up")} className="w-full gradient-accent text-accent-foreground font-semibold">
              Mark as Picked Up
            </Button>
          )}
          {isDeliverer && order.status === "picked_up" && (
            <Button onClick={() => handleStatusUpdate("delivered")} className="w-full gradient-primary text-primary-foreground font-semibold">
              Mark as Delivered
            </Button>
          )}

          {/* Pay & Confirm flow for requester */}
          {isRequester && order.status === "delivered" && (
            <div className="space-y-3">
              {/* Recipient info */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pay to</p>
                <p className="text-sm font-semibold text-foreground">{delivererBankingName || order.deliverer_name}</p>
                {delivererUpi ? (
                  <p className="text-sm text-muted-foreground font-mono">{delivererUpi}</p>
                ) : (
                  <p className="text-sm text-destructive">UPI ID not set by deliverer</p>
                )}
                <p className="text-lg font-bold text-foreground mt-1">₹{totalAmount}</p>
              </div>

              {/* Rating */}
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Rate the deliverer:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Star className={`h-7 w-7 transition-colors ${s <= rating ? "text-secondary fill-secondary" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {!paymentSent ? (
                <div className="space-y-2">
                  <Button onClick={handlePayViaApp} disabled={!delivererUpi} className="w-full gradient-primary text-primary-foreground font-semibold text-base py-5">
                    <CreditCard className="h-5 w-5 mr-2" /> Pay ₹{totalAmount} via UPI App
                  </Button>
                  <Button variant="outline" onClick={handleCopyUpi} disabled={!delivererUpi} className="w-full font-semibold">
                    <Copy className="h-4 w-4 mr-2" /> Copy UPI ID
                  </Button>
                </div>
              ) : (
                <Button onClick={handleConfirmCompletion} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base py-5">
                  <CheckCircle className="h-5 w-5 mr-2" /> Payment Sent? Confirm Completion
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Chat */}
        {(isRequester || isDeliverer) && order.status !== "open" && (
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
            <h3 className="font-heading font-semibold text-foreground px-4 pt-4 pb-2">Chat</h3>
            <div className="h-48 overflow-y-auto px-4 space-y-2">
              {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No messages yet</p>}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === user?.uid ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${m.sender_id === user?.uid ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-border p-3 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSendMessage} className="gradient-primary text-primary-foreground rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default OrderDetail;
