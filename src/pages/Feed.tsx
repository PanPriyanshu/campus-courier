import { useState, useEffect } from "react";
import { subscribeToOrders, Order, CATEGORIES } from "@/lib/orders";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import OrderCard from "@/components/OrderCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const CATEGORY_EMOJIS: Record<string, string> = {
  "Stationery": "✏️",
  "Food & Snacks": "📬",
  "Medicine": "💊",
  "Electronics": "🔌",
  "Groceries": "🛒",
  "Documents": "📄",
  "Clothing": "👕",
  "Other": "📦",
};

const Feed = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToOrders(setOrders);
    return unsub;
  }, []);

  const filtered = orders.filter((o) => {
    if (o.status !== "open") return false;
    if (selectedCategory && o.category !== selectedCategory) return false;
    if (search && !o.title.toLowerCase().includes(search.toLowerCase()) && !o.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-3">Open Errands</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search errands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          <Badge
            className={`cursor-pointer whitespace-nowrap ${!selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            onClick={() => setSelectedCategory(null)}
          >
            🔥 All
          </Badge>
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              className={`cursor-pointer whitespace-nowrap ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              {CATEGORY_EMOJIS[cat] || "📦"} {cat.replace(" & Snacks", "")}
            </Badge>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="px-4 space-y-3 pb-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-muted-foreground">No open errands yet. Be the first to post!</p>
          </div>
        ) : (
          filtered.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </Layout>
  );
};

export default Feed;
