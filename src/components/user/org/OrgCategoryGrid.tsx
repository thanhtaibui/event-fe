type CategoryItem = {
  id: string;
  name: string;
  icon: string;
  count: string;
};

interface OrgCategoryGridProps {
  categories: CategoryItem[];
}

export default function OrgCategoryGrid({ categories }: OrgCategoryGridProps) {
  return (
    <section className="org-category">
      <div className="org-category__header">
        <h2>Browse by Category</h2>
      </div>
      <div className="org-category__grid">
        {categories.map((category) => (
          <button key={category.id} className="org-category__tile">
            <span className="org-category__icon">{category.icon}</span>
            <div>
              <p>{category.name}</p>
              <span>{category.count}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
