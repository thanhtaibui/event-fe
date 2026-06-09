import React, { useCallback, useMemo, useState } from "react";
import "../../styles/event/invite-popup.css";

import { parseEmailsFromText } from "../../../utils/invite/emailUtils";

export type ImportDropzoneProps = {
  onImport: (emails: string[]) => void;
  acceptedTypes?: string[];
};

const DEFAULT_ACCEPTS = [".csv", ".txt"];

export const ImportDropzone: React.FC<ImportDropzoneProps> = ({
  onImport,
  acceptedTypes = DEFAULT_ACCEPTS,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useMemo(
    () => `invite-import-${Math.random().toString(16).slice(2)}`,
    [],
  );

  const isAccepted = useCallback(
    (file: File) => {
      const name = file.name.toLowerCase();
      return acceptedTypes.some((ext) => name.endsWith(ext));
    },
    [acceptedTypes],
  );

  const readFileText = async (file: File) => {
    const text = await file.text();
    return text;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!isAccepted(file)) {
        return;
      }

      const text = await readFileText(file);
      const emails = parseEmailsFromText(text);
      onImport(emails);
    },
    [isAccepted, onImport],
  );

  return (
    <div
      className={`invite-dropzone ${isDragging ? "is-dragging" : ""}`}
      role="button"
      tabIndex={0}
      aria-label="Import emails from file"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const el = document.getElementById(
            inputId,
          ) as HTMLInputElement | null;
          el?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => {
        const el = document.getElementById(inputId) as HTMLInputElement | null;
        el?.click();
      }}
    >
      <input
        id={inputId}
        type="file"
        accept={acceptedTypes.join(",")}
        className="invite-dropzone__input"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="invite-dropzone__icon" aria-hidden>
        ⤓
      </div>
      <div className="invite-dropzone__title">Import Emails</div>
      <div className="invite-dropzone__sub">
        Drop a .csv or .txt file here, or click to choose.
      </div>
    </div>
  );
};
