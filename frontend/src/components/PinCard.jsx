import { useState } from "react";
import { Button } from "react-bootstrap";

export function initials(name) {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PinCard({ pin, onOpen, onSave, onLike }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <article className="pin">
      <div className="pin-media" style={{ aspectRatio: `${pin.width} / ${pin.height}`, background: pin.color }}>
        <button type="button" className="pin-open" onClick={() => onOpen(pin)} aria-label={`Open ${pin.title}`}>
          <img
            src={pin.image_url}
            alt={pin.title}
            loading="lazy"
            className={loaded ? "is-loaded" : ""}
            onLoad={() => setLoaded(true)}
          />
        </button>
        <div className="pin-overlay">
          <span className="pin-tag">{pin.category}</span>
          <Button className={`btn-save ${pin.saved ? "is-saved" : ""}`} onClick={() => onSave(pin)}>
            {pin.saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      <div className="pin-meta">
        <h3 className="pin-title">{pin.title}</h3>
        <div className="pin-row">
          <span className="avatar" aria-hidden="true">{initials(pin.author)}</span>
          <span className="pin-author">{pin.author}</span>
          <button
            type="button"
            className={`like ${pin.liked ? "is-liked" : ""}`}
            aria-pressed={pin.liked}
            aria-label={pin.liked ? "Unlike" : "Like"}
            onClick={() => onLike(pin)}
          >
            <i className={`bi ${pin.liked ? "bi-heart-fill" : "bi-heart"}`} />
            <span>{pin.likes}</span>
          </button>
        </div>
      </div>
    </article>
  );
}