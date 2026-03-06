import { useState, useEffect, useRef, useCallback } from "react";
import { subscribeToOrders, Order, CATEGORIES } from "@/lib/orders";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import OrderCard from "@/components/OrderCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";

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
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const PULL_THRESHOLD = 80;

  useEffect(() => {
    const unsub = subscribeToOrders(setOrders);
    return unsub;
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Firebase realtime sub auto-refreshes; simulate a visual refresh
    setTimeout(() => {
      setRefreshing(false);
      setPullDistance(0);
    }, 800);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (el && el.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= PULL_THRESHOLD) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, handleRefresh]);

  const filtered = orders.filter((o) => {
    if (o.status !== "open") return false;
    if (selectedCategory && o.category !== selectedCategory) return false;
    if (search && !o.title.toLowerCase().includes(search.toLowerCase()) && !o.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Layout>
      <div
        ref={scrollRef}
        className="h-[calc(100vh-5rem)] overflow-y-auto overscroll-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-200"
          style={{ height: refreshing ? 48 : pullDistance > 10 ? pullDistance : 0 }}
        >
          <Loader2
            className={`h-5 w-5 text-primary transition-transform ${refreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)`, opacity: Math.min(pullDistance / PULL_THRESHOLD, 1) }}
          />
          <span className="ml-2 text-xs text-muted-foreground">
            {refreshing ? "Refreshing…" : pullDistance >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>

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
      </div>
    </Layout>
  );
};

export default Feed;
