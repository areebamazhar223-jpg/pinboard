import { Button, Col, Modal, Row } from "react-bootstrap";
import { initials } from "./PinCard";

export default function PinModal({ pin, onHide, onSave, onLike, onDelete, onCategory }) {
  return (
    <Modal show={!!pin} onHide={onHide} size="xl" centered dialogClassName="pin-dialog">
      {pin && (
        <>
          <button type="button" className="modal-x" aria-label="Close" onClick={onHide}>
            <i className="bi bi-x-lg" />
          </button>
          <Row className="g-0">
            <Col md={6} className="detail-image" style={{ background: pin.color }}>
              <img src={pin.image_url} alt={pin.title} />
            </Col>
            <Col md={6} className="detail-body">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <button
                  type="button"
                  className={`like like-lg ${pin.liked ? "is-liked" : ""}`}
                  aria-pressed={pin.liked}
                  onClick={() => onLike(pin)}
                >
                  <i className={`bi ${pin.liked ? "bi-heart-fill" : "bi-heart"}`} />
                  <span>{pin.likes}</span>
                </button>
                <Button className={`btn-save ${pin.saved ? "is-saved" : ""}`} onClick={() => onSave(pin)}>
                  {pin.saved ? "Saved" : "Save"}
                </Button>
              </div>

              {pin.link && (
                <a className="detail-link" href={pin.link} target="_blank" rel="noreferrer">
                  {new URL(pin.link).hostname.replace(/^www\./, "")}
                </a>
              )}
              <h2 className="detail-title">{pin.title}</h2>
              {pin.description && <p className="detail-desc">{pin.description}</p>}

              <div className="detail-author">
                <span className="avatar avatar-lg" aria-hidden="true">{initials(pin.author)}</span>
                <div>
                  <div className="fw-semibold">{pin.author}</div>
                  <button type="button" className="link-btn" onClick={() => onCategory(pin.category)}>
                    More in {pin.category}
                  </button>
                </div>
              </div>

              {pin.mine && (
                <Button variant="link" className="delete-btn" onClick={() => onDelete(pin)}>
                  <i className="bi bi-trash3 me-2" aria-hidden="true" />
                  Delete pin
                </Button>
              )}
            </Col>
          </Row>
        </>
      )}
    </Modal>
  );
}