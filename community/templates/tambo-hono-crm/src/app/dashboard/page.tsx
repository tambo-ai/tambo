"use client";

import { useState, useEffect } from "react";
import { Search, Users, Building, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Contact {
  id: number;
  name: string;
  email: string;
  company?: string;
  notes?: string;
}

function ContactsTable({ contacts, searchTerm, onSearchChange }: {
  contacts: Contact[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
}) {
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">{contact.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {contact.company ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                      <Building className="h-3 w-3 mr-1" />
                      {contact.company}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {contact.notes || <span className="text-gray-400">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch('/api/contacts')
      .then(res => res.json())
      .then(data => setContacts(data))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              CRM Intelligence
            </Link>
            <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8 hover:shadow-2xl transition-all duration-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Contacts</p>
                <p className="text-3xl font-bold text-gray-900">{contacts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8 hover:shadow-2xl transition-all duration-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Organizations</p>
                <p className="text-3xl font-bold text-gray-900">
                  {new Set(contacts.filter(c => c.company).map(c => c.company)).size}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8 hover:shadow-2xl transition-all duration-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Leads Added Today</p>
                <p className="text-3xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <ContactsTable 
          contacts={contacts} 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
        />
      </div>
    </div>
  );
}