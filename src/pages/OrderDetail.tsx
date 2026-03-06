import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToOrder, updateOrder, Order,
  subscribeToChat, sendMessage, ChatMessage,
  rateUser, creditDelivery,
} from "@/lib/orders";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, IndianRupee, User, Star, Send,
  CheckCircle, Package, Truck, MessageCircle, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const statusSteps = ["open", "accepted", "picked_up", "delivered", "confirmed"];

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgText, setMsgText] = useState("");
  const [rating, setRating] = useState(5);
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const unsub1 = subscribeToOrder(id, setOrder);
    const unsub2 = subscribeToChat(id, setMessages);
    return () => { unsub1(); unsub2(); };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!order) return <Layout><div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div></Layout>;

  const isRequester = user?.uid === order.requester_id;
  const isDeliverer = user?.uid === order.deliverer_id;
  const currentStep = statusSteps.indexOf(order.status);
  const totalAmount = order.item_budget + order.delivery_fee;

  const handleAccept = async () => {
    if (!user || !profile) return;
    await updateOrder(order.id, {
      deliverer_id: user.uid,
      deliverer_name: profile.displayName,
      status: "accepted",
    });
    toast.success("Errand accepted! Contact the requester for details.");
  };

  const handleStatusUpdate = async (newStatus: Order["status"]) => {
    await updateOrder(order.id, { status: newStatus });
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleConfirmDelivery = async () => {
    await updateOrder(order.id, { status: "confirmed" });
    if (order.deliverer_id) {
      await creditDelivery(order.deliverer_id, totalAmount);
      await rateUser(order.deliverer_id, rating);
    }
    toast.success("Delivery confirmed! Deliverer has been credited.");
  };

  const handleSendMessage = async () => {
    if (!msgText.trim() || !user || !profile || !id) return;
    await sendMessage(id, { sender_id: user.uid, sender_name: profile.displayName, text: msgText.trim() });
    setMsgText("");
  };

  const upiLink = `upi://pay?pa=&pn=${encodeURIComponent(order.deliverer_name || "Deliverer")}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Campus Errand: ${order.title}`)}`;

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="font-heading text-xl font-bold text-foreground">{order.title}</h1>
            <Badge className={order.status === "open" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
              {order.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{order.description}</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto">
          {statusSteps.map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStep ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              {i < statusSteps.length - 1 && (
                <div className={`w-6 h-0.5 ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3 mb-4 shadow-card">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Pickup:</span>
            <span className="font-medium text-foreground">{order.pickup_location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-secondary" />
            <span className="text-muted-foreground">Deliver to:</span>
            <span className="font-medium text-foreground">{order.delivery_location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Posted by:</span>
            <span className="font-medium text-foreground">{order.requester_name}</span>
          </div>
          {order.deliverer_name && (
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Deliverer:</span>
              <span className="font-medium text-foreground">{order.deliverer_name}</span>
            </div>
          )}
        </div>

        {/* Payment breakdown */}
        <div className="bg-card rounded-xl border border-border p-4 mb-4 shadow-card">
          <h3 className="font-heading font-semibold text-foreground mb-2">Payment</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Item cost</span><span className="flex items-center"><IndianRupee className="h-3 w-3" />{order.item_budget}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery tip</span><span className="flex items-center"><IndianRupee className="h-3 w-3" />{order.delivery_fee}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1"><span>Total</span><span className="flex items-center"><IndianRupee className="h-3 w-3" />{totalAmount}</span></div>
          </div>
          {isRequester && order.status === "delivered" && (
            <a href={upiLink} className="mt-3 inline-flex items-center gap-1 text-sm text-primary font-medium">
              <ExternalLink className="h-3 w-3" /> Pay via UPI
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 mb-4">
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
          {isRequester && order.status === "delivered" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Rate deliverer</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Star className={`h-6 w-6 ${s <= rating ? "text-secondary fill-secondary" : "text-muted"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleConfirmDelivery} className="w-full gradient-primary text-primary-foreground font-semibold">
                <CheckCircle className="h-4 w-4 mr-1" /> Confirm Delivery
              </Button>
            </div>
          )}
        </div>

        {/* Chat toggle */}
        {(isRequester || isDeliverer) && order.status !== "open" && (
          <>
            <Button variant="outline" onClick={() => setShowChat(!showChat)} className="w-full mb-3">
              <MessageCircle className="h-4 w-4 mr-1" /> {showChat ? "Hide Chat" : "Open Chat"}
            </Button>

            {showChat && (
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
                <div className="h-60 overflow-y-auto p-3 space-y-2">
                  {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No messages yet</p>}
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_id === user?.uid ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${m.sender_id === user?.uid ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        <p className="font-medium text-[10px] opacity-70 mb-0.5">{m.sender_name}</p>
                        <p>{m.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="border-t border-border p-2 flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSendMessage} className="gradient-primary text-primary-foreground">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetail;
