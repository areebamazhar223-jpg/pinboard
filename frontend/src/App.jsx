import { useCallback, useEffect, useRef, useState } from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import { api } from "./api";
import TopBar from "./components/TopBar";
import CategoryBar from "./components/CategoryBar";
import PinGrid from "./components/PinGrid";
import PinModal from "./components/PinModal";
import CreatePinModal from "./components/CreatePinModal";

const DEFAULT_FILTERS = { q: "", category: "All", view: "home" };

export default function App() {
  const [categories, setCategories] = useState(["All"]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pins, setPins] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toasts, setToasts] = useState([]);
  const requestId = useRef(0);

  const notify = useCallback((message, tone = "dark") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
  }, []);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  const load = useCallback(
    async (pageToLoad, reset) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const data = await api.list({
          q: filters.q,
          category: filters.category,
          saved: filters.view === "saved",
          page: pageToLoad,
        });
        if (id !== requestId.current) return;
        setPins((prev) => (reset ? data.items : [...prev, ...data.items]));
        setPage(pageToLoad);
        setHasMore(data.has_more);
      } catch (e) {
        if (id === requestId.current) setError(e.message);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

  const replacePin = (pin) => {
    setPins((prev) =>
      filters.view === "saved" && !pin.saved
        ? prev.filter((p) => p.id !== pin.id)
        : prev.map((p) => (p.id === pin.id ? pin : p))
    );
    setSelected((s) => (s && s.id === pin.id ? pin : s));
  };

  const handleSave = async (pin) => {
    try {
      const updated = await api.toggleSave(pin.id);
      replacePin(updated);
      notify(updated.saved ? "Saved to your board" : "Removed from your board");
    } catch (e) {
      notify(e.message, "danger");
    }
  };

  const handleLike = async (pin) => {
    try {
      replacePin(await api.toggleLike(pin.id));
    } catch (e) {
      notify(e.message, "danger");
    }
  };

  const handleDelete = async (pin) => {
    try {
      await api.remove(pin.id);
      setPins((prev) => prev.filter((p) => p.id !== pin.id));
      setSelected(null);
      notify("Pin deleted");
    } catch (e) {
      notify(e.message, "danger");
    }
  };

  const handleCreated = (pin) => {
    setShowCreate(false);
    const isDefault = filters.q === "" && filters.category === "All" && filters.view === "home";
    if (isDefault) setPins((prev) => [pin, ...prev]);
    else setFilters(DEFAULT_FILTERS);
    notify("Pin published");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <TopBar
        view={filters.view}
        query={filters.q}
        onView={(view) => setFilters((f) => ({ ...f, view }))}
        onQuery={(q) => setFilters((f) => (f.q === q ? f : { ...f, q }))}
        onCreate={() => setShowCreate(true)}
      />

      <main className="container-fluid px-3 px-md-4 pb-5">
        {filters.view === "home" && (
          <CategoryBar
            categories={categories}
            active={filters.category}
            onSelect={(category) => setFilters((f) => ({ ...f, category }))}
          />
        )}
        {filters.view === "saved" && <h1 className="page-title">Your saved pins</h1>}

        <PinGrid
          pins={pins}
          loading={loading}
          error={error}
          hasMore={hasMore}
          filters={filters}
          onLoadMore={() => load(page + 1, false)}
          onRetry={() => load(1, true)}
          onOpen={setSelected}
          onSave={handleSave}
          onLike={handleLike}
          onClear={() => setFilters(DEFAULT_FILTERS)}
          onBrowse={() => setFilters(DEFAULT_FILTERS)}
        />
      </main>

      <PinModal
        pin={selected}
        onHide={() => setSelected(null)}
        onSave={handleSave}
        onLike={handleLike}
        onDelete={handleDelete}
        onCategory={(category) => {
          setSelected(null);
          setFilters({ q: "", category, view: "home" });
        }}
      />
      <CreatePinModal
        show={showCreate}
        categories={categories.filter((c) => c !== "All")}
        onHide={() => setShowCreate(false)}
        onCreated={handleCreated}
      />

      <ToastContainer position="bottom-center" className="p-3 pb-4" style={{ zIndex: 2000 }}>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            autohide
            delay={2600}
            onClose={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
            className={`app-toast app-toast-${t.tone}`}
          >
            <Toast.Body>{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </>
  );
}