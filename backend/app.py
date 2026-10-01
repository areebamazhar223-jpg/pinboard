"""Pinboard API - a small Flask + SQLite backend for the React frontend.

Run:  python app.py      (serves http://127.0.0.1:5000)
"""
import os
import random
import sqlite3
from datetime import datetime, timezone

from flask import Flask, g, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "pinboard.db")
DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

CATEGORIES = ["Interiors", "Travel", "Food", "Fashion", "Art", "Nature", "Architecture", "Gadgets"]
PAGE_SIZE = 20
CURRENT_USER = "You"

app = Flask(__name__, static_folder=None)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# --------------------------------------------------------------------------- #
# Database helpers
# --------------------------------------------------------------------------- #
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


SCHEMA = """
CREATE TABLE IF NOT EXISTS pins (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    image_url   TEXT    NOT NULL,
    width       INTEGER NOT NULL DEFAULT 600,
    height      INTEGER NOT NULL DEFAULT 800,
    color       TEXT    NOT NULL DEFAULT '#e9e5df',
    category    TEXT    NOT NULL,
    author      TEXT    NOT NULL,
    link        TEXT    NOT NULL DEFAULT '',
    likes       INTEGER NOT NULL DEFAULT 0,
    liked       INTEGER NOT NULL DEFAULT 0,
    saved       INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL
);
"""

SEED_TITLES = {
    "Interiors": ["Reading nook with linen curtains", "Small kitchen, big personality", "Warm minimal bedroom", "Terracotta bathroom tiles", "Plants on every shelf", "Japandi living room", "Arched doorway ideas"],
    "Travel": ["Sunrise over the Hunza valley", "Weekend in Lisbon", "Slow train through the Alps", "Hidden beaches of Sri Lanka", "Old town alleys at dusk", "Camping under the Milky Way", "Street markets of Marrakech"],
    "Food": ["Sourdough with salted butter", "Sunday brunch spread", "Handmade pasta from scratch", "Chai and shortbread", "Charred peppers and feta", "Tiny tarts for a party", "Grandma's biryani, step by step"],
    "Fashion": ["Neutral layers for autumn", "Vintage denim edit", "Linen shirt, five ways", "Statement earrings", "Monochrome street style", "Capsule wardrobe basics", "Embroidered kurta details"],
    "Art": ["Watercolor washes study", "Bold risograph prints", "Sketchbook page: hands", "Abstract shapes in clay", "Ink drawings of birds", "Collage with torn paper", "Calligraphy practice sheet"],
    "Nature": ["Fog rolling over pine forest", "Wildflower meadow", "Macro shots of dew", "Golden hour on the ridge", "River stones after rain", "Autumn maple canopy", "Desert dunes at noon"],
    "Architecture": ["Brutalist library facade", "Spiral staircase study", "Mughal arches and courtyards", "Glass house in the woods", "Concrete and light", "Courtyard with water channel", "Rooftop garden terraces"],
    "Gadgets": ["Desk setup for deep work", "Mechanical keyboard build", "Cable-free charging corner", "Retro film camera collection", "Compact studio microphone", "E-ink reader in the sun", "Modular synth on a shelf"],
}
AUTHORS = ["Amina R.", "Noah B.", "Sofia L.", "Hassan K.", "Mei T.", "Lucas P.", "Zara A.", "Ravi S."]
COLORS = ["#e9e5df", "#dfe7e4", "#efe1dc", "#dde3ee", "#ece8d5", "#e4dcea", "#f0e0d0", "#d9e6ec"]
HEIGHTS = [420, 520, 600, 720, 800, 900]


def init_db():
    with sqlite3.connect(DB_PATH) as db:
        db.executescript(SCHEMA)
        (count,) = db.execute("SELECT COUNT(*) FROM pins").fetchone()
        if count:
            return
        rng = random.Random(42)
        rows = []
        n = 0
        for category, titles in SEED_TITLES.items():
            for title in titles:
                n += 1
                h = rng.choice(HEIGHTS)
                rows.append((
                    title,
                    f"Saved from the {category.lower()} collection. Tap save to keep it on your board.",
                    f"https://picsum.photos/seed/pinboard{n}/600/{h}",
                    600, h, rng.choice(COLORS), category, rng.choice(AUTHORS), "",
                    rng.randint(3, 480), datetime.now(timezone.utc).isoformat(),
                ))
        rng.shuffle(rows)  # mix categories in the home feed
        db.executemany(
            "INSERT INTO pins (title, description, image_url, width, height, color, category,"
            " author, link, likes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            rows,
        )


def pin_to_dict(row):
    d = dict(row)
    d["liked"] = bool(d["liked"])
    d["saved"] = bool(d["saved"])
    d["mine"] = d["author"] == CURRENT_USER
    return d


def is_url(value):
    return isinstance(value, str) and value.startswith(("http://", "https://")) and len(value) < 2000


