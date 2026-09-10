import type { AiMode } from "../../services/ai.service";

type AIModeSelectorProps = {
  mode: AiMode;
  onChange: (mode: AiMode) => void;
};

const modes: Array<{ value: AiMode; icon: string; label: string }> = [
  { value: "chat", icon: "💬", label: "Chat" },
  { value: "generate", icon: "🖼️", label: "Tạo ảnh" },
  { value: "edit", icon: "✏️", label: "Sửa ảnh" },
  { value: "enhance", icon: "✨", label: "Nâng cấp" },
];

export function AIModeSelector({ mode, onChange }: AIModeSelectorProps) {
  return (
    <div className="ai-mode-selector" aria-label="Chọn chế độ AI">
      {modes.map((item) => (
        <button
          className={`ai-mode-button ${mode === item.value ? "active" : ""}`}
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
