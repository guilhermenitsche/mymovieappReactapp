import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";


const TMDB_API_KEY = "b43bdb46bc02c806d2f9c4cb86c992df"; // <- substitua pela sua chave
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG = {
  w92: (p) => (p ? `https://image.tmdb.org/t/p/w92${p}` : null),
  w154: (p) => (p ? `https://image.tmdb.org/t/p/w154${p}` : null),
  w342: (p) => (p ? `https://image.tmdb.org/t/p/w342${p}` : null),
  original: (p) => (p ? `https://image.tmdb.org/t/p/original${p}` : null),
};

// --- Helpers de Favoritos (localStorage) ---
const FAV_KEY = "tmdb_favorites_v1";
const loadFavs = () => {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveFavs = (arr) => localStorage.setItem(FAV_KEY, JSON.stringify(arr));
const useFavorites = () => {
  const [favs, setFavs] = useState(loadFavs());
  useEffect(() => saveFavs(favs), [favs]);
  const add = (movie) =>
    setFavs((prev) => (prev.find((m) => m.id === movie.id) ? prev : [...prev, movie]));
  const remove = (id) => setFavs((prev) => prev.filter((m) => m.id !== id));
  const has = (id) => favs.some((m) => m.id === id);
  return { favs, add, remove, has };
};

const Container = ({ children }) => (
  <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
);

const Nav = ({ favCount }) => (
  <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
    <Container>
      <div className="flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold tracking-tight">🎬 CineFinder</Link>
        <nav className="flex items-center gap-3">
          <Link className="px-3 py-2 rounded-xl hover:bg-gray-100" to="/">Buscar</Link>
          <Link className="px-3 py-2 rounded-xl hover:bg-gray-100" to="/favoritos">Favoritos <span className="ml-1 text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">{favCount}</span></Link>
          <a className="px-3 py-2 rounded-xl hover:bg-gray-100" href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB</a>
        </nav>
      </div>
    </Container>
  </header>
);

const Badge = ({ children }) => (
  <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 border">{children}</span>
);

const Loading = () => (
  <div className="flex items-center justify-center p-8 text-gray-500">Carregando…</div>
);

const ErrorBox = ({ message }) => (
  <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{message}</div>
);

const Empty = ({ children }) => (
  <div className="p-6 text-center text-gray-500">{children}</div>
);

// --- Componentes ---
function SearchInput() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") || "";
  const [term, setTerm] = useState(q);

  const submit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (term.trim()) {
      next.set("q", term.trim());
      next.set("page", "1");
    } else {
      next.delete("q");
      next.delete("page");
    }
    navigate({ pathname: "/", search: next.toString() });
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-gray-300"
        placeholder="Busque por título (ex: Inception)"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <button className="px-4 py-3 rounded-2xl border bg-gray-900 text-white hover:brightness-95 active:translate-y-px" type="submit">
        Buscar
      </button>
    </form>
  );
}

