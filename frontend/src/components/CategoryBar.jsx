export default function CategoryBar({ categories, active, onSelect }) {
  return (
    <nav className="category-bar" aria-label="Categories">
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          className={`chip ${c === active ? "is-active" : ""}`}
          aria-pressed={c === active}
          onClick={() => onSelect(c)}
        >
          {c}
        </button>
      ))}
    </nav>
  );
}