import { useState, useRef, useEffect } from "react";

interface EditableFieldProps {
  defaultValue: string;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  label?: string;
}

export function EditableField({
  defaultValue,
  placeholder = "Click to edit...",
  className = "",
  multiline = false,
  label,
}: EditableFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus();
      } else if (!multiline && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

  if (isEditing && multiline) {
    return (
      <div>
        {label && (
          <label className="block text-[13px] text-muted-foreground mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setIsEditing(false)}
          placeholder={placeholder}
          className={`w-full bg-transparent border border-primary/20 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-primary/40 min-h-[60px] ${className}`}
          rows={3}
        />
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        {label && (
          <label className="block text-[13px] text-muted-foreground mb-1">
            {label}
          </label>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
          placeholder={placeholder}
          className={`w-full bg-transparent border border-primary/20 rounded-lg px-3 py-2 focus:outline-none focus:border-primary/40 ${className}`}
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer group"
    >
      {label && (
        <label className="block text-[13px] text-muted-foreground mb-1 pointer-events-none">
          {label}
        </label>
      )}
      <div
        className={`px-3 py-2 rounded-lg border border-transparent group-hover:border-primary/10 group-hover:bg-primary/[0.02] transition-all whitespace-pre-wrap ${className}`}
      >
        {value || (
          <span className="text-muted-foreground/50 italic">{placeholder}</span>
        )}
      </div>
    </div>
  );
}
