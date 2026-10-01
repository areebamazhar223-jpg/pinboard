import { useEffect, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { api } from "../api";

const EMPTY = { image_url: "", title: "", description: "", link: "", category: "" };

export default function CreatePinModal({ show, categories, onHide, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [size, setSize] = useState({ width: 600, height: 800 });
  const [imgState, setImgState] = useState("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setForm({ ...EMPTY, category: categories[0] || "" });
      setImgState("idle");
      setError("");
    }
  }, [show, categories]);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "image_url") setImgState(value.trim() ? "loading" : "idle");
  };

  const canSubmit = form.title.trim() && imgState === "ok" && !saving;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const pin = await api.create({ ...form, image_url: form.image_url.trim(), ...size });
      onCreated(pin);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered dialogClassName="create-dialog">
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>Create pin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-4">
            <Col md={5}>
              <div className="preview">
                {form.image_url.trim() && imgState !== "error" ? (
                  <img
                    src={form.image_url.trim()}
                    alt="Pin preview"
                    onLoad={(e) => {
                      setSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
                      setImgState("ok");
                    }}
                    onError={() => setImgState("error")}
                  />
                ) : (
                  <div className="preview-empty">
                    <i className={`bi ${imgState === "error" ? "bi-exclamation-circle" : "bi-image"}`} />
                    <p>{imgState === "error" ? "That link isn't an image we can load." : "Paste an image link to see a preview"}</p>
                  </div>
                )}
                {imgState === "loading" && (
                  <div className="preview-loading"><Spinner size="sm" animation="border" /></div>
                )}
              </div>
            </Col>

            <Col md={7}>
              <Form.Group className="mb-3" controlId="pin-image">
                <Form.Label>Image link</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={set("image_url")}
                  isInvalid={imgState === "error"}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="pin-title">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  placeholder="What is this pin about?"
                  maxLength={100}
                  value={form.title}
                  onChange={set("title")}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="pin-desc">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  maxLength={500}
                  placeholder="Tell people what makes it worth saving"
                  value={form.description}
                  onChange={set("description")}
                />
              </Form.Group>
              <Row className="g-3">
                <Col sm={6}>
                  <Form.Group controlId="pin-cat">
                    <Form.Label>Category</Form.Label>
                    <Form.Select value={form.category} onChange={set("category")}>
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="pin-link">
                    <Form.Label>Destination link</Form.Label>
                    <Form.Control type="url" placeholder="Optional" value={form.link} onChange={set("link")} />
                  </Form.Group>
                </Col>
              </Row>
              {error && <Alert variant="danger" className="mt-3 mb-0 py-2">{error}</Alert>}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" className="rounded-pill px-4" onClick={onHide}>Cancel</Button>
          <Button type="submit" className="btn-brand px-4" disabled={!canSubmit}>
            {saving ? "Publishing..." : "Publish"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}