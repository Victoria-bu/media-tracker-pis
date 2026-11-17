import { useMemo, useState, type ReactNode } from "react";

type Tab = "Home" | "Library" | "Stats" | "Profile";
type Filter = "All" | "Films" | "Series" | "Books";

const mountain =
  "https://images.unsplash.com/photo-1612450639537-d44bc045efc7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=86&w=900";

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
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
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

const items = [
  { title: "Severance", type: "Series", detail: "2 seasons · 2022", status: "Watching", progress: 72, cover: "severance", rating: "9.2", tags: ["Mind-bending", "Drama"], collections: ["2026 Best"], added: 6 },
  { title: "Klara and the Sun", type: "Books", detail: "Kazuo Ishiguro · 303 pages", status: "Reading", progress: 61, cover: "klara", rating: "8.7", tags: ["Sci-fi", "Reflective"], collections: ["2026 Best", "Quiet stories"], added: 5 },
  { title: "Past Lives", type: "Films", detail: "Celine Song · 2023", status: "Completed", progress: 100, cover: "past", rating: "8.9", tags: ["Drama", "Favourites"], collections: ["2026 Best", "Favourites"], added: 4 },
  { title: "The Bear", type: "Series", detail: "3 seasons · 2022", status: "Watching", progress: 48, cover: "bear", rating: "8.6", tags: ["Drama"], collections: ["Favourites"], added: 3 },
  { title: "Dune: Part Two", type: "Films", detail: "Denis Villeneuve · 2024", status: "Planned", progress: 0, cover: "dune", rating: "8.8", tags: ["Sci-fi"], collections: ["Watch next"], added: 2 },
  { title: "Slow Horses", type: "Series", detail: "4 seasons · 2022", status: "On hold", progress: 35, cover: "horses", rating: "8.3", tags: ["Thriller"], collections: ["Watch next"], added: 1 },
];

function Cover({ kind, large = false }: { kind: string; large?: boolean }) {
  return (
    <div className={`cover cover-${kind} ${large ? "cover-large" : ""}`}>
      {kind === "severance" && <><span className="cover-kicker">A LUMON ORIGINAL</span><strong>SEVE<br />RANCE</strong></>}
      {kind === "klara" && <><span className="sun" /><strong>KLARA<br /><i>and the</i><br />SUN</strong><small>KAZUO ISHIGURO</small></>}
      {kind === "past" && <><span className="past-line" /><strong>PAST<br />LIVES</strong><small>A FILM BY CELINE SONG</small></>}
      {kind === "bear" && <><span className="bear-circle">THE<br /><b>BEAR</b></span></>}
      {kind === "dune" && <><span className="dune-sun" /><strong>DUNE</strong><small>PART TWO</small></>}
      {kind === "horses" && <><span className="horse-rule" /><strong>SLOW<br />HORSES</strong><small>AN APPLE ORIGINAL</small></>}
    </div>
  );
}

