import { useState } from "react";
import { X, Plus, Square, CheckSquare } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  title?: string;
  addLabel?: string;
  accentColor?: string;
}

export function Checklist({
  items,
  onChange,
  title,
  addLabel = "+ Add item",
  accentColor = "text-purple-600",
}: ChecklistProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const updateText = (id: string, text: string) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const addItem = () => {
    const newId = `item-${Date.now()}`;
    onChange([...items, { id: newId, text: "", checked: false }]);
    setTimeout(() => setEditingId(newId), 50);
  };

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h4 className={`text-[13px] ${accentColor}`}>{title}</h4>
          <span className="text-[11px] text-muted-foreground">
            {checkedCount}/{items.length} finalized
          </span>
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all ${
              item.checked ? "bg-secondary/30" : "hover:bg-secondary/20"
            }`}
          >
            <button
              onClick={() => toggleItem(item.id)}
              className={`shrink-0 transition-colors ${
                item.checked ? accentColor : "text-muted-foreground/40"
              }`}
            >
              {item.checked ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={item.text}
                  onChange={(e) => updateText(item.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingId(null);
                  }}
                  placeholder="Type screen or flow name..."
                  className="w-full bg-transparent border-b border-primary/20 px-1 py-0.5 text-[13px] focus:outline-none focus:border-primary/40"
                />
              ) : (
                <span
                  onClick={() => setEditingId(item.id)}
                  className={`text-[13px] cursor-pointer block px-1 py-0.5 ${
                    item.checked
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {item.text || (
                    <span className="text-muted-foreground/40 italic">
                      Click to name...
                    </span>
                  )}
                </span>
              )}
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="p-1 rounded-md text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
              title="Remove"
            >
              <X className="w-3 h-3" />
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
