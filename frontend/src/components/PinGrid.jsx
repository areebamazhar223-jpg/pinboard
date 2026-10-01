import { useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import PinCard from "./PinCard";

const SKELETON_HEIGHTS = [260, 340, 300, 380, 240, 320, 360, 280, 330, 250];

function Skeletons({ count = 10 }) {
  return Array.from({ length: count }, (_, i) => (
    <div className="pin" key={`sk-${i}`} aria-hidden="true">
      <div className="skeleton" style={{ height: SKELETON_HEIGHTS[i % SKELETON_HEIGHTS.length] }} />
    </div>
  ));
}

export default function PinGrid({
  pins, loading, error, hasMore, filters,
  onLoadMore, onRetry, onOpen, onSave, onLike, onClear, onBrowse,
}) {
  const sentinel = useRef(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading || error) return;
    const io = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && onLoadMore(),
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, error, onLoadMore, pins.length]);

  if (error && pins.length === 0) {
    return (
      <div className="empty">
        <i className="bi bi-wifi-off" aria-hidden="true" />
        <h2>We couldn't load your pins</h2>
        <p>{error}</p>
        <Button className="btn-brand" onClick={onRetry}>Try again</Button>
      </div>
    );
  }

  if (!loading && pins.length === 0) {
    const saved = filters.view === "saved";
    return (
      <div className="empty">
        <i className={`bi ${saved ? "bi-bookmark" : "bi-search"}`} aria-hidden="true" />
        <h2>{saved ? "Nothing saved yet" : "No pins match your search"}</h2>
        <p>
          {saved
            ? "Tap Save on any pin and it will show up here."
            : "Try a different word, or clear the filters to see everything."}
        </p>
        <Button className="btn-brand" onClick={saved ? onBrowse : onClear}>
          {saved ? "Browse pins" : "Clear filters"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <section className="masonry" aria-label="Pins">
        {pins.map((pin) => (
          <PinCard key={pin.id} pin={pin} onOpen={onOpen} onSave={onSave} onLike={onLike} />
        ))}
        {loading && <Skeletons count={pins.length ? 5 : 12} />}
      </section>

      {error && pins.length > 0 && (
        <div className="text-center mt-4">
          <p className="text-muted mb-2">{error}</p>
          <Button variant="outline-dark" className="rounded-pill" onClick={onLoadMore}>Retry</Button>
        </div>
      )}
      <div ref={sentinel} style={{ height: 1 }} />
      {!hasMore && pins.length > 0 && <p className="end-note">You're all caught up.</p>}
    </>
  );
}