function Home({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">THURSDAY, 25 SEP</p>
          <h1>Good evening, Vic</h1>
        </div>
        <button className="avatar" aria-label="Open profile">VB</button>
      </header>

      <section className="hero">
        <img src={mountain} alt="Snow-covered mountains at dusk" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <span className="hero-label">FEATURED FROM YOUR LIST</span>
          <h2>Finish what<br />you started.</h2>
          <p>Interstellar · 42 min remaining</p>
          <button className="primary-btn">{icons.play} Continue watching</button>
        </div>
        <span className="photo-credit">Photo: Sead Dedić</span>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">IN PROGRESS</p><h2>Continue</h2></div>
          <button className="text-button" onClick={onOpenLibrary}>See all {icons.chevron}</button>
        </div>
        <div className="continue-list">
          {items.slice(0, 2).map((item) => (
            <button className="continue-card" key={item.title}>
              <Cover kind={item.cover} />
              <span className="continue-copy">
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <span className="progress"><i style={{ width: `${item.progress}%` }} /></span>
                <small className="progress-label">{item.progress}% complete</small>
              </span>
              <span className="round-play">{icons.play}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section recent">
        <div className="section-heading">
          <div><p className="eyebrow">YOUR LIBRARY</p><h2>Recently added</h2></div>
          <button className="text-button" onClick={onOpenLibrary}>See all {icons.chevron}</button>
        </div>
        <div className="poster-row">
          {items.slice(1).map((item) => (
            <button className="poster-card" key={item.title}>
              <Cover kind={item.cover} large />
              <strong>{item.title}</strong>
              <span><i>{icons.star}</i> {item.rating} · {item.status}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function Library({ onOpenBook }: { onOpenBook: () => void }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tag, setTag] = useState("All tags");
  const [collection, setCollection] = useState("All collections");
  const [sort, setSort] = useState("Most recent");
  const shown = useMemo(
    () => items
      .filter((item) =>
        (filter === "All" || item.type === filter) &&
        item.title.toLowerCase().includes(query.toLowerCase()) &&
        (tag === "All tags" || item.tags.includes(tag)) &&
        (collection === "All collections" || item.collections.includes(collection)),
      )
      .sort((a, b) => sort === "Rating" ? Number(b.rating) - Number(a.rating) : sort === "Title" ? a.title.localeCompare(b.title) : b.added - a.added),
    [collection, filter, query, sort, tag],
  );
  const activeFilterCount = Number(tag !== "All tags") + Number(collection !== "All collections");

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">36 SAVED ITEMS</p>
        <h1>Your library</h1>
        <label className="search-box">{icons.search}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, people, tags" /></label>
      </header>
      <div className="filter-row">
        {(["All", "Films", "Series", "Books"] as Filter[]).map((value) => (
          <button key={value} className={filter === value ? "filter active" : "filter"} onClick={() => setFilter(value)}>
            {value}<span>{value === "All" ? items.length : items.filter((item) => item.type === value).length}</span>
          </button>
        ))}
      </div>
      <div className="catalog-tools">
        <button className={activeFilterCount ? "tool-button has-filter" : "tool-button"} onClick={() => setShowFilters(!showFilters)}>
          <span className="sliders">≡</span> Tags & collections {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
        </button>
        <label className="sort-control">
          <span>Sort:</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option>Most recent</option>
            <option>Rating</option>
            <option>Title</option>
          </select>
        </label>
      </div>
      {showFilters && (
        <section className="filter-panel">
          <div className="filter-panel-heading"><strong>Refine your library</strong><button onClick={() => { setTag("All tags"); setCollection("All collections"); }}>Clear all</button></div>
          <p>Tags</p>
          <div className="choice-row">{["All tags", "Drama", "Sci-fi", "Reflective", "Favourites"].map((value) => <button className={tag === value ? "active" : ""} onClick={() => setTag(value)} key={value}>{value}</button>)}</div>
          <p>Collections</p>
          <div className="choice-row">{["All collections", "2026 Best", "Favourites", "Watch next"].map((value) => <button className={collection === value ? "active" : ""} onClick={() => setCollection(value)} key={value}>{value}</button>)}</div>
        </section>
      )}
      <div className="results-line"><span>{shown.length} {shown.length === 1 ? "item" : "items"}</span><i /></div>
      <section className="library-grid">
        {shown.map((item) => (
          <button className="library-card" key={item.title} onClick={item.type === "Books" ? onOpenBook : undefined}>
            <Cover kind={item.cover} large />
            <span className={`status-pill status-${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span>
            <span className="media-type">{item.type === "Films" ? "FILM" : item.type === "Series" ? "SERIES" : "BOOK"}</span>
            <strong>{item.title}</strong>
            <span className="meta-detail">{item.detail}</span>
            <span className="meta"><i>{icons.star}</i> {item.rating}<b>·</b>{item.status}</span>
          </button>
        ))}
        {shown.length === 0 && <div className="empty"><strong>No matches</strong><p>Try another title or clear the filter.</p></div>}
      </section>
    </>
  );
}

function BookDetails({ onBack }: { onBack: () => void }) {
  return (
    <div className="detail-screen">
      <header className="detail-nav">
        <button onClick={onBack} aria-label="Back"><span>‹</span></button>
        <p>Book details</p>
        <button aria-label="More options">•••</button>
      </header>
      <section className="book-hero">
        <div className="book-glow" />
        <Cover kind="klara" large />
        <p className="eyebrow">BOOK · 2021</p>
        <h1>Klara and the Sun</h1>
        <p className="book-author">Kazuo Ishiguro</p>
        <div className="rating-and-comment">
          <div className="book-rating"><i>{icons.star}</i><strong>8.7</strong><span>Your rating</span></div>
          <p>“Beautifully restrained and quietly unsettling.”</p>
        </div>
      </section>
      <section className="reading-progress">
        <div><span><strong>184</strong> of 303 pages</span><b>61%</b></div>
        <span className="progress"><i style={{ width: "61%" }} /></span>
        <button>Update progress</button>
      </section>
      <section className="detail-section">
        <p className="eyebrow">DETAILS</p>
        <div className="detail-facts">
          <div><span>Status</span><strong>Reading</strong></div>
          <div><span>Started</span><strong>12 Sep 2026</strong></div>
          <div><span>Sessions</span><strong>3 reading logs</strong></div>
        </div>
      </section>
      <section className="detail-section">
        <div className="detail-title"><div><p className="eyebrow">ORGANISE</p><h2>Tags & collections</h2></div><button>Edit</button></div>
        <p className="label">TAGS</p>
        <div className="detail-chips"><span>Sci-fi</span><span>Reflective</span><span>Literary</span></div>
        <p className="label">COLLECTIONS</p>
        <div className="collection-list">
          <div><span className="collection-mark">26</span><p><strong>2026 Best</strong><small>8 items</small></p>{icons.chevron}</div>
          <div><span className="collection-mark quiet">QS</span><p><strong>Quiet stories</strong><small>5 items</small></p>{icons.chevron}</div>
        </div>
      </section>
      <section className="detail-section">
        <div className="detail-title"><div><p className="eyebrow">READING HISTORY</p><h2>Sessions <span>3</span></h2></div><button>+ Add session</button></div>
        <div className="session-list">
          <article className="session-card">
            <div className="session-top"><span>25 SEP 2026</span><strong><i>{icons.star}</i> 8.7</strong></div>
            <p>Beautifully restrained. Klara’s observations make ordinary human behavior feel strange and newly visible.</p>
            <footer><span>Read pages 143–184</span><button aria-label="Session options">•••</button></footer>
          </article>
          <article className="session-card">
            <div className="session-top"><span>19 SEP 2026</span><strong><i>{icons.star}</i> 8.5</strong></div>
            <p>The point of view is so precise. I’m starting to notice how Klara reads every gesture as a clue.</p>
            <footer><span>Read pages 72–142</span><button aria-label="Session options">•••</button></footer>
          </article>
          <article className="session-card">
            <div className="session-top"><span>12 SEP 2026</span><strong><i>{icons.star}</i> 8.0</strong></div>
            <p>A slow, intriguing beginning. The store window scenes already feel tender and a little eerie.</p>
            <footer><span>Read pages 1–71</span><button aria-label="Session options">•••</button></footer>
          </article>
        </div>
      </section>
    </div>
  );
}

function Stats() {
  return (
    <>
      <header className="page-header"><p className="eyebrow">YOUR ACTIVITY</p><h1>Stats</h1></header>
      <section className="stat-feature">
        <p>Completed this year</p><strong>47</strong><span>items across books, films and series</span>
        <div className="spark"><i /><i /><i /><i /><i /><i /><i /><i /></div>
      </section>
      <section className="section">
        <div className="section-heading"><div><p className="eyebrow">BREAKDOWN</p><h2>By medium</h2></div><button className="filter active">This year</button></div>
        <div className="stat-list">
          {[["Films", "23", "49%"], ["Books", "15", "32%"], ["Series", "9", "19%"]].map(([name, count, width]) => (
            <div className="stat-row" key={name}><span><strong>{name}</strong><small>{count} completed</small></span><b>{count}</b><div><i style={{ width }} /></div></div>
          ))}
        </div>
      </section>
      <section className="quote-card"><p>“A story is a way to say something that can’t be said any other way.”</p><span>— Flannery O’Connor</span></section>
    </>
  );
}

function Profile() {
  return (
    <>
      <header className="page-header profile-head"><div className="profile-avatar">VB</div><p className="eyebrow">MEMBER SINCE 2024</p><h1>Victoria</h1><p>Stories collected with intention.</p></header>
      <section className="profile-counts"><div><strong>36</strong><span>Library</span></div><div><strong>5</strong><span>Collections</span></div><div><strong>84</strong><span>Sessions</span></div></section>
      <section className="menu-card">
        {["My collections", "Favourite tags", "Account settings"].map((label) => <button key={label}><span>{label}</span>{icons.chevron}</button>)}
      </section>
      <button className="signout">Sign out</button>
    </>
  );
}

function AddSheet({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState("Film");
  const [coverName, setCoverName] = useState("");
  const [tags, setTags] = useState([""]);
  const [collections, setCollections] = useState<string[]>(["2026 Best"]);

  const toggleCollection = (name: string) => {
    setCollections((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section className="sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title"><div><p className="eyebrow">NEW TO YOUR LIBRARY</p><h2>Add an item</h2></div><button onClick={onClose} aria-label="Close">×</button></div>
        <label className="field"><span>Name</span><input autoFocus placeholder="Title of the book, film or series" /></label>
        <div className="field"><span>Type</span><div className="type-row">{["Film", "Series", "Book"].map((item) => <button key={item} onClick={() => setType(item)} className={type === item ? "active" : ""}>{item}</button>)}</div></div>
        {type === "Book" && (
          <div className="field-pair">
            <label className="field"><span>Author</span><input placeholder="Author name" /></label>
            <label className="field"><span>Pages</span><input inputMode="numeric" placeholder="e.g. 320" /></label>
          </div>
        )}
        {type === "Series" && (
          <label className="field"><span>Number of seasons</span><input inputMode="numeric" placeholder="e.g. 3" /></label>
        )}
        {type === "Film" && (
          <div className="field-pair">
            <label className="field"><span>Director</span><input placeholder="Director name" /></label>
            <label className="field"><span>Duration</span><input placeholder="e.g. 126 min" /></label>
          </div>
        )}
        <label className="field"><span>Status</span><select defaultValue="Planned"><option>Planned</option><option>In progress</option><option>Completed</option><option>On hold</option></select></label>
        <div className="field">
          <span>Cover image</span>
          <label className={coverName ? "cover-upload has-file" : "cover-upload"}>
            <input
              accept="image/jpeg,image/png,image/webp"
              type="file"
              onChange={(event) => setCoverName(event.target.files?.[0]?.name ?? "")}
            />
            <b>{coverName ? "Image selected" : "+ Upload cover"}</b>
            <small>{coverName || "JPEG, PNG or WebP · max 5 MB"}</small>
          </label>
        </div>
        <div className="field">
          <span>Tags</span>
          <div className="tag-input">
            {tags.filter(Boolean).map((tag) => <button key={tag} onClick={() => setTags((current) => current.filter((item) => item !== tag))}>{tag} ×</button>)}
            <input
              placeholder={tags.some(Boolean) ? "Add another…" : "Type a tag and press Enter"}
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.currentTarget.value.trim()) {
                  event.preventDefault();
                  setTags((current) => [...current.filter(Boolean), event.currentTarget.value.trim()]);
                  event.currentTarget.value = "";
                }
              }}
            />
          </div>
          <div className="suggestions"><span>Suggested:</span>{["Sci-fi", "Drama", "Favourites"].map((tag) => <button key={tag} onClick={() => !tags.includes(tag) && setTags((current) => [...current.filter(Boolean), tag])}>+ {tag}</button>)}</div>
        </div>
        <div className="field">
          <span>Add to collections</span>
          <div className="collection-picker">
            {["2026 Best", "Favourites", "Watch next", "Quiet stories"].map((name) => (
              <button key={name} className={collections.includes(name) ? "selected" : ""} onClick={() => toggleCollection(name)}>
                <i>{collections.includes(name) ? "✓" : ""}</i><span>{name}</span>
              </button>
            ))}
          </div>
          <button className="new-collection">+ Create new collection</button>
        </div>
        <button className="save-btn" onClick={onClose}>Add to library</button>
      </section>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("Home");
  const [adding, setAdding] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  return (
    <div className="app-shell">
      <main>
        {bookOpen ? <BookDetails onBack={() => setBookOpen(false)} /> : <>
          {tab === "Home" && <Home onOpenLibrary={() => setTab("Library")} />}
          {tab === "Library" && <Library onOpenBook={() => setBookOpen(true)} />}
          {tab === "Stats" && <Stats />}
          {tab === "Profile" && <Profile />}
        </>}
      </main>
      {!bookOpen && <nav className="bottom-nav" aria-label="Primary">
        {(["Home", "Library", "Stats", "Profile"] as Tab[]).map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {icons[item.toLowerCase() as keyof typeof icons]}<span>{item}</span>
          </button>
        ))}
        <button className="add-button" aria-label="Add item" onClick={() => setAdding(true)}>{icons.plus}</button>
      </nav>}
      {adding && <AddSheet onClose={() => setAdding(false)} />}
    </div>
  );
}