function MovieGrid({ items, onToggleFav, isFav }) {
  if (!items?.length) return <Empty>Nenhum resultado.</Empty>;
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((m) => (
        <article key={m.id} className="rounded-2xl border overflow-hidden bg-white group">
          <Link to={`/detalhes/${m.id}`} className="block">
            {m.poster_path ? (
              <img src={IMG.w342(m.poster_path)} alt={m.title} className="w-full aspect-[2/3] object-cover group-hover:opacity-90" />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-100 flex items-center justify-center text-gray-400">Sem pôster</div>
            )}
          </Link>
          <div className="p-3 space-y-2">
            <Link to={`/detalhes/${m.id}`} className="font-medium line-clamp-2 hover:underline">{m.title}</Link>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{(m.release_date || "").slice(0, 4) || "—"}</span>
              <Badge>⭐ {m.vote_average?.toFixed?.(1) ?? "-"}</Badge>
            </div>
            <button onClick={() => onToggleFav(m)} className={`w-full mt-1 px-3 py-2 rounded-xl border ${isFav(m.id) ? "bg-yellow-100 border-yellow-300" : "hover:bg-gray-50"}`}>
              {isFav(m.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Pagination({ page, totalPages, onGo }) {
  if (!totalPages || totalPages <= 1) return null;
  const p = Number(page || 1);
  const prevDisabled = p <= 1;
  const nextDisabled = p >= totalPages;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button disabled={prevDisabled} onClick={() => onGo(p - 1)} className="px-3 py-2 rounded-xl border disabled:opacity-40">← Anterior</button>
      <span className="px-3 py-2 text-sm text-gray-600">Página {p} de {totalPages}</span>
      <button disabled={nextDisabled} onClick={() => onGo(p + 1)} className="px-3 py-2 rounded-xl border disabled:opacity-40">Próxima →</button>
    </div>
  );
}

function useTMDBSearch(q, page) {
  const [state, setState] = useState({ loading: false, error: null, data: null });
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!q) {
        setState({ loading: false, error: null, data: null });
        return;
      }
      setState({ loading: true, error: null, data: null });
      try {
        const res = await fetch(`${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&page=${page || 1}&include_adult=false&language=pt-BR`);
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const json = await res.json();
        if (active) setState({ loading: false, error: null, data: json });
      } catch (e) {
        if (active) setState({ loading: false, error: e.message || "Erro de rede", data: null });
      }
    };
    run();
    return () => { active = false; };
  }, [q, page]);
  return state;
}

