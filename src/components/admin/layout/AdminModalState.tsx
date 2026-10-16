type AdminModalLoadingProps = {
  message?: string;
  minHeight?: number;
};

type AdminModalErrorProps = AdminModalLoadingProps & {
  onRetry?: () => void;
};

export function AdminModalLoading({
  message = "Đang tải dữ liệu...",
  minHeight = 260,
}: AdminModalLoadingProps) {
  return (
    <div
      className="admin-modal-state admin-modal-state--loading"
      style={{ minHeight }}
      aria-live="polite"
      aria-busy="true"
    >
      <span className="admin-modal-state__spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function AdminModalError({
  message = "Không thể tải dữ liệu.",
  minHeight = 260,
  onRetry,
}: AdminModalErrorProps) {
  return (
    <div
      className="admin-modal-state admin-modal-state--error"
      style={{ minHeight }}
      role="alert"
    >
      <strong>{message}</strong>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
