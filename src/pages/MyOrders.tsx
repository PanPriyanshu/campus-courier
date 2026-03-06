import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToOrders, Order } from "@/lib/orders";
import Layout from "@/components/Layout";
import OrderCard from "@/components/OrderCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck } from "lucide-react";

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsub = subscribeToOrders(setOrders);
    return unsub;
  }, []);

  const myRequests = orders.filter((o) => o.requester_id === user?.uid);
  const myDeliveries = orders.filter((o) => o.deliverer_id === user?.uid);

  const renderList = (list: Order[], emptyMsg: string) => (
    <div className="space-y-3 mt-3">
      {list.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{emptyMsg}</p>
      ) : (
        list.map((o) => <OrderCard key={o.id} order={o} />)
      )}
    </div>
  );

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-4">My Orders</h1>

        <Tabs defaultValue="requests">
          <TabsList className="w-full">
            <TabsTrigger value="requests" className="flex-1 gap-1">
              <Package className="h-4 w-4" /> Requests ({myRequests.length})
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="flex-1 gap-1">
              <Truck className="h-4 w-4" /> Deliveries ({myDeliveries.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="requests">
            {renderList(myRequests, "You haven't posted any errands yet")}
          </TabsContent>
          <TabsContent value="deliveries">
            {renderList(myDeliveries, "You haven't delivered anything yet")}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MyOrders;