function useTMDBDetails(id) {
  const [state, setState] = useState({ loading: false, error: null, data: null });
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!id) return;
      setState({ loading: true, error: null, data: null });
      try {
        const res = await fetch(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits&language=pt-BR`);
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const json = await res.json();
        if (active) setState({ loading: false, error: null, data: json });
      } catch (e) {
        if (active) setState({ loading: false, error: e.message || "Erro de rede", data: null });
      }
    };
    run();
    return () => { active = false; };
  }, [id]);
  return state;
}

function SearchPage({ favApi }) {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const page = Number(params.get("page") || 1);
  const { data, loading, error } = useTMDBSearch(q, page);

  const items = data?.results || [];
  const totalPages = Math.min(data?.total_pages || 0, 500); // limite da API

  const goPage = (p) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next, { replace: true });
  };

  return (
    <Container>
      <div className="space-y-4">
        <SearchInput />
        {!q && <Empty>Digite um termo para começar a busca.</Empty>}
        {loading && <Loading />}
        {error && <ErrorBox message={error} />}
        {!loading && !error && q && (
          <>
            <p className="text-sm text-gray-600">Resultados para <strong>“{q}”</strong> — {data?.total_results || 0} itens</p>
            <MovieGrid items={items} onToggleFav={(m)=> favApi.has(m.id) ? favApi.remove(m.id) : favApi.add(minMovie(m))} isFav={favApi.has} />
            <Pagination page={page} totalPages={totalPages} onGo={goPage} />
          </>
        )}
      </div>
    </Container>
  );
}

function minMovie(m) {
  return {
    id: m.id,
    title: m.title,
    release_date: m.release_date,
    poster_path: m.poster_path,
    vote_average: m.vote_average,
  };
}

function DetailsPage({ favApi }) {
  const { id } = useParams();
  const { data, loading, error } = useTMDBDetails(id);
  const isFav = favApi.has(Number(id));
  const toggle = () => {
    if (!data) return;
    const mm = minMovie(data);
    isFav ? favApi.remove(mm.id) : favApi.add(mm);
  };

  const director = useMemo(() => {
    const crew = data?.credits?.crew || [];
    return crew.find((p) => p.job === "Director")?.name || "—";
  }, [data]);

  const cast = useMemo(() => {
    const arr = data?.credits?.cast || [];
    return arr.slice(0, 10).map((p) => p.name).join(", ");
  }, [data]);

  return (
    <Container>
      {loading && <Loading />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && data && (
        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <div>
            {data.poster_path ? (
              <img src={IMG.w342(data.poster_path)} alt={data.title} className="w-full rounded-2xl border" />
            ) : (
              <div className="w-full aspect-[2/3] rounded-2xl border bg-gray-100 flex items-center justify-center text-gray-400">Sem pôster</div>
            )}
            <button onClick={toggle} className={`mt-3 w-full px-4 py-2 rounded-2xl border ${isFav ? "bg-yellow-100 border-yellow-300" : "hover:bg-gray-50"}`}>
              {isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            </button>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{data.title} <span className="text-gray-500 font-normal">({(data.release_date || "").slice(0,4)})</span></h1>
            <div className="flex flex-wrap gap-2 text-sm text-gray-700">
              <Badge>⭐ {data.vote_average?.toFixed?.(1) ?? "-"}</Badge>
              <Badge>{data.runtime ? `${data.runtime} min` : "Duração indisponível"}</Badge>
              {data.genres?.map((g) => (<Badge key={g.id}>{g.name}</Badge>))}
            </div>
            <p className="text-gray-800 leading-relaxed">{data.overview || "Sem sinopse."}</p>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="font-medium text-gray-600">Diretor</dt><dd>{director}</dd></div>
              <div><dt className="font-medium text-gray-600">Elenco</dt><dd>{cast || "—"}</dd></div>
              <div><dt className="font-medium text-gray-600">Idioma Original</dt><dd>{data.original_language?.toUpperCase?.() || "—"}</dd></div>
              <div><dt className="font-medium text-gray-600">Lançamento</dt><dd>{data.release_date || "—"}</dd></div>
            </dl>
          </div>
        </div>
      )}
    </Container>
  );
}

function FavoritesPage({ favApi }) {
  const { favs, remove, has } = favApi;
  const navigate = useNavigate();
  const go = (id) => navigate(`/detalhes/${id}`);
  return (
    <Container>
      <h2 className="text-2xl font-bold mb-4">Favoritos</h2>
      {favs.length === 0 ? (
        <Empty>Você ainda não adicionou filmes aos favoritos.</Empty>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {favs.map((m) => (
            <article key={m.id} className="rounded-2xl border overflow-hidden bg-white">
              <button onClick={() => go(m.id)} className="block w-full text-left">
                {m.poster_path ? (
                  <img src={IMG.w342(m.poster_path)} alt={m.title} className="w-full aspect-[2/3] object-cover" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-100 flex items-center justify-center text-gray-400">Sem pôster</div>
                )}
              </button>
              <div className="p-3 space-y-2">
                <button onClick={() => go(m.id)} className="font-medium line-clamp-2 hover:underline">{m.title}</button>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{(m.release_date || "").slice(0,4) || "—"}</span>
                  <Badge>⭐ {m.vote_average?.toFixed?.(1) ?? "-"}</Badge>
                </div>
                <button onClick={() => remove(m.id)} className="w-full mt-1 px-3 py-2 rounded-xl border hover:bg-gray-50">Remover</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}

export default function App() {
  const favApi = useFavorites();
  return (
    <BrowserRouter>
      <Nav favCount={favApi.favs.length} />
      <Routes>
        <Route path="/" element={<SearchPage favApi={favApi} />} />
        <Route path="/detalhes/:id" element={<DetailsPage favApi={favApi} />} />
        <Route path="/favoritos" element={<FavoritesPage favApi={favApi} />} />
        <Route path="*" element={<Container><ErrorBox message="Página não encontrada." /></Container>} />
      </Routes>
      <footer className="mt-10 border-t">
        <Container>
          <p className="text-xs text-gray-500">Este produto usa a API do TMDB mas não é endossado ou certificado pelo TMDB.</p>
        </Container>
      </footer>
    </BrowserRouter>
  );
}
