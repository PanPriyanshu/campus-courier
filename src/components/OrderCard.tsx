import { MapPin, Clock, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Order, CATEGORIES } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  open: "bg-primary text-primary-foreground",
  accepted: "bg-secondary text-secondary-foreground",
  picked_up: "bg-secondary text-secondary-foreground",
  delivered: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/20 text-primary",
  cancelled: "bg-destructive/20 text-destructive",
};

const OrderCard = ({ order }: { order: Order }) => {
  const navigate = useNavigate();
  const timeAgo = getTimeAgo(order.created_at);

  return (
    <button
      onClick={() => navigate(`/order/${order.id}`)}
      className="w-full text-left bg-card rounded-lg p-4 shadow-card hover:shadow-elevated transition-shadow border border-border"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-heading font-semibold text-card-foreground line-clamp-1">{order.title}</h3>
        <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{order.description}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {order.pickup_location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {timeAgo}
        </span>
        <span className="ml-auto flex items-center gap-0.5 font-semibold text-foreground">
          <IndianRupee className="h-3 w-3" />
          {order.item_budget + order.delivery_fee}
        </span>
      </div>
    </button>
  );
};

function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default OrderCard;
