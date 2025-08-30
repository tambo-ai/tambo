"use client";

import { useState } from "react"; 
import { CLI } from "@/components/cli";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { DemoWrapper } from "../../demo-wrapper";
import { DateTimePicker } from "@tambo-ai/react";


import {
  es,
  fr,
  de,
  ja,
  ko,
  ru,
  hi,
  it,
  ptBR,
  Locale,
} from "date-fns/locale";


export default function DateTimePickerPage() {
  
  const installCommand = "npx tambo add date-time-picker";

  const [date, setDate] = useState<string | null>(new Date().toISOString());
  const [hourCycle, setHourCycle] = useState<'h12' | 'h24'>('h24');
  const [locale, setLocale] = useState<Locale | undefined>(undefined);

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          {/* Title + description */}
          <div>
            <h1 className="text-3xl font-bold mb-4">Date Time Picker</h1>
            <p className="text-lg text-secondary">
              A datetime picker component that outputs ISO 8601 strings.
            </p>
          </div>

          {/* Installation block */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          {/* Demo section */}
          <DemoWrapper title="Interactive Demo">
            {/* 4. Add UI controls to change the state */}
            <div className="flex items-center gap-4 p-4 border-b">
              <button
                className="px-3 py-2 rounded-md bg-gray-200 text-gray-800"
                onClick={() => setHourCycle(hc => (hc === 'h12' ? 'h24' : 'h12'))}
              >
                Toggle Hour Cycle (Now: {hourCycle})
              </button>
              <select
                className="px-3 py-2 rounded-md bg-gray-200 text-gray-800"
                onChange={(e) => {
                      // 3. The onChange handler with logic for all new languages
                      switch (e.target.value) {
                        case 'es': setLocale(es); break;
                        case 'fr': setLocale(fr); break;
                        case 'de': setLocale(de); break;
                        case 'ja': setLocale(ja); break;
                        case 'ko': setLocale(ko); break;
                        case 'ru': setLocale(ru); break;
                        case 'hi': setLocale(hi); break;
                        case 'it': setLocale(it); break;
                        case 'pt-BR': setLocale(ptBR); break;
                        default: setLocale(undefined); break; // English (Default)
                      }
                    }}
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

            {/* The component itself */}
            <div className="flex flex-col gap-4 p-6 bg-muted/20 rounded-lg">
              <DateTimePicker
                // 5. Connect the state to the component's props
                value={date}
                onChange={setDate}
                stepMinutes={5}
                hourCycle={hourCycle}
                locale={locale}
              />
              <div className="mt-4 text-sm text-gray-600">
                <strong>Current ISO Value:</strong> {date || "null"}
              </div>
            </div>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}