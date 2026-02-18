import { useState } from "react";
import { X } from "lucide-react";

interface StickyNoteProps {
  defaultText: string;
  color: string;
  onRemove?: () => void;
}

const colorMap: Record<string, string> = {
  yellow: "bg-yellow-100 border-yellow-200",
  blue: "bg-blue-100 border-blue-200",
  green: "bg-green-100 border-green-200",
  pink: "bg-pink-100 border-pink-200",
  purple: "bg-purple-100 border-purple-200",
  orange: "bg-orange-100 border-orange-200",
};

export function StickyNote({ defaultText, color, onRemove }: StickyNoteProps) {
  const [text, setText] = useState(defaultText);

  return (
    <div
      className={`relative p-3 rounded-lg border shadow-sm min-h-[80px] transition-shadow hover:shadow-md group ${colorMap[color] || colorMap.yellow}`}
    >
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-transparent resize-none focus:outline-none text-[13px] min-h-[60px]"
        placeholder="Type here..."
      />
    </div>
  );
}

interface StickyNoteGroupProps {
  notes: { text: string; color: string }[];
  columns?: number;
}

export function StickyNoteGroup({ notes: initialNotes, columns = 3 }: StickyNoteGroupProps) {
  const [notes, setNotes] = useState(initialNotes);
  const noteColors = ["yellow", "blue", "green", "pink", "purple", "orange"];

  const addNote = () => {
    const randomColor = noteColors[Math.floor(Math.random() * noteColors.length)];
    setNotes([...notes, { text: "", color: randomColor }]);
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {notes.map((note, i) => (
          <StickyNote
            key={i}
            defaultText={note.text}
            color={note.color}
            onRemove={() => removeNote(i)}
          />
        ))}
      </div>
      <button
        onClick={addNote}
        className="mt-3 px-4 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-[13px]"
      >
        + Add Note
      </button>
    </div>
  );
}
