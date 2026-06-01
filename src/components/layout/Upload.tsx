// PosterUpload.tsx
import { useCallback, useEffect, useState } from "react";
import "../../styles/popup/popup.css";

interface PosterUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  defaultUrl?: string;
  onRemove?: () => void;
}

export function PosterUpload({
  value,
  onChange,
  defaultUrl,
  onRemove,
}: PosterUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
  } | null>(null);
  useEffect(() => {
    if (defaultUrl) setPreview(defaultUrl);
  }, [defaultUrl]);
  useEffect(() => {
    if (!value) {
      setPreview(null);
      setFileInfo(null);
    }
  }, [value]);
  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      const kb = file.size / 1024;
      setFileInfo({
        name: file.name,
        size:
          kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`,
      });
      onChange(file);
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileInfo(null);
    onChange(null);
    onRemove?.();
  };

  const openPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    document.getElementById("poster-input")?.click();
  };

  return (
    <div className="poster-upload-wrapper">
      <div
        className={`dropzone ${isDragging ? "dropzone--dragging" : ""} ${preview ? "dropzone--has-preview" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() =>
          !preview && document.getElementById("poster-input")?.click()
        }
      >
        {!preview ? (
          <div className="dropzone__empty">
            <div className="dropzone__icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7C5CFC"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                <polyline points="8 8 12 4 16 8" />
                <line x1="12" y1="4" x2="12" y2="16" />
              </svg>
            </div>
            <p className="dropzone__title">Drag &amp; drop your poster here</p>
            <p className="dropzone__sub">PNG, JPG, WEBP — max 5MB</p>
            <button type="button" className="btn-browse" onClick={openPicker}>
              Browse file
            </button>
          </div>
        ) : (
          <div className="dropzone__preview">
            <img src={preview} alt="Poster preview" className="dropzone__img" />
            <div className="dropzone__overlay">
              <button
                type="button"
                className="overlay-btn overlay-btn--change"
                onClick={openPicker}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M1 11l3-3 2.5 2.5L10 6l3 3" />
                  <rect x="1" y="1" width="13" height="13" rx="2" />
                </svg>
                Change
              </button>
              <button
                type="button"
                className="overlay-btn overlay-btn--remove"
                onClick={handleRemove}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <line x1="3" y1="3" x2="12" y2="12" />
                  <line x1="12" y1="3" x2="3" y2="12" />
                </svg>
                Remove
              </button>
            </div>
            {fileInfo && (
              <div className="dropzone__file-info">
                <div className="file-meta">
                  <span className="file-name">{fileInfo.name}</span>
                  <span className="file-size">{fileInfo.size}</span>
                </div>
                <span className="badge-success">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 11 11"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <polyline points="2 6 4.5 8.5 9 3" />
                  </svg>
                  Uploaded
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* <p className="poster-hint">Recommended ratio 16:9, minimum 800×450px</p> */}

      <input
        id="poster-input"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
