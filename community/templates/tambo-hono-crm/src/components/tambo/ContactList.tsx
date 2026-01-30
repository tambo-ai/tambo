"use client";

import { User, Mail, Building } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  email: string;
  company?: string;
  notes?: string;
}

interface ContactListProps {
  contacts: Contact[];
  title?: string;
}

export default function ContactList({
  contacts,
  title = "Contacts",
}: ContactListProps) {
  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 max-w-4xl">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>

      {contacts.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No contacts found.</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">
                      {contact.name}
                    </h4>
                    {contact.company && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Building className="h-3 w-3 mr-1" />
                        {contact.company}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                </div>
              </div>

              <button
                onClick={() => handleEmailClick(contact.email)}
                className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