def error(message, status=400):
    return jsonify({"error": message}), status


# --------------------------------------------------------------------------- #
# API
# --------------------------------------------------------------------------- #
@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/categories")
def categories():
    return jsonify(["All"] + CATEGORIES)


@app.get("/api/pins")
def list_pins():
    q = request.args.get("q", "").strip()
    category = request.args.get("category", "All")
    saved_only = request.args.get("saved") in ("1", "true")
    try:
        page = max(1, int(request.args.get("page", 1)))
    except ValueError:
        page = 1

    where, params = [], []
    if q:
        where.append("(title LIKE ? OR description LIKE ? OR category LIKE ? OR author LIKE ?)")
        params += [f"%{q}%"] * 4
    if category and category != "All":
        where.append("category = ?")
        params.append(category)
    if saved_only:
        where.append("saved = 1")
    clause = f" WHERE {' AND '.join(where)}" if where else ""

    db = get_db()
    total = db.execute(f"SELECT COUNT(*) FROM pins{clause}", params).fetchone()[0]
    rows = db.execute(
        f"SELECT * FROM pins{clause} ORDER BY id DESC LIMIT ? OFFSET ?",
        params + [PAGE_SIZE, (page - 1) * PAGE_SIZE],
    ).fetchall()
    return jsonify({
        "items": [pin_to_dict(r) for r in rows],
        "page": page,
        "total": total,
        "has_more": page * PAGE_SIZE < total,
    })


@app.get("/api/pins/<int:pin_id>")
def get_pin(pin_id):
    row = get_db().execute("SELECT * FROM pins WHERE id = ?", (pin_id,)).fetchone()
    if row is None:
        return error("Pin not found.", 404)
    return jsonify(pin_to_dict(row))


@app.post("/api/pins")
def create_pin():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()
    image_url = str(data.get("image_url", "")).strip()
    link = str(data.get("link", "")).strip()
    category = data.get("category") or CATEGORIES[0]

    if not title or len(title) > 100:
        return error("Add a title (100 characters or fewer).")
    if len(description) > 500:
        return error("Keep the description under 500 characters.")
    if not is_url(image_url):
        return error("Enter a valid image link starting with http:// or https://.")
    if link and not is_url(link):
        return error("The destination link must start with http:// or https://.")
    if category not in CATEGORIES:
        return error("Choose one of the listed categories.")

    def dimension(key, default):
        try:
            return min(4000, max(100, int(data.get(key, default))))
        except (TypeError, ValueError):
            return default

    db = get_db()
    cur = db.execute(
        "INSERT INTO pins (title, description, image_url, width, height, color, category,"
        " author, link, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (title, description, image_url, dimension("width", 600), dimension("height", 800),
         random.choice(COLORS), category, CURRENT_USER, link, datetime.now(timezone.utc).isoformat()),
    )
    db.commit()
    row = db.execute("SELECT * FROM pins WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(pin_to_dict(row)), 201


@app.post("/api/pins/<int:pin_id>/like")
def toggle_like(pin_id):
    db = get_db()
    row = db.execute("SELECT * FROM pins WHERE id = ?", (pin_id,)).fetchone()
    if row is None:
        return error("Pin not found.", 404)
    liked = not row["liked"]
    db.execute("UPDATE pins SET liked = ?, likes = likes + ? WHERE id = ?", (int(liked), 1 if liked else -1, pin_id))
    db.commit()
    return jsonify(pin_to_dict(db.execute("SELECT * FROM pins WHERE id = ?", (pin_id,)).fetchone()))


@app.post("/api/pins/<int:pin_id>/save")
def toggle_save(pin_id):
    db = get_db()
    row = db.execute("SELECT * FROM pins WHERE id = ?", (pin_id,)).fetchone()
    if row is None:
        return error("Pin not found.", 404)
    db.execute("UPDATE pins SET saved = ? WHERE id = ?", (0 if row["saved"] else 1, pin_id))
    db.commit()
    return jsonify(pin_to_dict(db.execute("SELECT * FROM pins WHERE id = ?", (pin_id,)).fetchone()))


@app.delete("/api/pins/<int:pin_id>")
def delete_pin(pin_id):
    db = get_db()
    row = db.execute("SELECT author FROM pins WHERE id = ?", (pin_id,)).fetchone()
    if row is None:
        return error("Pin not found.", 404)
    if row["author"] != CURRENT_USER:
        return error("You can only delete your own pins.", 403)
    db.execute("DELETE FROM pins WHERE id = ?", (pin_id,))
    db.commit()
    return "", 204


# --------------------------------------------------------------------------- #
# Serve the production React build (after `npm run build`)
# --------------------------------------------------------------------------- #
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def frontend(path):
    if not os.path.isdir(DIST_DIR):
        return jsonify({"message": "API is running. Start the React dev server (see README) or run `npm run build`."})
    if path and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
