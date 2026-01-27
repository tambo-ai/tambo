import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface InvoiceItem {
  id: string;
  desc: string;
  amount: number;
}

interface InvoiceState {
  items: InvoiceItem[];
  addItem: (desc: string, amount: number) => void;
  removeItem: (id: string) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (desc, amount) => set((state) => ({
        items: [...state.items, { id: Math.random().toString(), desc, amount }]
      })),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),
    }),
    {
      name: 'verba-privacy-storage', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);