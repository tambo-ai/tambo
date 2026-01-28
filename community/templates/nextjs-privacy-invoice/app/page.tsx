"use client";

import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { useState } from 'react';

export default function Home() {
  const { 
    clientName, 
    setClientName, 
    items, 
    setItems, 
    totalAmount, 
    setTotal,
    saveToCloud, 
    isSaving 
  } = useInvoiceStore();

  const [newItem, setNewItem] = useState({ description: '', quantity: 1, price: 0 });

  const addItem = () => {
    if (!newItem.description) return; 
    const updatedItems = [...items, { ...newItem, id: Date.now().toString() }];
    setItems(updatedItems);
    
    // Auto-calculate total
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    setTotal(newTotal);
    
    setNewItem({ description: '', quantity: 1, price: 0 }); 
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center text-gray-900">
      <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-md">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">🧾 Privacy Invoice</h1>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Full-Stack Mode
          </span>
        </div>

        {/* Client Details */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
          <input 
            type="text" 
            placeholder="e.g. Acme Corp"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
          />
        </div>

        {/* Item List */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Items</h3>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between border-b py-2 text-sm text-gray-700">
              <span>{item.description} (x{item.quantity})</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          
          {/* Add Item Form */}
          <div className="flex gap-2 mt-4 bg-gray-100 p-4 rounded">
            <input 
              placeholder="Description" 
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              className="border p-2 rounded flex-grow text-gray-900 bg-white"
            />
            <input 
              type="number" 
              placeholder="Qty" 
              value={newItem.quantity}
              onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
              className="border p-2 rounded w-16 text-gray-900 bg-white"
            />
            <input 
              type="number" 
              placeholder="Price" 
              value={newItem.price}
              onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
              className="border p-2 rounded w-24 text-gray-900 bg-white"
            />
            <button 
              onClick={addItem}
              className="bg-gray-800 text-white px-4 rounded hover:bg-black"
            >
              Add
            </button>
          </div>
        </div>

        {/* Total & Actions */}
        <div className="flex justify-between items-end mt-8 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-4xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
          </div>

          <div className="flex gap-3">
            {/* UPDATED BUTTON: Calls window.print() */}
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            >
              Download PDF
            </button>

            <button 
              onClick={saveToCloud}
              disabled={isSaving}
              className={`
                px-6 py-2 rounded text-white font-medium flex items-center gap-2
                ${isSaving ? 'bg-green-800 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
              `}
            >
              {isSaving ? (
                <>🔄 Syncing...</>
              ) : (
                <>☁️ Save to Cloud</>
              )}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}