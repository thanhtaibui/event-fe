import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import "../../../styles/popup/popup.css";

interface BannerCropperProps {
  image: string;
  onCropComplete: (croppedAreaPixels: Area) => void;
  onCancel: () => void;
}

export const BannerCropper: React.FC<BannerCropperProps> = ({
  image,
  onCropComplete,
  onCancel,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropCompleteInternal = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const modalContent = (
    <div className="banner-crop-overlay" onClick={onCancel}>
      <div className="banner-crop-box">
        <div className="banner-crop-header">
          <h3>Adjust Banner Image</h3>
          <p>Drag to reposition the image</p>
        </div>

        <div className="banner-crop-area">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1200 / 420}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
            // Thêm dòng này để ảnh luôn lấp đầy khung cắt
            objectFit="horizontal-cover"
          />
        </div>

        <div className="banner-crop-footer">
          <div className="zoom-control">
            <span className="zoom-label">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="zoom-slider"
            />
          </div>

          <div className="banner-crop-actions">
            <button
              type="button"
              className="btn-base btn-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-base btn-confirm"
              onClick={() =>
                croppedAreaPixels && onCropComplete(croppedAreaPixels)
              }
            >
              Crop & Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
