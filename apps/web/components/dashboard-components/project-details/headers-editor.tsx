"use client";

import { Button } from "@/components/ui/button";
import { DestructiveActionButton } from "@/components/ui/destructive-action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
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
  /** Hides the built-in "Add header" button so the parent can render it externally. */
  hideAddButton?: boolean;
}

interface HeaderRowProps {
  index: number;
  item: HeaderKV;
  isEditing: boolean;
  disabled: boolean;
  onBeginEdit: (rowIndex: number) => void;
  onSaveRow: (rowIndex: number, newItem: HeaderKV) => void;
  onCancelRow: (rowIndex: number) => void;
  onDeleteRow: (rowIndex: number) => void;
}

function HeaderRow({
  index,
  item,
  isEditing,
  disabled,
  onBeginEdit,
  onSaveRow,
  onCancelRow,
  onDeleteRow,
}: HeaderRowProps) {
  const [local, setLocal] = useState(item);
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
    <div className="flex items-center gap-2">
      <Label className="sr-only">Header</Label>
      <Input
        placeholder="Header (e.g., Authorization)"
        value={local.header}
        onChange={(e) => handleChange("header", e.target.value)}
        disabled={disabled && !isEditing}
        className="flex-1"
      />
      <Label className="sr-only">Value</Label>
      <Input
        placeholder="Value"
        value={local.value}
        onChange={(e) => handleChange("value", e.target.value)}
        disabled={disabled && !isEditing}
        className="flex-1"
      />
      {isEditing ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <Button onClick={handleCancel} variant="outline" size="sm">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave} size="sm">
            Save
          </Button>
        </motion.div>
      ) : (
        <DestructiveActionButton
          onClick={() => onDeleteRow(index)}
          disabled={disabled}
          aria-label="Delete header"
        />
      )}
    </div>
  );
}

export function HeadersEditor({
  headers,
  onSave,
  className,
  title,
  hideAddButton,
}: HeadersEditorProps) {
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);
  const [working, setWorking] = useState(headers);

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

  const handleDeleteRow = (rowIndex: number) => {
    const updated = working.filter((_, i) => i !== rowIndex);
    setWorking(updated);
    // Reset activeEditIndex to avoid stale index references after array shifts
    setActiveEditIndex(null);
    onSave(updated);
  };

  return (
    <div className={className}>
      {title && <div className="mb-2 text-sm font-medium">{title}</div>}
      <div className="space-y-3">
        {!hideAddButton && (
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                if (activeEditIndex !== null) return;
                const next = [...working, { header: "", value: "" }];
                setWorking(next);
                setActiveEditIndex(next.length - 1);
              }}
              disabled={activeEditIndex !== null}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add header
            </Button>
          </div>
        )}
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
            onDeleteRow={handleDeleteRow}
          />
        ))}
      </div>
    </div>
  );
}
