import {
  Bot,
  ImagePlus,
  Loader2,
  Maximize2,
  MessageCircle,
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
  type AiEnhanceAction,
  type AiMode,
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
};
type PreviewContent = {
  title: string;
  text?: string;
  imageUrl?: string;
};

const EDGE_GAP = 24;
const TOGGLE_SIZE = 52;
const CHAT_WIDTH = 390;
const RATIOS: AiRatio[] = ["1:1", "16:9", "9:16"];
const RATIO_LABELS: Record<AiRatio, string> = {
  "1:1": "1:1 (ảnh vuông/bài đăng)",
  "16:9": "16:9 (banner/cover)",
  "9:16": "9:16 (poster/story)",
};
const STYLES = ["Tự nhiên", "Hiện đại", "Sang trọng", "Tối giản", "Rực rỡ"];

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

export default function AICreativeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatTop, setChatTop] = useState(0);
  const [chatSide, setChatSide] = useState<ChatSide>("right");
  const [mode, setMode] = useState<AiMode>("chat");
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<AiRatio>("1:1");
  const [style, setStyle] = useState(STYLES[0]);
  const [enhanceAction, setEnhanceAction] = useState<AiEnhanceAction>("upscale");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [reusedImageUrl, setReusedImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: createId(),
      role: "assistant",
      text: "Mình có thể chat về event, tạo ảnh mới, sửa ảnh hoặc nâng cấp ảnh. Chọn chế độ bên dưới rồi nhập yêu cầu.",
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

  const resetPromptAfterSend = () => {
    setPrompt("");
    if (mode === "edit" || mode === "enhance") {
      setImageFile(null);
      setReusedImageUrl("");
    }
  };

  const handleModeChange = (nextMode: AiMode) => {
    setMode(nextMode);
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
    setProgressText("Đang gửi yêu cầu...");

    try {
      let result;
      if (mode === "chat") {
        setProgressText("AI đang trả lời...");
        result = await sendAiChat(value);
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
            {messages.map((message) => (
              <div className={`ai-message ${message.role}`} key={message.id}>
                <div className="ai-message-avatar" aria-hidden="true">
                  {message.role === "assistant" ? <Bot size={16} /> : <MessageCircle size={16} />}
                </div>
                <div className="ai-message-bubble">
                  {message.role === "assistant" && (
                    <button
                      className="ai-message-expand"
                      type="button"
                      aria-label="Phóng to phản hồi AI"
                      onClick={() =>
                        setPreviewContent({
                          title: message.imageUrl ? "Phản hồi AI" : "Nội dung trả lời",
                          text: message.text,
                          imageUrl: message.imageUrl,
                        })
                      }
                    >
                      <Maximize2 size={14} />
                    </button>
                  )}
                  {message.imageUrl && message.role === "user" && (
                    <img className="ai-message-image" src={message.imageUrl} alt="Ảnh input" />
                  )}
                  <div className="ai-message-text">
                    {formatMessageText(message.text).map((line, index) => (
                      <p key={`${message.id}-${index}`}>{line.replace(/^\*\s*/, "")}</p>
                    ))}
                  </div>
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
            ))}

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
                value={prompt}
                disabled={isLoading}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" || event.shiftKey) return;
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }}
                placeholder={
                  mode === "chat"
                    ? "Nhắn với AI về event..."
                    : mode === "generate"
                      ? "Bạn muốn tạo ảnh gì?"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
