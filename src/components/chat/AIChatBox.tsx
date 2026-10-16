import {
  Bot,
  Check,
  Copy,
  ImagePlus,
  Loader2,
  Maximize2,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";

import { AIImageUpload } from "./AIImageUpload";
import { AIModeSelector } from "./AIModeSelector";
import { AIResultPreview } from "./AIResultPreview";
import {
  editAiImage,
  enhanceAiImage,
  generateAiImage,
  sendAiChat,
  type AiChatRequestMode,
  type AiEnhanceAction,
  type AiMode,
  type AiPromptPlan,
  type AiRatio,
} from "../../services/ai.service";
import "../../styles/chat/aiChat.css";

type ChatSide = "left" | "right";
type DragTarget = "toggle" | "window";
type AiMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  imageUrl?: string;
  promptPlan?: AiPromptPlan;
  responseMode?: string;
  language?: string;
};
type PreviewContent = {
  title: string;
  text?: string;
  imageUrl?: string;
  promptDisplay?: PromptDisplay;
};
type AiPromptPlanDisplay = AiPromptPlan & {
  summary?: string;
  imagePrompt?: string;
  canUseForCreate?: boolean;
  missingFields?: string[];
  locale?: string;
};
type PromptSummaryFieldKey = "eventName" | "organization" | "theme" | "audience" | "style" | "colors";
type PromptLocale = "vi" | "en";
type PromptDisplay = {
  summary: string;
  fields: Array<{ key: PromptSummaryFieldKey; value: string }>;
  missingFields: PromptSummaryFieldKey[];
  imagePrompt: string;
  negativePrompt: string;
  canUseForCreate: boolean;
  locale: PromptLocale;
};

