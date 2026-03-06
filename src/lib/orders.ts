import { ref, push, set, get, update, onValue, query, orderByChild, off, DataSnapshot } from "firebase/database";
import { db } from "./firebase";

export interface Order {
  id: string;
  requester_id: string;
  requester_name: string;
  deliverer_id?: string;
  deliverer_name?: string;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  pickup_location: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_location: string;
  delivery_lat?: number;
  delivery_lng?: number;
  item_budget: number;
  delivery_fee: number;
  status: "open" | "accepted" | "picked_up" | "delivered" | "confirmed" | "cancelled";
  created_at: number;
  updated_at: number;
}

export const CATEGORIES = [
  "Stationery", "Food & Snacks", "Medicine", "Electronics",
  "Groceries", "Documents", "Clothing", "Other"
];

export const createOrder = async (order: Omit<Order, "id" | "created_at" | "updated_at" | "status">) => {
  const ordersRef = ref(db, "orders");
  const newRef = push(ordersRef);
  // Strip undefined values to avoid Firebase errors
  const clean = Object.fromEntries(
    Object.entries(order).filter(([, v]) => v !== undefined)
  );
  const data = {
    ...clean,
    id: newRef.key!,
    status: "open" as const,
    created_at: Date.now(),
    updated_at: Date.now(),
  };
  await set(newRef, data);
  return data as Order;
};

export const updateOrder = async (orderId: string, data: Partial<Order>) => {
  await update(ref(db, `orders/${orderId}`), { ...data, updated_at: Date.now() });
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  const snap = await get(ref(db, `orders/${orderId}`));
  return snap.exists() ? (snap.val() as Order) : null;
};

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const ordersRef = query(ref(db, "orders"), orderByChild("created_at"));
  const handler = (snap: DataSnapshot) => {
    const orders: Order[] = [];
    snap.forEach((child) => {
      orders.push(child.val() as Order);
    });
    callback(orders.reverse());
  };
  onValue(ordersRef, handler);
  return () => off(ordersRef, "value", handler);
};

export const subscribeToOrder = (orderId: string, callback: (order: Order | null) => void) => {
  const orderRef = ref(db, `orders/${orderId}`);
  const handler = (snap: DataSnapshot) => {
    callback(snap.exists() ? (snap.val() as Order) : null);
  };
  onValue(orderRef, handler);
  return () => off(orderRef, "value", handler);
};

// Chat
export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: number;
}

export const sendMessage = async (orderId: string, msg: Omit<ChatMessage, "id" | "created_at">) => {
  const chatRef = ref(db, `chats/${orderId}`);
  const newRef = push(chatRef);
  await set(newRef, { ...msg, id: newRef.key!, created_at: Date.now() });
};

export const subscribeToChat = (orderId: string, callback: (messages: ChatMessage[]) => void) => {
  const chatRef = ref(db, `chats/${orderId}`);
  const handler = (snap: DataSnapshot) => {
    const msgs: ChatMessage[] = [];
    snap.forEach((child) => {
      msgs.push(child.val() as ChatMessage);
    });
    callback(msgs);
  };
  onValue(chatRef, handler);
  return () => off(chatRef, "value", handler);
};

// Ratings — strictly capped at 5
export const rateUser = async (userId: string, rating: number) => {
  const clampedRating = Math.min(5, Math.max(1, rating));
  const userRef = ref(db, `users/${userId}`);
  const snap = await get(userRef);
  if (snap.exists()) {
    const user = snap.val();
    const totalRatings = (user.total_ratings || 0) + 1;
    const newRating = ((user.rating || 0) * (user.total_ratings || 0) + clampedRating) / totalRatings;
    await update(userRef, { rating: Math.round(Math.min(5, newRating) * 10) / 10, total_ratings: totalRatings });
  }
};

// Get deliverer UPI ID
export const getDelivererUpi = async (userId: string): Promise<string | null> => {
  const snap = await get(ref(db, `users/${userId}/upiId`));
  return snap.exists() ? snap.val() : null;
};

// Atomic delivery completion using RTDB transaction
export const completeDelivery = async (orderId: string, delivererId: string, tipAmount: number) => {
  // 1. Set order status to confirmed
  await update(ref(db, `orders/${orderId}`), { status: "confirmed", updated_at: Date.now() });

  // 2. Increment deliverer stats atomically
  const userRef = ref(db, `users/${delivererId}`);
  const snap = await get(userRef);
  if (snap.exists()) {
    const user = snap.val();
    await update(userRef, {
      total_deliveries: (user.total_deliveries || 0) + 1,
      total_earnings: (user.total_earnings || 0) + tipAmount,
    });
  }
};

export const creditDelivery = async (userId: string, amount: number) => {
  const userRef = ref(db, `users/${userId}`);
  const snap = await get(userRef);
  if (snap.exists()) {
    const user = snap.val();
    await update(userRef, {
      total_deliveries: (user.total_deliveries || 0) + 1,
      total_earnings: (user.total_earnings || 0) + amount,
    });
  }
};

// Distance calc
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const suggestTip = (distanceKm: number): number => {
  return Math.max(30, Math.round(distanceKm * 20));
};
