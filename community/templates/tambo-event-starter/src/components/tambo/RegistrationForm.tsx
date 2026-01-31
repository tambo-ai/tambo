"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Building, Ticket, Check, Sparkles } from "lucide-react";
import { Card, CardContent, Button, Input, Badge } from "@/components/ui";
import { RegistrationFormProps, TicketType } from "@/types";
import { eventData } from "@/lib/mock-data";

interface FormData {
  name: string;
  email: string;
  company: string;
  ticketType: TicketType;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = (props) => {
  // Use props if provided, otherwise fall back to event data
  const eventName = props.eventName || eventData.name;
  const ticketTypes = eventData.tickets; // Always use mock data for tickets
  const prefilledName = props.prefilledName || "";
  const prefilledEmail = props.prefilledEmail || "";

  const [formData, setFormData] = useState<FormData>({
    name: prefilledName,
    email: prefilledEmail,
    company: "",
    ticketType: "general" as TicketType,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const selectedTicket = ticketTypes.find((t) => t.type === formData.ticketType);

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="gradient" className="text-center p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🎉 Registration Successful!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Welcome to {eventName}, {formData.name}!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            A confirmation email has been sent to {formData.email}
          </p>
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
              Your ticket: {selectedTicket?.name || formData.ticketType}
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Register for {eventName}</h3>
              <p className="text-indigo-100 text-sm">Secure your spot today!</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
              required
              leftIcon={<User className="w-5 h-5" />}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
              required
              leftIcon={<Mail className="w-5 h-5" />}
            />

            <Input
              label="Company / Organization"
              placeholder="Optional"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              leftIcon={<Building className="w-5 h-5" />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Ticket className="w-4 h-4 inline mr-2" />
                Ticket Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ticketTypes.map((ticket) => (
                  <motion.div
                    key={ticket.type}
                    whileHover={{ scale: ticket.available ? 1.02 : 1 }}
                    whileTap={{ scale: ticket.available ? 0.98 : 1 }}
                    onClick={() => ticket.available && handleChange("ticketType", ticket.type)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.ticketType === ticket.type
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                        : ticket.available
                        ? "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                        : "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {formData.ticketType === ticket.type && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-5 h-5 text-indigo-500" />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {ticket.name}
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {ticket.price === 0 ? "FREE" : `$${ticket.price}`}
                      </span>
                    </div>
                    {!ticket.available && (
                      <Badge variant="danger" size="sm">Sold Out</Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "Registering..." : "Complete Registration"}
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              By registering, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RegistrationForm;
