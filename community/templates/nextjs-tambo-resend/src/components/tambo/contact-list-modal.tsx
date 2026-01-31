"use client";

import React from "react";
import { X, Plus, Mail, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveContact } from "@/services/save-contact";
import { listContacts } from "@/services/list-contacts";

interface Contact {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

interface ContactListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactListModal = React.forwardRef<
  HTMLDivElement,
  ContactListModalProps
>(({ isOpen, onClose }, ref) => {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newContact, setNewContact] = React.useState({ name: "", email: "" });
  const [error, setError] = React.useState<string | null>(null);

  // Load contacts when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listContacts();
      setContacts(data);
    } catch (err) {
      setError("Failed to load contacts");
      console.error("Error loading contacts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.email) {
      setError("Please fill in all fields");
      return;
    }

    setIsAdding(true);
    setError(null);
    try {
      await saveContact({
        name: newContact.name,
        email: newContact.email,
      });
      setNewContact({ name: "", email: "" });
      await loadContacts();
    } catch (err) {
      setError("Failed to add contact");
      console.error("Error adding contact:", err);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={ref}
        className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Contacts</h2>
            <span className="text-sm text-muted-foreground">
              ({contacts.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-backdrop rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add Contact Form */}
        <div className="border-b border-border p-4 bg-muted/30">
          <h3 className="text-sm font-semibold mb-3">Add New Contact</h3>
          <form onSubmit={handleAddContact} className="flex gap-2">
            <input
              type="text"
              placeholder="Name"
              value={newContact.name}
              onChange={(e) =>
                setNewContact({ ...newContact, name: e.target.value })
              }
              disabled={isAdding}
              className={cn(
                "flex-1 px-3 py-2 rounded-md bg-background border border-border text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                isAdding && "opacity-50 cursor-not-allowed",
              )}
            />
            <input
              type="email"
              placeholder="Email"
              value={newContact.email}
              onChange={(e) =>
                setNewContact({ ...newContact, email: e.target.value })
              }
              disabled={isAdding}
              className={cn(
                "flex-1 px-3 py-2 rounded-md bg-background border border-border text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                isAdding && "opacity-50 cursor-not-allowed",
              )}
            />
            <button
              type="submit"
              disabled={isAdding}
              className={cn(
                "px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium",
                "hover:bg-primary/90 transition-colors flex items-center gap-2",
                isAdding && "opacity-50 cursor-not-allowed",
              )}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading contacts...</div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <div className="text-muted-foreground mb-2">No contacts yet</div>
              <p className="text-sm text-muted-foreground">
                Add a new contact above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {contact.name}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Copy email to clipboard or use it in message
                      navigator.clipboard.writeText(contact.email);
                    }}
                    className="ml-2 p-2 rounded-md hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
                    title="Copy email"
                    aria-label={`Copy ${contact.email}`}
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ContactListModal.displayName = "ContactListModal";
