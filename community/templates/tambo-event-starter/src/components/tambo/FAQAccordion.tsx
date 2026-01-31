"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";
import { FAQAccordionProps, FAQ } from "@/types";
import { faqsData } from "@/lib/mock-data";

const FAQItem: React.FC<{ faq: FAQ; isOpen: boolean; onToggle: () => void; index: number }> = ({
  faq,
  isOpen,
  onToggle,
  index,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-gray-100 dark:border-gray-800 last:border-0"
    >
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-start justify-between gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg px-2 -mx-2"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {index + 1}
            </span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            {faq.question}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-indigo-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-11 pr-4">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {faq.answer}
              </p>
              {faq.category && (
                <Badge variant="default" size="sm" className="mt-3">
                  {faq.category}
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  category,
}) => {
  const [openIds, setOpenIds] = useState<string[]>([]);

  // Use mock data directly
  const faqs = faqsData;

  const filteredFaqs = category
    ? faqs.filter((f: FAQ) => f.category?.toLowerCase() === category.toLowerCase())
    : faqs;

  const toggleFaq = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const categories = [...new Set(faqs.map((f: FAQ) => f.category).filter(Boolean))] as string[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">
                Frequently Asked Questions
              </h3>
              <p className="text-amber-100 text-sm">
                {filteredFaqs.length} questions answered
                {category && ` in ${category}`}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Category Filter */}
          {categories.length > 1 && !category && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge
                variant="primary"
                size="md"
                className="cursor-pointer"
              >
                All
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant="default"
                  size="md"
                  className="cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No FAQs found{category && ` for "${category}"`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredFaqs.map((faq: FAQ, index: number) => (
                <FAQItem
                  key={faq.id}
                  faq={faq}
                  isOpen={openIds.includes(faq.id)}
                  onToggle={() => toggleFaq(faq.id)}
                  index={index}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FAQAccordion;
