import { Download, Maximize2, RotateCcw } from "lucide-react";

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
        <button type="button" onClick={() => onUseAsInput(imageUrl)}>
          <RotateCcw size={15} />
          Dùng lại
        </button>
      </div>
    </div>
  );
}
