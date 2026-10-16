import { Check, Copy, Download, Maximize2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

type AIResultPreviewProps = {
  imageUrl: string;
  onExpand: (url: string) => void;
  onUseAsInput: (url: string) => void;
};

export function AIResultPreview({
  imageUrl,
  onExpand,
  onUseAsInput,
}: AIResultPreviewProps) {
  const [copiedImage, setCopiedImage] = useState(false);

  const handleDownload = async () => {
    const filename =
      imageUrl
        .split("?")[0]
        .split("/")
        .filter(Boolean)
        .pop() || "eventix-ai-image.png";

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Cannot download image");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download image failed", error);
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handleCopyImage = async () => {
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("Clipboard image copy is not supported");
      }

      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Cannot fetch image");

      const blob = await response.blob();
      const imageType = blob.type && blob.type.startsWith("image/") ? blob.type : "image/png";
      await navigator.clipboard.write([
        new ClipboardItem({
          [imageType]: blob,
        }),
      ]);

      setCopiedImage(true);
      toast.success("Đã copy ảnh");
      window.setTimeout(() => setCopiedImage(false), 1400);
    } catch (error) {
      console.error("Copy image failed", error);
      try {
        await navigator.clipboard.writeText(imageUrl);
        setCopiedImage(true);
        toast.success("Đã copy link ảnh");
        window.setTimeout(() => setCopiedImage(false), 1400);
      } catch {
        toast.error("Không thể copy ảnh.");
      }
    }
  };

  return (
    <div className="ai-result-preview">
      <button
        className="ai-result-image-button"
        type="button"
        onClick={() => onExpand(imageUrl)}
        aria-label="Phóng to ảnh kết quả"
      >
        <img src={imageUrl} alt="AI result" />
      </button>
      <div className="ai-result-actions">
        <button type="button" onClick={() => onExpand(imageUrl)}>
          <Maximize2 size={15} />
          Phóng to
        </button>
        <button type="button" onClick={handleDownload}>
          <Download size={15} />
          Tải ảnh
        </button>
        <button type="button" onClick={handleCopyImage}>
          {copiedImage ? <Check size={15} /> : <Copy size={15} />}
          {copiedImage ? "Đã copy" : "Copy ảnh"}
        </button>
        <button type="button" onClick={() => onUseAsInput(imageUrl)}>
          <RotateCcw size={15} />
          Dùng lại
        </button>
      </div>
    </div>
  );
}
