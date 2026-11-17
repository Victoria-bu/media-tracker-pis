import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "./lib/api";
import type { ApiUser, ApiItem, ApiSession, ApiCollection, ApiStats } from "./types/api";

type Tab = "Home" | "Library" | "Stats" | "Profile";
type Filter = "All" | "Films" | "Series" | "Books";
type ItemStatus = ApiItem["status"];
type ItemType = ApiItem["type"];

const mountain =
  "https://images.unsplash.com/photo-1612450639537-d44bc045efc7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=86&w=900";

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({
  children,
  size = 22,
  className = "",
}: {
  children: ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" className={className} fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {children}
    </svg>
  );
}

const icons = {
  home: (
    <Icon>
      <path d="m3.5 10 8.5-7 8.5 7v9.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V10Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 21v-7h6v7" stroke="currentColor" strokeWidth="1.8" />
    </Icon>
  ),
  library: (
    <Icon>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H11v17H5.5A1.5 1.5 0 0 1 4 18.5v-14ZM20 4.5A1.5 1.5 0 0 0 18.5 3H13v17h5.5a1.5 1.5 0 0 0 1.5-1.5v-14Z" stroke="currentColor" strokeWidth="1.8" />
    </Icon>
  ),
  stats: (
    <Icon>
      <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Icon>
  ),
  profile: (
    <Icon>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 21c.7-4 3.2-6 7.5-6s6.8 2 7.5 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </Icon>
  ),
  search: (
    <Icon size={20}>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </Icon>
  ),
  plus: (
    <Icon size={24}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Icon>
  ),
  star: (
    <Icon size={15}>
      <path d="m12 3 2.7 5.4 6 .9-4.4 4.2 1.1 6-5.4-2.8-5.4 2.8 1.1-6-4.4-4.2 6-.9L12 3Z" fill="currentColor" />
    </Icon>
  ),
  play: (
    <Icon size={18}>
      <path d="m9 7 8 5-8 5V7Z" fill="currentColor" />
    </Icon>
  ),
  chevron: (
    <Icon size={18}>
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </Icon>
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(status: ItemStatus, type: ItemType): string {
  if (status === "in_progress") return type === "book" ? "Reading" : "Watching";
  if (status === "on_hold") return "On hold";
  if (status === "completed") return "Completed";
  return "Planned";
}

function statusClass(status: ItemStatus, type: ItemType): string {
  if (status === "in_progress") return type === "book" ? "reading" : "watching";
  if (status === "on_hold") return "on-hold";
  return status;
}

function typeLabel(type: ItemType): string {
  return type === "film" ? "FILM" : type === "series" ? "SERIES" : "BOOK";
}

function filterMatches(item: ApiItem, filter: Filter): boolean {
  if (filter === "All") return true;
  if (filter === "Films") return item.type === "film";
  if (filter === "Series") return item.type === "series";
  return item.type === "book";
}

function formatSessionDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

function initials(nickname: string): string {
  return nickname.slice(0, 2).toUpperCase();
}

function yearFromDate(iso: string): string {
  return new Date(iso).getFullYear().toString();
}

// ─── Cover ────────────────────────────────────────────────────────────────────

function Cover({ item, large = false }: { item: ApiItem; large?: boolean }) {
  const sizeClass = large ? "cover-large" : "";
  if (item.coverUrl) {
    return (
      <div className={`cover ${sizeClass}`} style={{ overflow: "hidden" }}>
        <img src={item.coverUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div className={`cover cover-generic cover-generic-${item.type} ${sizeClass}`}>
      <strong>{item.title.charAt(0)}</strong>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }: { onAuth: (user: ApiUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-logo">Media Tracker</h1>
        <p className="auth-sub">Your personal library of films, series and books.</p>
        {mode === "login" ? (
          <LoginForm onLogin={onAuth} />
        ) : (
          <RegisterForm onRegister={onAuth} />
        )}
        <p className="auth-toggle">
          {mode === "login" ? (
            <>Don&apos;t have an account?<button onClick={() => setMode("register")}>Create one</button></>
          ) : (
            <>Already have an account?<button onClick={() => setMode("login")}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: (user: ApiUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await api.auth.login({ email, password });
      onLogin(user);
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 401) {
        setError("Incorrect email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button className="auth-btn" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function RegisterForm({ onRegister }: { onRegister: (user: ApiUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailError("");
    setLoading(true);
    try {
      const user = await api.auth.register({ email, password, nickname });
      onRegister(user);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; code?: string };
      if (apiErr.status === 409 && apiErr.code === "EMAIL_TAKEN") {
        setEmailError("This email is already registered.");
      } else if (apiErr.status === 400) {
        setError("Please check your details. Password must be at least 8 characters, nickname 2–50 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
        {emailError && <span className="field-error">{emailError}</span>}
      </label>
      <label className="field">
        <span>Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
      </label>
      <label className="field">
        <span>Nickname</span>
        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Your display name" required minLength={2} maxLength={50} />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button className="auth-btn" type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

function Home({
  user,
  items,
  collections,
  onOpenLibrary,
  onOpenItem,
  onOpenCollection,
}: {
  user: ApiUser;
  items: ApiItem[];
  collections: ApiCollection[];
  onOpenLibrary: () => void;
  onOpenItem: (id: string) => void;
  onOpenCollection: (id: string) => void;
}) {
  const inProgress = useMemo(
    () => [...items].filter((i) => i.status === "in_progress").sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2),
    [items],
  );
  const recent = useMemo(
    () => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [items],
  );

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dayLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }).toUpperCase();

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">{dayLabel}</p>
          <h1>{greeting}, {user.nickname}</h1>
        </div>
        <button className="avatar" aria-label="Open profile">{initials(user.nickname)}</button>
      </header>

      <section className="hero">
        <img src={mountain} alt="Snow-covered mountains at dusk" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <span className="hero-label">YOUR MEDIA TRACKER</span>
          <h2>Track what<br />you enjoy.</h2>
          <p>{items.length} {items.length === 1 ? "item" : "items"} in your library</p>
          <button className="primary-btn" onClick={onOpenLibrary}>{icons.library} Go to library</button>
        </div>
        <span className="photo-credit">Photo: Sead Dedić</span>
      </section>

      {inProgress.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div><p className="eyebrow">IN PROGRESS</p><h2>Continue</h2></div>
            <button className="text-button" onClick={onOpenLibrary}>See all {icons.chevron}</button>
          </div>
          <div className="continue-list">
            {inProgress.map((item) => (
              <button className="continue-card" key={item.id} onClick={() => onOpenItem(item.id)}>
                <Cover item={item} />
                <span className="continue-copy">
                  <strong>{item.title}</strong>
                  <small>{item.type === "book" && item.author ? item.author : item.type === "film" && item.director ? item.director : item.type === "series" && item.seasons ? `${item.seasons} season${item.seasons > 1 ? "s" : ""}` : typeLabel(item.type)}</small>
                  <span className="progress" style={{ marginTop: 11 }}><i style={{ width: "50%" }} /></span>
                  <small className="progress-label">{statusLabel(item.status, item.type)}</small>
                </span>
                <span className="round-play">{icons.play}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="section recent">
          <div className="section-heading">
            <div><p className="eyebrow">YOUR LIBRARY</p><h2>Recently added</h2></div>
            <button className="text-button" onClick={onOpenLibrary}>See all {icons.chevron}</button>
          </div>
          <div className="poster-row">
            {recent.map((item) => (
              <button className="poster-card" key={item.id} onClick={() => onOpenItem(item.id)}>
                <Cover item={item} large />
                <strong>{item.title}</strong>
                <span>
                  {item.rating !== null && <><i>{icons.star}</i> {item.rating} · </>}
                  {statusLabel(item.status, item.type)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div><p className="eyebrow">YOUR COLLECTIONS</p><h2>Collections</h2></div>
          </div>
          <div className="folder-row">
            {collections.map((c) => (
              <button className="folder-card" key={c.id} onClick={() => onOpenCollection(c.id)}>
                <span className="folder-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
                <strong>{c.name}</strong>
              </button>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <section className="section">
          <div className="empty" style={{ gridColumn: "1/-1" }}>
            <strong>Your library is empty</strong>
            <p>Tap + to add your first book, film or series.</p>
          </div>
        </section>
      )}
    </>
  );
}

// ─── Library ──────────────────────────────────────────────────────────────────

function Library({
  items,
  collections,
  onOpenItem,
  focusCollectionId,
  onFocusConsumed,
}: {
  items: ApiItem[];
  collections: ApiCollection[];
  onOpenItem: (id: string) => void;
  focusCollectionId?: string | null;
  onFocusConsumed?: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tag, setTag] = useState("All tags");
  const [collectionId, setCollectionId] = useState("all");
  const [sort, setSort] = useState("Most recent");
  const [collectionItemIds, setCollectionItemIds] = useState<string[] | null>(null);

  const allTags = useMemo(
    () => Array.from(new Set(items.flatMap((i) => i.tags))).sort(),
    [items],
  );

  useEffect(() => {
    if (collectionId === "all") {
      setCollectionItemIds(null);
      return;
    }
    api.collections.get(collectionId).then((detail) => {
      setCollectionItemIds(detail.items.map((i) => i.id));
    }).catch(() => setCollectionItemIds(null));
  }, [collectionId]);

  useEffect(() => {
    if (focusCollectionId) {
      setCollectionId(focusCollectionId);
      onFocusConsumed?.();
    }
  }, [focusCollectionId]);

  const shown = useMemo(() => {
    return [...items]
      .filter((item) =>
        filterMatches(item, filter) &&
        item.title.toLowerCase().includes(query.toLowerCase()) &&
        (tag === "All tags" || item.tags.includes(tag)) &&
        (collectionItemIds === null || collectionItemIds.includes(item.id)),
      )
      .sort((a, b) => {
        if (sort === "Rating") {
          const ra = a.rating ?? -1;
          const rb = b.rating ?? -1;
          return rb - ra;
        }
        if (sort === "Title") return a.title.localeCompare(b.title);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [items, filter, query, tag, collectionItemIds, sort]);

  const activeFilterCount = Number(tag !== "All tags") + Number(collectionId !== "all");

  const selectedCollectionName = collectionId === "all"
    ? "All collections"
    : collections.find((c) => c.id === collectionId)?.name ?? "All collections";

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">{items.length} SAVED {items.length === 1 ? "ITEM" : "ITEMS"}</p>
        <h1>Your library</h1>
        <label className="search-box">{icons.search}<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles, people, tags" /></label>
      </header>
      <div className="filter-row">
        {(["All", "Films", "Series", "Books"] as Filter[]).map((value) => (
          <button key={value} className={filter === value ? "filter active" : "filter"} onClick={() => setFilter(value)}>
            {value}<span>{value === "All" ? items.length : items.filter((i) => filterMatches(i, value)).length}</span>
          </button>
        ))}
      </div>
      <div className="catalog-tools">
        <button className={activeFilterCount ? "tool-button has-filter" : "tool-button"} onClick={() => setShowFilters(!showFilters)}>
          <span className="sliders">≡</span> Tags &amp; collections {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
        </button>
        <label className="sort-control">
          <span>Sort:</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Most recent</option>
            <option>Rating</option>
            <option>Title</option>
          </select>
        </label>
      </div>
      {showFilters && (
        <section className="filter-panel">
          <div className="filter-panel-heading">
            <strong>Refine your library</strong>
            <button onClick={() => { setTag("All tags"); setCollectionId("all"); }}>Clear all</button>
          </div>
          <p>Tags</p>
          <div className="choice-row">
            {["All tags", ...allTags].map((t) => (
              <button key={t} className={tag === t ? "active" : ""} onClick={() => setTag(t)}>{t}</button>
            ))}
          </div>
          <p>Collections</p>
          <div className="choice-row">
            <button className={collectionId === "all" ? "active" : ""} onClick={() => setCollectionId("all")}>All collections</button>
            {collections.map((c) => (
              <button key={c.id} className={collectionId === c.id ? "active" : ""} onClick={() => setCollectionId(c.id)}>{c.name}</button>
            ))}
          </div>
          {collectionId !== "all" && (
            <p style={{ fontSize: 8, color: "#8b8e85", marginTop: 8 }}>Showing items in: {selectedCollectionName}</p>
          )}
        </section>
      )}
      <div className="results-line"><span>{shown.length} {shown.length === 1 ? "item" : "items"}</span><i /></div>
      <section className="library-grid">
        {shown.map((item) => (
          <button className="library-card" key={item.id} onClick={() => onOpenItem(item.id)}>
            <Cover item={item} large />
            <span className={`status-pill status-${statusClass(item.status, item.type)}`}>{statusLabel(item.status, item.type)}</span>
            <span className="media-type">{typeLabel(item.type)}</span>
            <strong>{item.title}</strong>
            <span className="meta-detail">
              {item.type === "book" && item.author ? `${item.author}${item.pages ? ` · ${item.pages} pages` : ""}` :
               item.type === "film" && item.director ? item.director :
               item.type === "series" && item.seasons ? `${item.seasons} season${item.seasons > 1 ? "s" : ""}` : ""}
            </span>
            <span className="meta">
              {item.rating !== null && <><i>{icons.star}</i> {item.rating}<b>·</b></>}
              {statusLabel(item.status, item.type)}
            </span>
          </button>
        ))}
        {shown.length === 0 && (
          <div className="empty"><strong>No matches</strong><p>Try another title or clear the filter.</p></div>
        )}
      </section>
    </>
  );
}

// ─── Add Session Sheet ────────────────────────────────────────────────────────

function AddSessionSheet({
  itemId,
  itemType,
  onClose,
  onAdded,
}: {
  itemId: string;
  itemType: ItemType;
  onClose: () => void;
  onAdded: (session: ApiSession) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [rating, setRating] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sessionLabel = itemType === "book" ? "Reading session" : "Session";

  async function handleSave() {
    setError("");
    if (!date) { setError("Date is required."); return; }
    setLoading(true);
    try {
      const ratingVal = rating !== "" ? parseInt(rating, 10) : null;
      const session = await api.sessions.create(itemId, {
        date,
        rating: ratingVal,
        note: note.trim() || null,
      });
      onAdded(session);
    } catch {
      setError("Failed to save session. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <div><p className="eyebrow">LOG YOUR ACTIVITY</p><h2>Add {sessionLabel.toLowerCase()}</h2></div>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Rating (0–10, optional)</span>
          <div className="session-rating-field">
            <input
              type="number"
              min={0}
              max={10}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="e.g. 8"
            />
          </div>
        </label>
        <label className="field">
          <span>Note (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Your thoughts on this session…"
            rows={3}
            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d8d6cd", borderRadius: 11, background: "white", outline: "none", padding: "10px 13px", font: "inherit", fontSize: 12, resize: "vertical" }}
          />
        </label>
        {error && <p style={{ color: "#9a3a2e", fontSize: 11, margin: "0 0 10px" }}>{error}</p>}
        <button className="save-btn" onClick={handleSave} disabled={loading}>
          {loading ? "Saving…" : "Save session"}
        </button>
      </section>
    </div>
  );
}

// ─── Item Detail ──────────────────────────────────────────────────────────────

function ItemDetail({
  itemId,
  collections,
  onBack,
  onDeleted,
  onUpdated,
}: {
  itemId: string;
  collections: ApiCollection[];
  onBack: () => void;
  onDeleted: () => void;
  onUpdated: (item: ApiItem) => void;
}) {
  const [item, setItem] = useState<ApiItem | null>(null);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addingSession, setAddingSession] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [editingTags, setEditingTags] = useState(false);
  const [memberCollectionIds, setMemberCollectionIds] = useState<Set<string> | null>(null);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.items.get(itemId), api.sessions.list(itemId)])
      .then(async ([fetchedItem, fetchedSessions]) => {
        const fetchedSessionList = fetchedSessions.sessions;
        setItem(fetchedItem);
        setSessions(fetchedSessionList);
        const rated = fetchedSessionList.filter((s) => s.rating !== null);
        if (rated.length > 0) {
          const avg = Math.round(rated.reduce((acc, s) => acc + s.rating!, 0) / rated.length);
          if (avg !== fetchedItem.rating) {
            try {
              const updated = await api.items.update(fetchedItem.id, { rating: avg });
              setItem(updated);
              onUpdated(updated);
            } catch {}
          }
        }
      })
      .catch(() => onBack())
      .finally(() => setLoading(false));
    api.tags.list().then(setTagSuggestions).catch(() => {});
  }, [itemId]);

  async function handleAddTag(tag: string) {
    if (!item || item.tags.includes(tag)) return;
    const newTags = [...item.tags, tag];
    try {
      const updated = await api.items.update(item.id, { tags: newTags });
      setItem(updated);
      onUpdated(updated);
    } catch {}
  }

  async function handleRemoveTag(tag: string) {
    if (!item) return;
    const newTags = item.tags.filter((t) => t !== tag);
    try {
      const updated = await api.items.update(item.id, { tags: newTags });
      setItem(updated);
      onUpdated(updated);
    } catch {}
  }

  async function loadMemberships() {
    if (!item || memberCollectionIds !== null || collections.length === 0) return;
    setCollectionsLoading(true);
    try {
      const details = await Promise.all(collections.map((c) => api.collections.get(c.id)));
      const members = new Set(
        details.filter((d) => d.items.some((i) => i.id === item.id)).map((d) => d.id),
      );
      setMemberCollectionIds(members);
    } catch {
      setMemberCollectionIds(new Set());
    } finally {
      setCollectionsLoading(false);
    }
  }

  async function recalcRating(updatedSessions: ApiSession[]) {
    if (!item) return;
    const rated = updatedSessions.filter((s) => s.rating !== null);
    if (rated.length === 0) return;
    const avg = Math.round(rated.reduce((acc, s) => acc + s.rating!, 0) / rated.length);
    if (avg === item.rating) return;
    try {
      const updated = await api.items.update(item.id, { rating: avg });
      setItem(updated);
      onUpdated(updated);
    } catch {}
  }

  async function handleToggleCollection(collId: string) {
    if (!item || memberCollectionIds === null) return;
    try {
      if (memberCollectionIds.has(collId)) {
        await api.collections.removeItem(collId, item.id);
        setMemberCollectionIds((prev) => { const s = new Set(prev!); s.delete(collId); return s; });
      } else {
        await api.collections.addItem(collId, { itemId: item.id });
        setMemberCollectionIds((prev) => new Set([...prev!, collId]));
      }
    } catch {}
  }

  async function handleStatusChange(newStatus: ItemStatus) {
    if (!item) return;
    try {
      const updated = await api.items.update(item.id, { status: newStatus });
      setItem(updated);
      onUpdated(updated);
      setEditingStatus(false);
    } catch {
      // silently keep current status
    }
  }

  async function handleDelete() {
    if (!item) return;
    try {
      await api.items.del(item.id);
      onDeleted();
    } catch {
      setShowDeleteConfirm(false);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!item) return;
    setDeletingSessionId(sessionId);
    try {
      await api.sessions.del(item.id, sessionId);
      const newSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(newSessions);
      await recalcRating(newSessions);
    } finally {
      setDeletingSessionId(null);
    }
  }

  async function handleCoverUpload(file: File) {
    if (!item) return;
    try {
      const { coverUrl } = await api.items.uploadCover(item.id, file);
      const updated = { ...item, coverUrl };
      setItem(updated);
      onUpdated(updated);
    } catch {
      // ignore
    }
  }

  async function handleDeleteCover() {
    if (!item) return;
    try {
      await api.items.deleteCover(item.id);
      const updated = { ...item, coverUrl: null };
      setItem(updated);
      onUpdated(updated);
    } catch {
      // ignore
    }
  }

  if (loading || !item) {
    return (
      <div className="detail-screen">
        <div className="screen-loader">Loading…</div>
      </div>
    );
  }

  const statuses: ItemStatus[] = ["planned", "in_progress", "completed", "on_hold"];
  const sessionLabel = item.type === "book" ? "READING HISTORY" : "WATCH HISTORY";

  return (
    <div className="detail-screen">
      <header className="detail-nav">
        <button onClick={onBack} aria-label="Back"><span>‹</span></button>
        <p>{typeLabel(item.type)} details</p>
        <button onClick={() => setShowDeleteConfirm(true)} aria-label="More options">•••</button>
      </header>

      <section className="book-hero">
        <div className="book-glow" />
        <Cover item={item} large />
        <p className="eyebrow">{typeLabel(item.type)} · {yearFromDate(item.createdAt)}</p>
        <h1>{item.title}</h1>
        {item.type === "book" && item.author && <p className="book-author">{item.author}</p>}
        {item.type === "film" && item.director && <p className="book-author">{item.director}</p>}
        {item.type === "series" && item.seasons && <p className="book-author">{item.seasons} season{item.seasons > 1 ? "s" : ""}</p>}
        <div className="rating-and-comment">
          <div className="book-rating">
            <i>{icons.star}</i>
            <strong>{item.rating !== null ? item.rating : "—"}</strong>
            <span>Your rating</span>
          </div>
          {item.notes && <p>&ldquo;{item.notes}&rdquo;</p>}
        </div>
      </section>

      {item.type === "book" && item.pages && (
        <section className="reading-progress">
          <div><span><strong>{item.pages}</strong> pages</span><b>&nbsp;</b></div>
          <span className="progress"><i style={{ width: "100%" }} /></span>
          <div style={{ display: "flex", gap: 8, marginTop: 0 }}>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setCoverFile(f); handleCoverUpload(f); }
              }}
            />
            <button style={{ flex: 1, height: 35, border: "1px solid #73816f", borderRadius: 9, background: "#455443", color: "white", fontSize: 9, fontWeight: 600, cursor: "pointer" }} onClick={() => coverInputRef.current?.click()}>
              {item.coverUrl ? "Change cover" : "Upload cover"}
            </button>
            {item.coverUrl && (
              <button style={{ height: 35, padding: "0 12px", border: "1px solid #73816f", borderRadius: 9, background: "#455443", color: "white", fontSize: 9, fontWeight: 600, cursor: "pointer" }} onClick={handleDeleteCover}>
                Remove
              </button>
            )}
          </div>
        </section>
      )}

      {item.type !== "book" && (
        <section style={{ margin: "14px 20px 0", display: "flex", gap: 8 }}>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setCoverFile(f); handleCoverUpload(f); }
            }}
          />
          <button style={{ flex: 1, height: 35, border: "1px solid #d8d6cd", borderRadius: 9, background: "#fbfaf6", fontSize: 9, fontWeight: 600, cursor: "pointer" }} onClick={() => coverInputRef.current?.click()}>
            {item.coverUrl ? "Change cover" : "+ Upload cover"}
          </button>
          {item.coverUrl && (
            <button style={{ height: 35, padding: "0 12px", border: "1px solid #d8d6cd", borderRadius: 9, background: "#fbfaf6", fontSize: 9, fontWeight: 600, cursor: "pointer", color: "#9a655c" }} onClick={handleDeleteCover}>
              Remove
            </button>
          )}
        </section>
      )}

      <section className="detail-section">
        <p className="eyebrow">DETAILS</p>
        <div className="detail-facts">
          <div>
            <span>Status</span>
            <strong>{statusLabel(item.status, item.type)}</strong>
          </div>
          {item.type === "film" && item.duration && (
            <div><span>Duration</span><strong>{item.duration} min</strong></div>
          )}
          {item.completedAt && (
            <div><span>Completed</span><strong>{new Date(item.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong></div>
          )}
          <div><span>Sessions</span><strong>{sessions.length}</strong></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="text-button" onClick={() => setEditingStatus(!editingStatus)}>
            Edit status {icons.chevron}
          </button>
          {editingStatus && (
            <div className="status-picker">
              {statuses.map((s) => (
                <button
                  key={s}
                  className={`status-pick-btn${item.status === s ? " active" : ""}`}
                  onClick={() => handleStatusChange(s)}
                >
                  {statusLabel(s, item.type)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-title">
          <div><p className="eyebrow">ORGANISE</p><h2>Tags</h2></div>
          <button className="text-button" onClick={() => setEditingTags(!editingTags)}>
            {editingTags ? "Done" : "Manage tags"} {icons.chevron}
          </button>
        </div>
        {!editingTags ? (
          item.tags.length > 0 ? (
            <div className="detail-chips">
              {item.tags.map((t) => <span key={t}>{t}</span>)}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "#777b70", margin: 0 }}>No tags yet.</p>
          )
        ) : (
          <>
            <div className="tag-input">
              {item.tags.map((t) => (
                <button key={t} onClick={() => handleRemoveTag(t)}>{t} ×</button>
              ))}
              <input
                autoFocus
                placeholder={item.tags.length > 0 ? "Add another…" : "Type a tag and press Enter"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    handleAddTag(e.currentTarget.value.trim());
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
            {tagSuggestions.filter((t) => !item.tags.includes(t)).length > 0 && (
              <div className="suggestions">
                <span>Suggested:</span>
                {tagSuggestions.filter((t) => !item.tags.includes(t)).slice(0, 5).map((t) => (
                  <button key={t} onClick={() => handleAddTag(t)}>+ {t}</button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {collections.length > 0 && (
        <section className="detail-section">
          <div className="detail-title">
            <div><p className="eyebrow">ORGANISE</p><h2>Collections</h2></div>
            {memberCollectionIds === null && (
              <button className="text-button" onClick={loadMemberships}>
                Manage {icons.chevron}
              </button>
            )}
          </div>
          {collectionsLoading && (
            <p style={{ fontSize: 12, color: "#777b70" }}>Loading…</p>
          )}
          {memberCollectionIds !== null && (
            <div className="collection-picker">
              {collections.map((c) => (
                <button
                  key={c.id}
                  className={memberCollectionIds.has(c.id) ? "selected" : ""}
                  onClick={() => handleToggleCollection(c.id)}
                >
                  <i>{memberCollectionIds.has(c.id) ? "✓" : ""}</i>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="detail-section">
        <div className="detail-title">
          <div>
            <p className="eyebrow">{sessionLabel}</p>
            <h2>Sessions <span>{sessions.length}</span></h2>
          </div>
          <button onClick={() => setAddingSession(true)}>+ Add session</button>
        </div>
        {sessions.length === 0 && (
          <p style={{ color: "#777b70", fontSize: 12 }}>No sessions yet. Log your first one!</p>
        )}
        <div className="session-list">
          {sessions.map((session) => (
            <article className="session-card" key={session.id}>
              <div className="session-top">
                <span>{formatSessionDate(session.date)}</span>
                {session.rating !== null && (
                  <strong><i>{icons.star}</i> {session.rating}</strong>
                )}
              </div>
              {session.note && <p>{session.note}</p>}
              <footer>
                <span>{session.date}</span>
                <button
                  aria-label="Delete session"
                  disabled={deletingSessionId === session.id}
                  onClick={() => handleDeleteSession(session.id)}
                  style={{ color: "#9a655c" }}
                >
                  {deletingSessionId === session.id ? "…" : "Delete"}
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>

      {addingSession && (
        <AddSessionSheet
          itemId={item.id}
          itemType={item.type}
          onClose={() => setAddingSession(false)}
          onAdded={async (session) => {
            const newSessions = [session, ...sessions];
            setSessions(newSessions);
            setAddingSession(false);
            await recalcRating(newSessions);
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="confirm-overlay" onMouseDown={() => setShowDeleteConfirm(false)}>
          <div className="confirm-card" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Delete item?</h3>
            <p>"{item.title}" will be permanently removed from your library.</p>
            <div className="confirm-actions">
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="destructive" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {coverFile && null /* consumed */}
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function Stats() {
  const [period, setPeriod] = useState<"month" | "year" | "all">("year");
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.stats.get(period).then(setStats).catch(() => setStats(null)).finally(() => setLoading(false));
  }, [period]);

  const periodLabel = period === "month" ? "this month" : period === "year" ? "this year" : "all time";

  const total = stats?.total ?? 0;
  const films = stats?.films ?? 0;
  const books = stats?.books ?? 0;
  const series = stats?.series ?? 0;
  const filmsWidth = total > 0 ? `${Math.round((films / total) * 100)}%` : "0%";
  const booksWidth = total > 0 ? `${Math.round((books / total) * 100)}%` : "0%";
  const seriesWidth = total > 0 ? `${Math.round((series / total) * 100)}%` : "0%";

  return (
    <>
      <header className="page-header"><p className="eyebrow">YOUR ACTIVITY</p><h1>Stats</h1></header>
      <div className="period-row">
        {(["month", "year", "all"] as const).map((p) => (
          <button key={p} className={`period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
            {p === "month" ? "This month" : p === "year" ? "This year" : "All time"}
          </button>
        ))}
      </div>
      <section className="stat-feature">
        <p>Completed {periodLabel}</p>
        <strong>{loading ? "—" : total}</strong>
        <span>items across books, films and series</span>
        <div className="spark"><i /><i /><i /><i /><i /><i /><i /><i /></div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">BREAKDOWN</p><h2>By medium</h2></div>
        </div>
        <div className="stat-list">
          {[
            ["Films", films, filmsWidth],
            ["Books", books, booksWidth],
            ["Series", series, seriesWidth],
          ].map(([name, count, width]) => (
            <div className="stat-row" key={String(name)}>
              <span><strong>{name}</strong><small>{count} completed</small></span>
              <b>{count}</b>
              <div><i style={{ width: String(width) }} /></div>
            </div>
          ))}
        </div>
      </section>
      <section className="quote-card">
        <p>&ldquo;A story is a way to say something that can&apos;t be said any other way.&rdquo;</p>
        <span>— Flannery O&apos;Connor</span>
      </section>
    </>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function Profile({
  user,
  items,
  collections,
  onSignOut,
  onNicknameUpdate,
  onCollectionsChange,
}: {
  user: ApiUser;
  items: ApiItem[];
  collections: ApiCollection[];
  onSignOut: () => void;
  onNicknameUpdate: (user: ApiUser) => void;
  onCollectionsChange: (cols: ApiCollection[]) => void;
}) {
  const [showCollections, setShowCollections] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newCollName, setNewCollName] = useState("");
  const [nickname, setNickname] = useState(user.nickname);
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  async function handleCreateCollection() {
    if (!newCollName.trim()) return;
    try {
      const col = await api.collections.create({ name: newCollName.trim() });
      onCollectionsChange([...collections, col]);
      setNewCollName("");
    } catch {
      // ignore
    }
  }

  async function handleDeleteCollection(id: string) {
    try {
      await api.collections.del(id);
      onCollectionsChange(collections.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  }

  async function handleSaveNickname() {
    setNicknameError("");
    if (nickname.trim().length < 2) { setNicknameError("Min 2 characters."); return; }
    setSavingNickname(true);
    try {
      const updated = await api.users.updateNickname({ nickname: nickname.trim() });
      onNicknameUpdate(updated);
      setShowSettings(false);
    } catch {
      setNicknameError("Failed to update. Try again.");
    } finally {
      setSavingNickname(false);
    }
  }

  async function handleSignOut() {
    try { await api.auth.logout(); } catch { /* ignore */ }
    onSignOut();
  }

  return (
    <>
      <header className="page-header profile-head">
        <div className="profile-avatar">{initials(user.nickname)}</div>
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>{user.nickname}</h1>
        <p>{user.email}</p>
      </header>
      <section className="profile-counts">
        <div><strong>{items.length}</strong><span>Library</span></div>
        <div><strong>{collections.length}</strong><span>Collections</span></div>
        <div><strong>—</strong><span>Sessions</span></div>
      </section>
      <section className="menu-card">
        <button onClick={() => { setShowCollections(!showCollections); setShowSettings(false); }}>
          <span>My collections</span>{icons.chevron}
        </button>
        <button onClick={() => { setShowSettings(!showSettings); setShowCollections(false); }}>
          <span>Account settings</span>{icons.chevron}
        </button>
      </section>

      {showCollections && (
        <div className="collections-list">
          {collections.length === 0 && (
            <p style={{ fontSize: 12, color: "#777b70", padding: "12px 0" }}>No collections yet.</p>
          )}
          {collections.map((c) => (
            <div className="collection-row" key={c.id}>
              <span>{c.name}</span>
              <button onClick={() => handleDeleteCollection(c.id)}>Delete</button>
            </div>
          ))}
          <div className="new-coll-row">
            <input
              value={newCollName}
              onChange={(e) => setNewCollName(e.target.value)}
              placeholder="New collection name"
              onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
            />
            <button onClick={handleCreateCollection}>Create</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div>
          <div className="nickname-edit">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nickname"
            />
            <button onClick={handleSaveNickname} disabled={savingNickname}>
              {savingNickname ? "…" : "Save"}
            </button>
          </div>
          {nicknameError && <p style={{ color: "#9a3a2e", fontSize: 11, margin: "6px 20px 0" }}>{nicknameError}</p>}
        </div>
      )}

      <button className="signout" onClick={handleSignOut}>Sign out</button>
    </>
  );
}

// ─── Add Item Sheet ───────────────────────────────────────────────────────────

function AddSheet({
  collections,
  onClose,
  onAdded,
}: {
  collections: ApiCollection[];
  onClose: () => void;
  onAdded: (item: ApiItem) => void;
}) {
  const [type, setType] = useState<"film" | "series" | "book">("film");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [seasons, setSeasons] = useState("");
  const [director, setDirector] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<ApiItem["status"]>("planned");
  const [rating, setRating] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverName, setCoverName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.tags.list().then(setTagSuggestions).catch(() => setTagSuggestions(["Sci-fi", "Drama", "Favourites"]));
  }, []);

  const toggleCollection = (id: string) => {
    setSelectedCollections((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  async function handleSave() {
    setError("");
    if (!title.trim()) { setError("Title is required."); return; }
    setLoading(true);
    try {
      const body: Parameters<typeof api.items.create>[0] = {
        title: title.trim(),
        type,
        status,
        tags,
        rating: rating !== "" ? parseInt(rating, 10) : null,
        ...(type === "book" && { author: author.trim() || null, pages: pages ? parseInt(pages, 10) : null }),
        ...(type === "series" && { seasons: seasons ? parseInt(seasons, 10) : null }),
        ...(type === "film" && { director: director.trim() || null, duration: duration ? parseInt(duration, 10) : null }),
      };
      const newItem = await api.items.create(body);

      if (coverFile) {
        try {
          const { coverUrl } = await api.items.uploadCover(newItem.id, coverFile);
          newItem.coverUrl = coverUrl;
        } catch { /* non-fatal */ }
      }

      for (const collId of selectedCollections) {
        try { await api.collections.addItem(collId, { itemId: newItem.id }); } catch { /* skip */ }
      }

      onAdded(newItem);
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 400) {
        setError("Please check your inputs.");
      } else {
        setError("Failed to add item. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const displayType = type === "film" ? "Film" : type === "series" ? "Series" : "Book";

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <div><p className="eyebrow">NEW TO YOUR LIBRARY</p><h2>Add an item</h2></div>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>
        <label className="field">
          <span>Name</span>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title of the book, film or series" />
        </label>
        <div className="field">
          <span>Type</span>
          <div className="type-row">
            {(["film", "series", "book"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} className={type === t ? "active" : ""}>
                {t === "film" ? "Film" : t === "series" ? "Series" : "Book"}
              </button>
            ))}
          </div>
        </div>
        {type === "book" && (
          <div className="field-pair">
            <label className="field"><span>Author</span><input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" /></label>
            <label className="field"><span>Pages</span><input inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="e.g. 320" /></label>
          </div>
        )}
        {type === "series" && (
          <label className="field"><span>Number of seasons</span><input inputMode="numeric" value={seasons} onChange={(e) => setSeasons(e.target.value)} placeholder="e.g. 3" /></label>
        )}
        {type === "film" && (
          <div className="field-pair">
            <label className="field"><span>Director</span><input value={director} onChange={(e) => setDirector(e.target.value)} placeholder="Director name" /></label>
            <label className="field"><span>Duration (min)</span><input inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 126" /></label>
          </div>
        )}
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as ApiItem["status"])}>
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On hold</option>
          </select>
        </label>
        <label className="field">
          <span>Rating (0–10, optional)</span>
          <div className="session-rating-field">
            <input
              type="number"
              min={0}
              max={10}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="e.g. 8"
            />
          </div>
        </label>
        <div className="field">
          <span>Cover image</span>
          <label className={coverName ? "cover-upload has-file" : "cover-upload"}>
            <input
              accept="image/jpeg,image/png,image/webp"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setCoverFile(f); setCoverName(f.name); }
              }}
            />
            <b>{coverName ? "Image selected" : `+ Upload cover`}</b>
            <small>{coverName || "JPEG, PNG or WebP · max 5 MB"}</small>
          </label>
        </div>
        <div className="field">
          <span>Tags</span>
          <div className="tag-input">
            {tags.map((t) => (
              <button key={t} onClick={() => setTags((prev) => prev.filter((x) => x !== t))}>{t} ×</button>
            ))}
            <input
              placeholder={tags.length > 0 ? "Add another…" : "Type a tag and press Enter"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  const val = e.currentTarget.value.trim();
                  if (!tags.includes(val)) setTags((prev) => [...prev, val]);
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
          {tagSuggestions.length > 0 && (
            <div className="suggestions">
              <span>Suggested:</span>
              {tagSuggestions.slice(0, 5).map((t) => (
                <button key={t} onClick={() => !tags.includes(t) && setTags((prev) => [...prev, t])}>+ {t}</button>
              ))}
            </div>
          )}
        </div>
        {collections.length > 0 && (
          <div className="field">
            <span>Add to collections</span>
            <div className="collection-picker">
              {collections.map((c) => (
                <button key={c.id} className={selectedCollections.includes(c.id) ? "selected" : ""} onClick={() => toggleCollection(c.id)}>
                  <i>{selectedCollections.includes(c.id) ? "✓" : ""}</i><span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p style={{ color: "#9a3a2e", fontSize: 11, margin: "0 0 10px" }}>{error}</p>}
        <button className="save-btn" onClick={handleSave} disabled={loading}>
          {loading ? "Adding…" : `Add ${displayType.toLowerCase()} to library`}
        </button>
      </section>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [items, setItems] = useState<ApiItem[]>([]);
  const [collections, setCollections] = useState<ApiCollection[]>([]);
  const [tab, setTab] = useState<Tab>("Home");
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [collectionFocus, setCollectionFocus] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mt_user");
    if (!stored) { setChecking(false); return; }

    const cached = JSON.parse(stored) as ApiUser;
    Promise.all([api.items.list(), api.collections.list()])
      .then(([fetchedItems, fetchedCollections]) => {
        setUser(cached);
        setItems(fetchedItems);
        setCollections(fetchedCollections);
      })
      .catch(() => {
        localStorage.removeItem("mt_user");
      })
      .finally(() => setChecking(false));
  }, []);

  async function handleAuth(loggedInUser: ApiUser) {
    localStorage.setItem("mt_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    try {
      const [fetchedItems, fetchedCollections] = await Promise.all([api.items.list(), api.collections.list()]);
      setItems(fetchedItems);
      setCollections(fetchedCollections);
    } catch {
      setItems([]);
      setCollections([]);
    }
  }

  async function handleSignOut() {
    localStorage.removeItem("mt_user");
    setUser(null);
    setItems([]);
    setCollections([]);
    setTab("Home");
    setOpenItemId(null);
  }

  function refreshItems() {
    api.items.list().then(setItems).catch(() => { });
  }

  function handleItemUpdated(updated: ApiItem) {
    setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
  }

  function handleItemDeleted(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setOpenItemId(null);
    setTab("Library");
  }

  if (checking) {
    return (
      <div className="app-shell">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
          <p style={{ color: "#777b70", fontSize: 12 }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-shell">
        <AuthScreen onAuth={handleAuth} />
      </div>
    );
  }

  const showNav = openItemId === null;

  return (
    <div className="app-shell">
      <main>
        {openItemId ? (
          <ItemDetail
            itemId={openItemId}
            collections={collections}
            onBack={() => setOpenItemId(null)}
            onDeleted={() => handleItemDeleted(openItemId)}
            onUpdated={handleItemUpdated}
          />
        ) : (
          <>
            {tab === "Home" && (
              <Home
                user={user}
                items={items}
                collections={collections}
                onOpenLibrary={() => setTab("Library")}
                onOpenItem={setOpenItemId}
                onOpenCollection={(id) => { setTab("Library"); setCollectionFocus(id); }}
              />
            )}
            {tab === "Library" && (
              <Library
                items={items}
                collections={collections}
                onOpenItem={setOpenItemId}
                focusCollectionId={collectionFocus}
                onFocusConsumed={() => setCollectionFocus(null)}
              />
            )}
            {tab === "Stats" && <Stats />}
            {tab === "Profile" && (
              <Profile
                user={user}
                items={items}
                collections={collections}
                onSignOut={handleSignOut}
                onNicknameUpdate={(updated) => {
                  setUser(updated);
                  localStorage.setItem("mt_user", JSON.stringify(updated));
                }}
                onCollectionsChange={setCollections}
              />
            )}
          </>
        )}
      </main>

      {showNav && (
        <nav className="bottom-nav" aria-label="Primary">
          {(["Home", "Library", "Stats", "Profile"] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
              {icons[t.toLowerCase() as keyof typeof icons]}<span>{t}</span>
            </button>
          ))}
          <button className="add-button" aria-label="Add item" onClick={() => setAdding(true)}>{icons.plus}</button>
        </nav>
      )}

      {adding && (
        <AddSheet
          collections={collections}
          onClose={() => setAdding(false)}
          onAdded={(newItem) => {
            setItems((prev) => [newItem, ...prev]);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}
