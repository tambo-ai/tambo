"use client";

import { useState, useEffect } from "react";
import { CLI } from "@/components/cli";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { DateTimePicker } from "@tambo-ai/react";
import { addDays, addWeeks, isValid } from "date-fns";
import { es, fr, de, ja, ko, ru, hi, it, ptBR, Locale } from "date-fns/locale";

const localeMap: { [key: string]: Locale } = {
  es,
  fr,
  de,
  ja,
  ko,
  ru,
  hi,
  it,
  "pt-BR": ptBR,
};

function parseNaturalDate(text: string): Date | null {
  const now = new Date();
  const lowerText = text.toLowerCase().trim();

  if (lowerText === "yesterday") return addDays(now, -1);
  if (lowerText === "tomorrow") return addDays(now, 1);
  if (lowerText === "today") return now;
  if (lowerText === "next week") return addWeeks(now, 1);

  const weeksMatch = lowerText.match(/(\d+)\s+weeks?/);
  if (weeksMatch?.[1]) return addWeeks(now, parseInt(weeksMatch[1], 10));

  const daysMatch = lowerText.match(/(\d+)\s+days?/);
  if (daysMatch?.[1]) return addDays(now, parseInt(daysMatch[1], 10));

  const parsedDate = new Date(lowerText);
  if (isValid(parsedDate)) return parsedDate;

  return null;
}

export default function DateTimePickerPage() {
  const installCommand = "npx tambo add date-time-picker";

  // 🔥 default to current date + time
  const [date, setDate] = useState<string | null>(new Date().toISOString());
  const [hourCycle, setHourCycle] = useState<"h12" | "h24">("h24");
  const [locale, setLocale] = useState<Locale | undefined>(undefined);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");

  useEffect(() => {
    setDate(new Date().toISOString());
  }, []);

  // natural language parsing
  useEffect(() => {
    if (!naturalLanguageInput) return;
    const parsedDate = parseNaturalDate(naturalLanguageInput);
    if (parsedDate) {
      setDate(parsedDate.toISOString());
    }
  }, [naturalLanguageInput]);

  useEffect(() => {
    function handleFocusIntoCalendar() {
      requestAnimationFrame(() => {
        const activeDay = document.querySelector(
          '[role="gridcell"][aria-selected="true"]',
        ) as HTMLElement | null;
        if (activeDay) {
          activeDay.focus();
        }
      });
    }

    // watch clicks/focus on the input that opens the calendar
    const pickerInput = document.querySelector(
      "input[placeholder]",
    ) as HTMLElement | null;

    pickerInput?.addEventListener("focus", handleFocusIntoCalendar);
    pickerInput?.addEventListener("click", handleFocusIntoCalendar);

    return () => {
      pickerInput?.removeEventListener("focus", handleFocusIntoCalendar);
      pickerInput?.removeEventListener("click", handleFocusIntoCalendar);
    };
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="py-12 md:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ShowcaseThemeProvider defaultTheme="light">
          <div className="flex flex-col gap-12">
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Date Time Picker
              </h1>
              <p className="text-lg text-slate-600 max-w-3xl">
                A customizable and accessible datetime picker with natural
                language, locales, 12/24h cycle, and ISO output.
              </p>
            </div>

            {/* Installation */}
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Installation
              </h2>
              <CLI command={installCommand} />
            </div>

            {/* Example Prompt */}
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Example Prompt
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <label
                  htmlFor="natural-input"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Try natural language input:
                </label>
                <input
                  id="natural-input"
                  type="text"
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  placeholder="e.g. 'tomorrow' or 'in 30 days'..."
                  className="w-full px-3 py-2 rounded-md border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Options */}
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Options
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row gap-6">
                {/* Hour Cycle */}
                <div>
                  <label
                    htmlFor="hour-cycle-toggle"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Hour Cycle
                  </label>
                  <button
                    id="hour-cycle-toggle"
                    className="w-full px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() =>
                      setHourCycle((hc) => (hc === "h12" ? "h24" : "h12"))
                    }
                  >
                    Now: {hourCycle.toUpperCase()}
                  </button>
                </div>

                {/* Locale */}
                <div>
                  <label
                    htmlFor="locale-select"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Locale
                  </label>
                  <select
                    id="locale-select"
                    className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      setLocale(localeMap[e.target.value] || undefined)
                    }
                  >
                    <option value="en">English (Default)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="ru">Russian</option>
                    <option value="hi">Hindi</option>
                    <option value="it">Italian</option>
                    <option value="pt-BR">Portuguese (Brazil)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Preview
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-6">
                <DateTimePicker
                  value={date}
                  onChange={setDate}
                  stepMinutes={5}
                  hourCycle={hourCycle}
                  locale={locale}
                />

                <div className="mt-4 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md border border-slate-200 shadow-sm w-full">
                  <strong>Current ISO Value:</strong>{" "}
                  <code className="font-mono text-blue-600">
                    {date || "null"}
                  </code>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  ⌨️ Use Arrow keys to move, Enter to select.
                </p>
              </div>
            </div>
          </div>
        </ShowcaseThemeProvider>
      </div>
    </div>
  );
}
