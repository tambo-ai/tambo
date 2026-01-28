import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceState {
  clientName: string;
  items: InvoiceItem[];
  totalAmount: number;
  isSaving: boolean;
  setClientName: (name: string) => void;
  setItems: (items: InvoiceItem[]) => void;
  setTotal: (amount: number) => void;
  saveToCloud: () => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  clientName: "",
  items: [],
  totalAmount: 0,
  isSaving: false,

  setClientName: (name) => set({ clientName: name }),
  setItems: (items) => set({ items }),
  setTotal: (amount) => set({ totalAmount: amount }),

  saveToCloud: async () => {
    const state = get();
    set({ isSaving: true });

    // 1. Check if Supabase is connected
    if (!supabase) {
      alert("⚠️ Supabase keys missing! Check .env.local");
      set({ isSaving: false });
      return;
    }

    try {
      // 2. Send data to the Cloud
      const { error } = await supabase.from("invoices").insert([
        {
          client_name: state.clientName || "Unnamed Client",
          total_amount: state.totalAmount || 0,
          items: state.items,
        },
      ]);

      if (error) throw error;
      alert("✅ Success! Invoice saved to Supabase Cloud Database.");
    } catch (err: any) {
      console.error("Supabase Error:", err);
      alert("❌ Error saving to cloud: " + err.message);
    } finally {
      set({ isSaving: false });
    }
  },
}));
