import { useState } from "react";
import { X, Plus } from "lucide-react";

interface EditableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  className?: string;
  itemClassName?: string;
}

export function EditableList({
  items,
  onChange,
  placeholder = "Type here...",
  addLabel = "+ Add item",
  className = "",
  itemClassName = "",
}: EditableListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, ""]);
    setTimeout(() => setEditingIndex(items.length), 50);
  };

  return (
    <div className={className}>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="group flex items-start gap-1.5">
            <div className={`flex-1 min-w-0 ${itemClassName}`}>
              {editingIndex === i ? (
                <input
                  autoFocus
                  value={item}
                  onChange={(e) => updateItem(i, e.target.value)}
                  onBlur={() => setEditingIndex(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingIndex(null);
                  }}
                  placeholder={placeholder}
                  className="w-full bg-transparent border border-primary/20 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:border-primary/40"
                />
              ) : (
                <div
                  onClick={() => setEditingIndex(i)}
                  className="px-3 py-1.5 rounded-lg text-[13px] cursor-pointer border border-transparent hover:border-primary/10 hover:bg-primary/[0.02] transition-all"
                >
                  {item || (
                    <span className="text-muted-foreground/50 italic">
                      {placeholder}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => removeItem(i)}
              className="mt-1.5 p-1 rounded-md text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
              title="Remove"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all text-[12px]"
      >
        <Plus className="w-3 h-3" />
        {addLabel}
      </button>
    </div>
  );
}
