"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface HeaderKV {
  header: string;
  value: string;
}

interface HeadersEditorProps {
  headers: HeaderKV[];
  onSave: (headers: HeaderKV[]) => void;
  className?: string;
  title?: string;
}

interface HeaderRowProps {
  index: number;
  item: HeaderKV;
  isEditing: boolean;
  disabled: boolean;
  onBeginEdit: (rowIndex: number) => void;
  onSaveRow: (rowIndex: number, newItem: HeaderKV) => void;
  onCancelRow: (rowIndex: number) => void;
}

function HeaderRow({
  index,
  item,
  isEditing,
  disabled,
  onBeginEdit,
  onSaveRow,
  onCancelRow,
}: HeaderRowProps) {
  const [local, setLocal] = useState<HeaderKV>(item);
  const [touched, setTouched] = useState(false);

  const trimmedHeader = useMemo(() => local.header.trim(), [local.header]);
  const trimmedValue = useMemo(() => local.value.trim(), [local.value]);
  const canSave = useMemo(
    () => Boolean(trimmedHeader) && Boolean(trimmedValue) && touched,
    [trimmedHeader, trimmedValue, touched],
  );

  const handleChange = (field: keyof HeaderKV, value: string) => {
    if (!isEditing) onBeginEdit(index);
    setLocal((prev) => ({ ...prev, [field]: value }));
    setTouched(true);
  };

  const handleSave = () => {
    if (!canSave) return;
    onSaveRow(index, { header: trimmedHeader, value: trimmedValue });
  };

  const handleCancel = () => {
    setLocal(item);
    setTouched(false);
    onCancelRow(index);
  };

  return (
    <div className="grid grid-cols-[40%_60%] gap-3 items-start">
      <div className="space-y-1">
        <Label className="sr-only">Header</Label>
        <Input
          placeholder="Header (e.g., Authorization)"
          value={local.header}
          onChange={(e) => handleChange("header", e.target.value)}
          disabled={disabled && !isEditing}
        />
      </div>
      <div className="space-y-1">
        <Label className="sr-only">Value</Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Value"
            value={local.value}
            onChange={(e) => handleChange("value", e.target.value)}
            disabled={disabled && !isEditing}
            className="flex-1"
          />
          {isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1"
            >
              <Button
                onClick={handleSave}
                disabled={!canSave}
                size="icon"
                aria-label="Save header"
                title="Save"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="icon"
                aria-label="Cancel editing"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HeadersEditor({
  headers,
  onSave,
  className,
  title,
}: HeadersEditorProps) {
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);
  const [working, setWorking] = useState<HeaderKV[]>(headers);

  // Keep local working copy in sync with parent when not actively editing
  useEffect(() => {
    if (activeEditIndex === null) {
      setWorking(headers);
    }
  }, [headers, activeEditIndex]);

  const handleBeginEdit = (rowIndex: number) => {
    setActiveEditIndex(rowIndex);
  };

  const handleSaveRow = (rowIndex: number, newItem: HeaderKV) => {
    const updated = working.map((h, i) => (i === rowIndex ? newItem : h));
    setWorking(updated);
    setActiveEditIndex(null);
    onSave(updated);
  };

  const handleCancelRow = () => {
    // Revert the working state for the cancelled row to the last saved headers
    setWorking(headers);
    setActiveEditIndex(null);
  };

  return (
    <div className={className}>
      {title && <div className="mb-2 text-sm font-medium">{title}</div>}
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeEditIndex !== null) return;
              const next = [...working, { header: "", value: "" }];
              setWorking(next);
              setActiveEditIndex(next.length - 1);
            }}
            disabled={activeEditIndex !== null}
          >
            Add header
          </Button>
        </div>
        {working.map((kv, idx) => (
          <HeaderRow
            key={`${idx}-${kv.header}`}
            index={idx}
            item={kv}
            isEditing={activeEditIndex === idx}
            disabled={activeEditIndex !== null && activeEditIndex !== idx}
            onBeginEdit={handleBeginEdit}
            onSaveRow={handleSaveRow}
            onCancelRow={handleCancelRow}
          />
        ))}
      </div>
    </div>
  );
}