const EDGE_GAP = 24;
const TOGGLE_SIZE = 52;
const CHAT_WIDTH = 460;
const IMAGE_PROMPT_PREFIX = "🎨 Tạo mẫu ảnh\n";
const RATIOS: AiRatio[] = ["1:1", "16:9", "9:16"];
const RATIO_LABELS: Record<AiRatio, string> = {
  "1:1": "1:1 (ảnh vuông/bài đăng)",
  "16:9": "16:9 (banner/cover)",
  "9:16": "9:16 (poster/story)",
};
const STYLES = ["Tự nhiên", "Hiện đại", "Sang trọng", "Tối giản", "Rực rỡ"];
const PROMPT_SUMMARY_FIELD_KEYS: PromptSummaryFieldKey[] = [
  "eventName",
  "organization",
  "theme",
  "audience",
  "style",
  "colors",
];
const PROMPT_FIELD_LABELS: Record<PromptLocale, Record<PromptSummaryFieldKey, string>> = {
  vi: {
    eventName: "Tên sự kiện",
    organization: "Đơn vị tổ chức",
    theme: "Chủ đề chính",
    audience: "Đối tượng tham gia",
    style: "Phong cách",
    colors: "Màu chủ đạo",
  },
  en: {
    eventName: "Event name",
    organization: "Organization",
    theme: "Theme",
    audience: "Target audience",
    style: "Style",
    colors: "Colors",
  },
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getErrorMessage(error: any) {
  const message = error?.response?.data?.message || error?.message;
  return Array.isArray(message) ? message[0] : message || "AI xử lý thất bại.";
}

function formatMessageText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizePromptLocale(value?: string): PromptLocale {
  return value?.toLowerCase().startsWith("en") ? "en" : "vi";
}

function isPromptSummaryFieldKey(value: string): value is PromptSummaryFieldKey {
  return PROMPT_SUMMARY_FIELD_KEYS.includes(value as PromptSummaryFieldKey);
}

function getPromptDisplay(message: AiMessage) {
  const isPromptReady = message.responseMode === "image_prompt_ready" || Boolean(message.promptPlan?.imagePrompt);
  if (!isPromptReady) return null;

  const plan = message.promptPlan as AiPromptPlanDisplay;
  const locale = normalizePromptLocale(plan.locale || plan.language || message.language);
  const summary = (plan.summary || "").trim();
  const imagePrompt = (plan.imagePrompt || plan.generatedPrompt || "").trim();
  if (!imagePrompt) return null;

  const negativePrompt = (plan.negativePrompt || "").trim();
  const canUseForCreate = plan.canUseForCreate !== false && imagePrompt.length > 0;
  const fieldValues: Record<PromptSummaryFieldKey, string> = {
    eventName: plan.eventName || "",
    organization: plan.organization || "",
    theme: plan.theme || "",
    audience: plan.audience || "",
    style: plan.style || "",
    colors: (plan.colors || []).join(", "),
  };
  const fields = PROMPT_SUMMARY_FIELD_KEYS.map((key) => ({
    key,
    value: fieldValues[key].trim(),
  })).filter((item) => item.value);
  const missingFields = (plan.missingFields || []).filter(isPromptSummaryFieldKey);

  return {
    summary,
    fields,
    missingFields,
    imagePrompt,
    negativePrompt,
    canUseForCreate,
    locale,
  };
}

function getPromptCopyText(display: PromptDisplay) {
  return [
    display.imagePrompt,
    display.negativePrompt ? `Negative Prompt:\n${display.negativePrompt}` : "",
  ].filter(Boolean).join("\n\n");
}

function getPromptFieldLabel(key: PromptSummaryFieldKey, locale: PromptLocale) {
  return PROMPT_FIELD_LABELS[locale][key];
}

type AIImagePromptResultCardProps = {
  display: PromptDisplay;
  copiedKey: string | null;
  copyKeys: {
    prompt: string;
  };
  onCopyPrompt: () => void;
  onUsePrompt: () => void;
};

type AIImagePromptCardProps = {
  title: string;
  prompt: string;
  negativeTitle: string;
  negativePrompt: string;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  useLabel: string;
  canUseForCreate: boolean;
  onCopyPrompt: () => void;
  onUsePrompt: () => void;
};

function AIImagePromptCard({
  title,
  prompt,
  negativeTitle,
  negativePrompt,
  copied,
  copyLabel,
  copiedLabel,
  useLabel,
  canUseForCreate,
  onCopyPrompt,
  onUsePrompt,
}: AIImagePromptCardProps) {
  return (
    <section className="ai-image-prompt-section ai-image-prompt-main">
      <div className="ai-image-prompt-block">
        <div className="ai-image-prompt-block__toolbar">
          <span>{title}</span>
          <button type="button" aria-label={copyLabel} onClick={onCopyPrompt}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? copiedLabel : copyLabel}
          </button>
        </div>
        <pre className="ai-image-prompt-box">{prompt}</pre>
        {negativePrompt && (
          <div className="ai-image-prompt-negative-inline">
            <span>{negativeTitle}</span>
            <p>{negativePrompt}</p>
          </div>
        )}
      </div>
      <div className="ai-image-prompt-actions">
        <button
          type="button"
          className="is-primary"
          aria-label={useLabel}
          disabled={!canUseForCreate}
          onClick={onUsePrompt}
        >
          {useLabel}
        </button>
      </div>
    </section>
  );
}

