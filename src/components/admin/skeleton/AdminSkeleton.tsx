import "../../../styles/admin/skeleton/skeleton.css";

type AdminSkeletonVariant = "table" | "dashboard" | "detail";

type AdminSkeletonProps = {
  variant?: AdminSkeletonVariant;
  rows?: number;
  cards?: number;
};

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <span className={`admin-skeleton__block ${className}`} />;
}

function AdminTableSkeleton({ rows = 6 }: Pick<AdminSkeletonProps, "rows">) {
  return (
    <div className="admin-skeleton admin-skeleton--table" aria-hidden="true">
      <div className="admin-skeleton__table">
        <div className="admin-skeleton__table-head">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="admin-skeleton__head-cell" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div className="admin-skeleton__table-row" key={rowIndex}>
            <SkeletonBlock className="admin-skeleton__checkbox" />
            <div className="admin-skeleton__identity">
              <SkeletonBlock className="admin-skeleton__avatar" />
              <div>
                <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--lg" />
                <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--sm" />
              </div>
            </div>
            <SkeletonBlock className="admin-skeleton__pill" />
            <SkeletonBlock className="admin-skeleton__line" />
            <div className="admin-skeleton__buttons">
              <SkeletonBlock className="admin-skeleton__button" />
              <SkeletonBlock className="admin-skeleton__button" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboardSkeleton({ cards = 4 }: Pick<AdminSkeletonProps, "cards">) {
  return (
    <div
      className="admin-skeleton admin-skeleton--dashboard"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <section className="admin-skeleton__loading-card">
        <div className="admin-skeleton__loading-copy">
          <SkeletonBlock className="admin-skeleton__eyebrow" />
          <SkeletonBlock className="admin-skeleton__title" />
          <SkeletonBlock className="admin-skeleton__copy" />
        </div>
      </section>

      <div className="admin-skeleton__cards">
        {Array.from({ length: cards }).map((_, index) => (
          <div className="admin-skeleton__card" key={index}>
            <SkeletonBlock className="admin-skeleton__icon" />
            <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--md" />
            <SkeletonBlock className="admin-skeleton__number" />
          </div>
        ))}
      </div>

      <div className="admin-skeleton__charts">
        <div className="admin-skeleton__chart admin-skeleton__chart--wide">
          <div className="admin-skeleton__chart-head">
            <div>
              <SkeletonBlock className="admin-skeleton__eyebrow" />
              <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--lg" />
            </div>
            <SkeletonBlock className="admin-skeleton__pill" />
          </div>
          <div className="admin-skeleton__chart-body">
            <SkeletonBlock className="admin-skeleton__donut" />
            <div className="admin-skeleton__legend">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBlock key={index} className="admin-skeleton__legend-row" />
              ))}
            </div>
          </div>
        </div>

        <div className="admin-skeleton__chart">
          <div className="admin-skeleton__chart-head">
            <div>
              <SkeletonBlock className="admin-skeleton__eyebrow" />
              <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--md" />
            </div>
          </div>
          <div className="admin-skeleton__activity-list">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="admin-skeleton__activity-item" key={index}>
                <SkeletonBlock className="admin-skeleton__activity-icon" />
                <div>
                  <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--md" />
                  <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDetailSkeleton() {
  return (
    <div
      className="admin-skeleton admin-skeleton--detail"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="admin-skeleton__detail-cover">
        <SkeletonBlock />
      </div>
      <div className="admin-skeleton__detail-header">
        <SkeletonBlock className="admin-skeleton__avatar admin-skeleton__avatar--xl" />
        <div>
          <SkeletonBlock className="admin-skeleton__eyebrow" />
          <SkeletonBlock className="admin-skeleton__title" />
        </div>
        <SkeletonBlock className="admin-skeleton__action" />
      </div>
      <div className="admin-skeleton__cards">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="admin-skeleton__card" key={index}>
            <SkeletonBlock className="admin-skeleton__icon" />
            <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--md" />
            <SkeletonBlock className="admin-skeleton__number" />
          </div>
        ))}
      </div>
      <div className="admin-skeleton__detail-grid">
        <div className="admin-skeleton__panel">
          <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--lg" />
          <div className="admin-skeleton__detail-fields">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--sm" />
                <SkeletonBlock className="admin-skeleton__line admin-skeleton__line--lg" />
              </div>
            ))}
          </div>
          <SkeletonBlock className="admin-skeleton__copy" />
        </div>
        <div className="admin-skeleton__panel admin-skeleton__panel--sm">
          <SkeletonBlock className="admin-skeleton__map" />
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="admin-skeleton__line admin-skeleton__line--md" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminSkeleton({
  variant = "table",
  rows,
  cards,
}: AdminSkeletonProps) {
  if (variant === "dashboard") {
    return <AdminDashboardSkeleton cards={cards} />;
  }

  if (variant === "detail") {
    return <AdminDetailSkeleton />;
  }

  return <AdminTableSkeleton rows={rows} />;
}
