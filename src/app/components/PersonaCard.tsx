import { useState } from "react";
import { X, Plus } from "lucide-react";

interface PersonaCardProps {
  name: string;
  role: string;
  age: string;
  bio: string;
  goals: string[];
  painPoints: string[];
  avatar: string;
  onRemove?: () => void;
}

export function PersonaCard({
  name: defaultName,
  role: defaultRole,
  age: defaultAge,
  bio: defaultBio,
  goals: defaultGoals,
  painPoints: defaultPainPoints,
  avatar,
  onRemove,
}: PersonaCardProps) {
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState(defaultRole);
  const [age, setAge] = useState(defaultAge);
  const [bio, setBio] = useState(defaultBio);
  const [goals, setGoals] = useState(defaultGoals);
  const [painPoints, setPainPoints] = useState(defaultPainPoints);

  const updateListItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  };

  const removeListItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  return (
    <div className="relative bg-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group/card">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-border shadow-sm flex items-center justify-center opacity-0 group-hover/card:opacity-100 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all z-10"
          title="Remove persona"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white shrink-0">
          <span className="text-[20px]">{avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent focus:outline-none w-full text-[16px]"
            style={{ fontWeight: 500 }}
          />
          <div className="flex gap-2 mt-0.5">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-transparent focus:outline-none text-muted-foreground text-[13px] flex-1"
            />
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="bg-transparent focus:outline-none text-muted-foreground text-[13px] w-16 text-right"
            />
          </div>
        </div>
      </div>

      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-[13px] resize-none focus:outline-none mb-4 min-h-[50px]"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-[12px] text-green-600 tracking-wider uppercase mb-2">
            Goals
          </h4>
          {goals.map((goal, i) => (
            <div key={i} className="flex items-start gap-1.5 mb-1 group/item">
              <span className="text-green-500 mt-0.5 text-[12px]">+</span>
              <input
                value={goal}
                onChange={(e) =>
                  updateListItem(goals, setGoals, i, e.target.value)
                }
                className="bg-transparent focus:outline-none text-[13px] flex-1"
              />
              <button
                onClick={() => removeListItem(goals, setGoals, i)}
                className="mt-0.5 opacity-0 group-hover/item:opacity-100 text-muted-foreground/40 hover:text-red-500 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setGoals([...goals, ""])}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-green-600 mt-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add goal
          </button>
        </div>
        <div>
          <h4 className="text-[12px] text-red-500 tracking-wider uppercase mb-2">
            Pain Points
          </h4>
          {painPoints.map((point, i) => (
            <div key={i} className="flex items-start gap-1.5 mb-1 group/item">
              <span className="text-red-400 mt-0.5 text-[12px]">-</span>
              <input
                value={point}
                onChange={(e) =>
                  updateListItem(painPoints, setPainPoints, i, e.target.value)
                }
                className="bg-transparent focus:outline-none text-[13px] flex-1"
              />
              <button
                onClick={() =>
                  removeListItem(painPoints, setPainPoints, i)
                }
                className="mt-0.5 opacity-0 group-hover/item:opacity-100 text-muted-foreground/40 hover:text-red-500 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setPainPoints([...painPoints, ""])}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-500 mt-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add pain point
          </button>
        </div>
      </div>
    </div>
  );
}