function AIImagePromptResultCard({
  display,
  copiedKey,
  copyKeys,
  onCopyPrompt,
  onUsePrompt,
}: AIImagePromptResultCardProps) {
  const isVietnamese = display.locale === "vi";
  const labels = {
    summaryTitle: isVietnamese ? "Tóm tắt thông tin" : "Summary",
    promptTitle: isVietnamese ? "Prompt dùng cho Tạo ảnh" : "Prompt for Create",
    negativeTitle: "Negative Prompt",
    missingTitle: isVietnamese ? "Cần bổ sung" : "Missing information",
    copyPrompt: isVietnamese ? "Sao chép nội dung" : "Copy content",
    copiedPrompt: isVietnamese ? "Đã sao chép" : "Copied",
    usePrompt: isVietnamese ? "Dùng trong Tạo ảnh" : "Use in Create",
  };

  return (
    <article className="ai-image-prompt-card">
      <section className="ai-image-prompt-section ai-image-prompt-summary">
        <div className="ai-image-prompt-section__header">
          <h4>{labels.summaryTitle}</h4>
        </div>
        {display.summary && <p className="ai-image-prompt-summary-text">{display.summary}</p>}
        {display.fields.length > 0 && (
          <dl className="ai-image-prompt-details">
            {display.fields.map((item) => (
              <div key={item.key}>
                <dt>{getPromptFieldLabel(item.key, display.locale)}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {display.missingFields.length > 0 && (
          <div className="ai-image-prompt-missing">
            <strong>{labels.missingTitle}</strong>
            <ul>
              {display.missingFields.map((field) => (
                <li key={field}>{getPromptFieldLabel(field, display.locale)}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <AIImagePromptCard
        title={labels.promptTitle}
        prompt={display.imagePrompt}
        negativeTitle={labels.negativeTitle}
        negativePrompt={display.negativePrompt}
        copied={copiedKey === copyKeys.prompt}
        copyLabel={labels.copyPrompt}
        copiedLabel={labels.copiedPrompt}
        useLabel={labels.usePrompt}
        canUseForCreate={display.canUseForCreate}
        onCopyPrompt={onCopyPrompt}
        onUsePrompt={onUsePrompt}
      />
    </article>
  );
}

export default function AICreativeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatTop, setChatTop] = useState(0);
  const [chatSide, setChatSide] = useState<ChatSide>("right");
  const [mode, setMode] = useState<AiMode>("chat");
  const [chatRequestMode, setChatRequestMode] = useState<AiChatRequestMode>("chat");
  const [isChatModeMenuOpen, setIsChatModeMenuOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<AiRatio>("1:1");
  const [style, setStyle] = useState(STYLES[0]);
  const [enhanceAction, setEnhanceAction] = useState<AiEnhanceAction>("upscale");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [reusedImageUrl, setReusedImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: createId(),
      role: "assistant",
      text: "Chat AI dùng để lên ý tưởng, hỏi thông tin event và chuẩn bị prompt. Create Image dùng để render ảnh từ prompt đã chốt.",
    },
  ]);
  const chatSideRef = useRef<ChatSide>("right");
  const chatTopRef = useRef(0);
  const chatLeftRef = useRef(0);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const dragTargetRef = useRef<DragTarget>("toggle");
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartLeftRef = useRef(0);
  const dragStartTopRef = useRef(0);
  const suppressClickRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const inputValue =
    mode === "chat" && chatRequestMode === "image_prompt_builder"
      ? `${IMAGE_PROMPT_PREFIX}${prompt}`
      : prompt;

  const getChatWidth = () => Math.min(CHAT_WIDTH, window.innerWidth - 32);

  const getSnappedLeft = useCallback((side: ChatSide, target: DragTarget) => {
    const targetWidth = target === "window" ? getChatWidth() : TOGGLE_SIZE;
    return side === "left"
      ? EDGE_GAP
      : window.innerWidth - targetWidth - EDGE_GAP;
  }, []);

  const applyChatPosition = useCallback(
    (side: ChatSide, top: number, target: DragTarget = "toggle") => {
      const toggleLeft = getSnappedLeft(side, "toggle");
      const windowLeft = getSnappedLeft(side, "window");

      chatLeftRef.current = getSnappedLeft(side, target);
      document.documentElement.style.setProperty("--ai-chat-top", `${top}px`);
      document.documentElement.style.setProperty("--ai-chat-toggle-left", `${toggleLeft}px`);
      document.documentElement.style.setProperty("--ai-chat-window-left", `${windowLeft}px`);
    },
    [getSnappedLeft],
  );

  const addMessage = useCallback((message: Omit<AiMessage, "id">) => {
    setMessages((current) => [...current, { ...message, id: createId() }]);
  }, []);

  const handleCopyText = useCallback(async (
    value: string,
    key: string,
    errorMessage = "Không thể copy nội dung.",
    successMessage = "",
  ) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedMessageId(key);
      if (successMessage) toast.success(successMessage);
      window.setTimeout(() => {
        setCopiedMessageId((current) => (current === key ? null : current));
      }, 1400);
    } catch {
      toast.error(errorMessage);
    }
  }, []);

  const handleCopyMessage = useCallback((message: AiMessage) => {
    handleCopyText(message.text.trim(), message.id, "Không thể copy nội dung AI.");
  }, [handleCopyText]);

  const handleCopyPrompt = useCallback((message: AiMessage) => {
    const promptDisplay = getPromptDisplay(message);
    const successMessage = promptDisplay?.locale === "en" ? "Prompt copied" : "Đã sao chép prompt";
    handleCopyText(promptDisplay ? getPromptCopyText(promptDisplay) : "", `prompt-${message.id}`, "Không thể copy prompt.", successMessage);
  }, [handleCopyText]);

  const addUserMessage = useCallback(
    (text: string, file?: File | null, remoteImageUrl = "") => {
      if (remoteImageUrl) {
        addMessage({ role: "user", text, imageUrl: remoteImageUrl });
        return;
      }

      if (!file) {
        addMessage({ role: "user", text });
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(imageUrl);
      addMessage({ role: "user", text, imageUrl });
    },
    [addMessage],
  );

  const handleUseDisplayPromptInCreate = useCallback((display: PromptDisplay) => {
    const imagePrompt = display.imagePrompt;
    if (!imagePrompt) return;

    setMode("generate");
    setPrompt(imagePrompt);
    setProgressText("");
    addMessage({
      role: "assistant",
      text: "Đã đưa prompt vào Create Image. Bạn có thể chỉnh lại prompt rồi bấm gửi để render ảnh.",
    });
  }, [addMessage]);

  const handleUsePromptInCreate = useCallback((message: AiMessage) => {
    const promptDisplay = getPromptDisplay(message);
    if (!promptDisplay) return;
    handleUseDisplayPromptInCreate(promptDisplay);
  }, [handleUseDisplayPromptInCreate]);

  const resetPromptAfterSend = () => {
    setPrompt("");
    if (mode === "edit" || mode === "enhance") {
      setImageFile(null);
      setReusedImageUrl("");
    }
  };

  const handleModeChange = (nextMode: AiMode) => {
    setMode(nextMode);
    setIsChatModeMenuOpen(false);
    if (nextMode === "chat") {
      setChatRequestMode("chat");
    }
    setPrompt("");
    setImageFile(null);
    setReusedImageUrl("");
    setProgressText("");
    const label =
      nextMode === "chat"
        ? "Chat"
        : nextMode === "generate"
          ? "Tạo ảnh"
          : nextMode === "edit"
            ? "Sửa ảnh"
            : "Nâng cấp ảnh";
    addMessage({
      role: "assistant",
      text: `Đã chọn chế độ ${label}. Bạn có thể đổi chế độ bất cứ lúc nào.`,
    });
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setReusedImageUrl("");
  };

  const handleUseImageAsInput = (url: string) => {
    setImageFile(null);
    setReusedImageUrl(url);
    setMode("edit");
    setPrompt("");
    addMessage({
      role: "assistant",
      text: "Đã đưa ảnh này vào chế độ Sửa ảnh. Nhập yêu cầu chỉnh sửa rồi gửi.",
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = prompt.trim();

    if (mode === "chat" && !value) return;
    if (mode === "generate" && !value) {
      toast.info("Nhập mô tả ảnh cần tạo.");
      return;
    }
    const selectedImage = imageFile || reusedImageUrl;

    if (mode === "edit" && (!selectedImage || !value)) {
      toast.info("Chọn ảnh và nhập yêu cầu chỉnh sửa.");
      return;
    }
    if (mode === "enhance" && !selectedImage) {
      toast.info("Chọn ảnh cần nâng cấp.");
      return;
    }

    const userText =
      mode === "enhance"
        ? enhanceAction === "upscale"
          ? "Nâng cấp ảnh: Upscale"
          : "Nâng cấp ảnh: Remove background"
        : value;

    addUserMessage(userText, imageFile, reusedImageUrl);

    setIsLoading(true);
    setIsChatModeMenuOpen(false);
    setProgressText("Đang gửi yêu cầu...");

    try {
      let result;
      if (mode === "chat") {
        setProgressText("AI đang trả lời...");
        result = await sendAiChat(value, chatRequestMode);
      } else if (mode === "generate") {
        setProgressText("AI đang tạo ảnh...");
        result = await generateAiImage(value, ratio);
      } else if (mode === "edit") {
        setProgressText("AI đang chỉnh sửa ảnh...");
        result = await editAiImage(selectedImage as File | string, value, ratio, style);
      } else {
        setProgressText("AI đang xử lý ảnh...");
        result = await enhanceAiImage(selectedImage as File | string, enhanceAction);
      }

      addMessage({
        role: "assistant",
        text: result.message,
        imageUrl: result.imageUrl,
        promptPlan: result.promptPlan,
        responseMode: result.mode,
        language: result.language,
      });
      resetPromptAfterSend();
    } catch (error: any) {
      const message = getErrorMessage(error);
      toast.error(message);
      addMessage({ role: "assistant", text: message });
    } finally {
      setIsLoading(false);
      setProgressText("");
    }
  };

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const initialTop = Math.max(120, window.innerHeight - 150);
    setChatTop(initialTop);
    setChatSide("right");
    applyChatPosition("right", initialTop);
  }, [applyChatPosition]);

  useEffect(() => {
    chatTopRef.current = chatTop;
    chatSideRef.current = chatSide;
    applyChatPosition(chatSide, chatTop);
  }, [applyChatPosition, chatSide, chatTop]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const getDragHandle = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      if (target.closest(".ai-chat-close")) return null;
      return target.closest(".ai-chat-toggle, .ai-chat-header");
    };

    const getDragTarget = (handle: Element): DragTarget =>
      handle.closest(".ai-chat-header") ? "window" : "toggle";

    const closeOnOutsideClick = (target: EventTarget | null) => {
      if (!(target instanceof Element) || !isOpen) return;
      if (target.closest(".ai-preview-backdrop, .ai-preview-modal")) return;
      if (!target.closest(".ai-chat-window, .ai-chat-toggle")) setIsOpen(false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const handle = getDragHandle(event.target);
      if (!handle) {
        closeOnOutsideClick(event.target);
        return;
      }

      const dragTarget = getDragTarget(handle);
      const rect =
        dragTarget === "window"
          ? document.querySelector<HTMLElement>(".ai-chat-window")?.getBoundingClientRect()
          : handle.getBoundingClientRect();
      if (!rect) return;

      movedRef.current = false;
      suppressClickRef.current = false;
      draggingRef.current = true;
      dragTargetRef.current = dragTarget;
      dragStartXRef.current = event.clientX;
      dragStartYRef.current = event.clientY;
      dragStartLeftRef.current = rect.left;
      dragStartTopRef.current = chatTopRef.current;
      document.body.classList.add("ai-chat-dragging");
    };

    const moveChat = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const deltaX = event.clientX - dragStartXRef.current;
      const deltaY = event.clientY - dragStartYRef.current;
      if (Math.hypot(deltaX, deltaY) > 4) movedRef.current = true;
      if (!movedRef.current) return;

      event.preventDefault();
      const targetWidth = dragTargetRef.current === "window" ? getChatWidth() : TOGGLE_SIZE;
      const targetHeight =
        dragTargetRef.current === "window" ? Math.min(610, window.innerHeight - 108) : TOGGLE_SIZE;
      const nextLeft = Math.min(
        Math.max(dragStartLeftRef.current + deltaX, EDGE_GAP),
        window.innerWidth - targetWidth - EDGE_GAP,
      );
      const nextTop = Math.min(
        Math.max(dragStartTopRef.current + deltaY, 86),
        window.innerHeight - targetHeight - 16,
      );

      chatLeftRef.current = nextLeft;
      chatTopRef.current = nextTop;
      document.documentElement.style.setProperty("--ai-chat-top", `${nextTop}px`);
      document.documentElement.style.setProperty(
        dragTargetRef.current === "window" ? "--ai-chat-window-left" : "--ai-chat-toggle-left",
        `${nextLeft}px`,
      );
    };

    const stopDragging = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.classList.remove("ai-chat-dragging");

      if (movedRef.current) {
        const targetWidth = dragTargetRef.current === "window" ? getChatWidth() : TOGGLE_SIZE;
        const nextSide =
          chatLeftRef.current + targetWidth / 2 < window.innerWidth / 2 ? "left" : "right";

        setChatTop(chatTopRef.current);
        setChatSide(nextSide);
        applyChatPosition(nextSide, chatTopRef.current, dragTargetRef.current);
        suppressClickRef.current = true;
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const suppressClickAfterDrag = (event: MouseEvent) => {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointermove", moveChat, { passive: false });
    window.addEventListener("pointerup", stopDragging, true);
    window.addEventListener("pointercancel", stopDragging, true);
    document.addEventListener("click", suppressClickAfterDrag, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointermove", moveChat);
      window.removeEventListener("pointerup", stopDragging, true);
      window.removeEventListener("pointercancel", stopDragging, true);
      document.removeEventListener("click", suppressClickAfterDrag, true);
      document.body.classList.remove("ai-chat-dragging");
    };
  }, [applyChatPosition, getSnappedLeft, isOpen]);

  useEffect(() => {
    const syncChatPosition = () => {
      const safeTop = Math.min(
        Math.max(chatTopRef.current, 86),
        Math.max(120, window.innerHeight - 112),
      );
      setChatTop(safeTop);
      applyChatPosition(chatSideRef.current, safeTop);
    };

    window.addEventListener("resize", syncChatPosition);
    return () => window.removeEventListener("resize", syncChatPosition);
  }, [applyChatPosition]);

  return (
    <div className="ai-creative-chat">
      {!isOpen && (
        <button
          className="ai-chat-toggle"
          type="button"
          aria-label="Mở AI assistant"
          onClick={() => !suppressClickRef.current && setIsOpen(true)}
        >
          <MessageCircle size={23} />
        </button>
      )}

      {isOpen && (
        <section className="ai-chat-window" aria-label="AI Event Assistant">
          <header className="ai-chat-header">
            <div>
              <span className="ai-chat-kicker">
                <Sparkles size={14} />
                Event Assistant
              </span>
              <h3>AI Workspace</h3>
            </div>
            <button
              className="ai-chat-close"
              type="button"
              aria-label="Đóng AI assistant"
              onClick={() => setIsOpen(false)}
            >
              <X size={22} />
            </button>
          </header>

          <div className="ai-chat-body" ref={bodyRef}>
            {messages.map((message) => {
              const promptDisplay = getPromptDisplay(message);

              return (
              <div className={`ai-message ${message.role}`} key={message.id}>
                <div className="ai-message-avatar" aria-hidden="true">
                  {message.role === "assistant" ? <Bot size={16} /> : <MessageCircle size={16} />}
                </div>
                <div className="ai-message-bubble">
                  {message.role === "assistant" && (
                    <div className="ai-message-actions">
                      {!promptDisplay && (
                        <button
                          className="ai-message-action"
                          type="button"
                          aria-label="Copy phản hồi AI"
                          title="Copy"
                          onClick={() => handleCopyMessage(message)}
                        >
                          {copiedMessageId === message.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      )}
                      <button
                        className="ai-message-action"
                        type="button"
                        aria-label="Phóng to phản hồi AI"
                        title="Mở rộng"
                        onClick={() =>
                          setPreviewContent({
                            title: promptDisplay
                              ? promptDisplay.locale === "en"
                                ? "Response"
                                : "Nội dung trả lời"
                              : message.imageUrl
                                ? "Phản hồi AI"
                                : "Nội dung trả lời",
                            text: promptDisplay ? undefined : message.text,
                            imageUrl: message.imageUrl,
                            promptDisplay: promptDisplay || undefined,
                          })
                        }
                      >
                        <Maximize2 size={14} />
                      </button>
                    </div>
                  )}
                  {message.imageUrl && message.role === "user" && (
                    <img className="ai-message-image" src={message.imageUrl} alt="Ảnh input" />
                  )}
                  {!promptDisplay && (
                    <div className="ai-message-text">
                      {formatMessageText(message.text).map((line, index) => (
                        <p key={`${message.id}-${index}`}>{line.replace(/^\*\s*/, "")}</p>
                      ))}
                    </div>
                  )}
                  {promptDisplay && (
                    <AIImagePromptResultCard
                      display={promptDisplay}
                      copiedKey={copiedMessageId}
                      copyKeys={{
                        prompt: `prompt-${message.id}`,
                      }}
                      onCopyPrompt={() => handleCopyPrompt(message)}
                      onUsePrompt={() => handleUsePromptInCreate(message)}
                    />
                  )}
                  {message.imageUrl && message.role === "assistant" && (
                    <AIResultPreview
                      imageUrl={message.imageUrl}
                      onExpand={(imageUrl) =>
                        setPreviewContent({
                          title: "Ảnh kết quả",
                          imageUrl,
                          text: message.text,
                        })
                      }
                      onUseAsInput={handleUseImageAsInput}
                    />
                  )}
                </div>
              </div>
              );
            })}

            {isLoading && (
              <div className="ai-message assistant">
                <div className="ai-message-avatar" aria-hidden="true">
                  <Bot size={16} />
                </div>
                <div className="ai-message-bubble ai-loading">
                  <Loader2 className="ai-spin-icon" size={16} />
                  {progressText || "AI đang xử lý..."}
                </div>
              </div>
            )}
          </div>

          <form className="ai-composer" onSubmit={handleSubmit}>
            {mode !== "chat" && (
              <div className="ai-mode-panel">
                {mode === "generate" && (
                  <div className="ai-field-row">
                    <label>
                      Tỷ lệ ảnh
                      <select value={ratio} onChange={(event) => setRatio(event.target.value as AiRatio)}>
                        {RATIOS.map((item) => (
                          <option key={item} value={item}>
                            {RATIO_LABELS[item]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {mode === "edit" && (
                  <>
                    <AIImageUpload
                      file={imageFile}
                      remoteUrl={reusedImageUrl}
                      onChange={handleImageChange}
                    />
                    <div className="ai-field-grid">
                      <label>
                        Tỷ lệ ảnh
                        <select value={ratio} onChange={(event) => setRatio(event.target.value as AiRatio)}>
                          {RATIOS.map((item) => (
                            <option key={item} value={item}>
                              {RATIO_LABELS[item]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Style
                        <select value={style} onChange={(event) => setStyle(event.target.value)}>
                          {STYLES.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </>
                )}

                {mode === "enhance" && (
                  <>
                    <AIImageUpload
                      file={imageFile}
                      remoteUrl={reusedImageUrl}
                      onChange={handleImageChange}
                    />
                    <label>
                      Loại xử lý
                      <select
                        value={enhanceAction}
                        onChange={(event) => setEnhanceAction(event.target.value as AiEnhanceAction)}
                      >
                        <option value="upscale">Upscale</option>
                        <option value="remove_background">Remove background</option>
                      </select>
                    </label>
                  </>
                )}
              </div>
            )}

            <div className="ai-input-shell">
              {mode === "chat" && (
                <div className="ai-chat-plus-menu-wrap">
                  <button
                    className="ai-chat-plus-button"
                    type="button"
                    aria-label="Mở menu chế độ chat"
                    aria-expanded={isChatModeMenuOpen}
                    onClick={() => setIsChatModeMenuOpen((current) => !current)}
                  >
                    <Plus size={19} />
                  </button>
                  {isChatModeMenuOpen && (
                    <div className="ai-chat-mode-menu">
                      <button
                        type="button"
                        onClick={() => {
                          setChatRequestMode("chat");
                          setIsChatModeMenuOpen(false);
                        }}
                      >
                        <MessageCircle size={15} />
                        Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChatRequestMode("image_prompt_builder");
                          setIsChatModeMenuOpen(false);
                        }}
                      >
                        <ImagePlus size={15} />
                        Tạo mẫu ảnh
                      </button>
                    </div>
                  )}
                </div>
              )}
              {(mode === "edit" || mode === "enhance") && (
                <button
                  className="ai-inline-upload"
                  type="button"
                  aria-label="Chọn ảnh"
                  onClick={() => document.querySelector<HTMLInputElement>(".ai-upload-input")?.click()}
                >
                  <ImagePlus size={18} />
                </button>
              )}
              <textarea
                value={inputValue}
                disabled={isLoading}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (mode === "chat" && chatRequestMode === "image_prompt_builder") {
                    if (nextValue.startsWith(IMAGE_PROMPT_PREFIX)) {
                      setPrompt(nextValue.slice(IMAGE_PROMPT_PREFIX.length));
                      return;
                    }

                    if (
                      IMAGE_PROMPT_PREFIX.startsWith(nextValue) ||
                      nextValue.startsWith("🎨") ||
                      nextValue.split(/\r?\n/, 1)[0]?.includes("Tạo")
                    ) {
                      const [, ...restLines] = nextValue.split(/\r?\n/);
                      setChatRequestMode("chat");
                      setPrompt(restLines.join("\n").trimStart());
                      return;
                    }

                    setChatRequestMode("chat");
                    setPrompt(nextValue.replace(/^🎨?\s*Tạo mẫu ảnh\s*/i, ""));
                    return;
                  }

                  setPrompt(nextValue);
                }}
                onFocus={() => setIsChatModeMenuOpen(false)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Backspace" &&
                    mode === "chat" &&
                    chatRequestMode === "image_prompt_builder" &&
                    prompt.length === 0
                  ) {
                    event.preventDefault();
                    setChatRequestMode("chat");
                    return;
                  }

                  if (event.key !== "Enter" || event.shiftKey) return;
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }}
                placeholder={
                  mode === "chat"
                    ? chatRequestMode === "image_prompt_builder"
                      ? "Nhập thông tin event để AI tạo prompt ảnh..."
                      : "Ví dụ: Hôm nay là ngày mấy?"
                    : mode === "generate"
                      ? "Dán prompt hoặc mô tả ảnh để render..."
                      : mode === "edit"
                        ? "Bạn muốn chỉnh sửa gì?"
                        : "Ghi chú thêm nếu cần..."
                }
                rows={1}
              />
              <button className="ai-send-button" type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="ai-spin-icon" size={18} /> : <Send size={18} />}
              </button>
            </div>

            <AIModeSelector mode={mode} onChange={handleModeChange} />
          </form>
        </section>
      )}

      {previewContent && (
        <div
          className="ai-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={previewContent.title}
          onMouseDown={() => setPreviewContent(null)}
        >
          <div className="ai-preview-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="ai-preview-header">
              <h3>{previewContent.title}</h3>
              <button type="button" onClick={() => setPreviewContent(null)} aria-label="Đóng preview">
                <X size={20} />
              </button>
            </div>
            <div className="ai-preview-content">
              {previewContent.imageUrl && (
                <img src={previewContent.imageUrl} alt={previewContent.title} />
              )}
              {previewContent.text && (
                <div className="ai-preview-text">
                  {formatMessageText(previewContent.text).map((line, index) => (
                    <p key={`${line}-${index}`}>{line.replace(/^\*\s*/, "")}</p>
                  ))}
                </div>
              )}
              {previewContent.promptDisplay && (
                <AIImagePromptResultCard
                  display={previewContent.promptDisplay}
                  copiedKey={copiedMessageId}
                  copyKeys={{
                    prompt: "preview-prompt",
                  }}
                  onCopyPrompt={() =>
                    handleCopyText(
                      previewContent.promptDisplay ? getPromptCopyText(previewContent.promptDisplay) : "",
                      "preview-prompt",
                      "Không thể copy prompt.",
                      previewContent.promptDisplay?.locale === "en" ? "Prompt copied" : "Đã sao chép prompt",
                    )
                  }
                  onUsePrompt={() => handleUseDisplayPromptInCreate(previewContent.promptDisplay as PromptDisplay)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
