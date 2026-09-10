import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AIImageUploadProps = {
  file: File | null;
  remoteUrl?: string;
  remoteName?: string;
  onChange: (file: File | null) => void;
};

export function AIImageUpload({
  file,
  remoteUrl = "",
  remoteName = "Ảnh AI đã tạo",
  onChange,
}: AIImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return (
    <div className="ai-upload">
      <input
        ref={inputRef}
        className="ai-upload-input"
        type="file"
        accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />

      {file || remoteUrl ? (
        <div className="ai-upload-preview">
          {(previewUrl || remoteUrl) && (
            <img src={previewUrl || remoteUrl} alt={file?.name || remoteName} />
          )}
          <div>
            <span>Ảnh đã chọn</span>
            <strong>{file?.name || remoteName}</strong>
          </div>
          <button type="button" onClick={() => onChange(null)} aria-label="Bỏ ảnh">
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          className="ai-upload-empty"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={18} />
          Chọn ảnh
        </button>
      )}
    </div>
  );
}
