import { useEffect, useState } from "react";
import { Button, Container, Form, Nav, Navbar } from "react-bootstrap";

function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function TopBar({ view, query, onView, onQuery, onCreate }) {
  const [text, setText] = useState(query);
  const debounced = useDebounced(text);

  useEffect(() => {
    onQuery(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    setText(query);
  }, [query]);

  return (
    <Navbar sticky="top" className="topbar" expand={false}>
      <Container fluid className="px-3 px-md-4 gap-2 gap-md-3 flex-nowrap">
        <Navbar.Brand href="/" className="brand" aria-label="Pinboard home">
          <span className="brand-dot" aria-hidden="true">
            <i className="bi bi-pin-angle-fill" />
          </span>
          <span className="brand-name d-none d-sm-inline">Pinboard</span>
        </Navbar.Brand>

        <Nav className="flex-row gap-1 nav-pills-lite">
          <Nav.Link as="button" active={view === "home"} onClick={() => onView("home")}>
            Home
          </Nav.Link>
          <Nav.Link as="button" active={view === "saved"} onClick={() => onView("saved")}>
            Saved
          </Nav.Link>
        </Nav>

        <Form className="search flex-grow-1" role="search" onSubmit={(e) => e.preventDefault()}>
          <i className="bi bi-search" aria-hidden="true" />
          <Form.Control
            type="search"
            placeholder="Search for ideas"
            aria-label="Search pins"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {text && (
            <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setText("")}>
              <i className="bi bi-x-lg" />
            </button>
          )}
        </Form>

        <Button className="btn-brand" onClick={onCreate}>
          <i className="bi bi-plus-lg me-md-2" aria-hidden="true" />
          <span className="d-none d-md-inline">Create pin</span>
        </Button>
      </Container>
    </Navbar>
  );
}