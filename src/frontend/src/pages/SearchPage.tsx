import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Clock, Loader2, Play, Search, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      medium: { url: string };
      high: { url: string };
    };
  };
}

function formatPublishedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function VideoCard({
  item,
  index,
}: { item: YouTubeSearchItem; index: number }) {
  const navigate = useNavigate();
  const videoId = item.id.videoId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <button
        type="button"
        onClick={() => navigate({ to: "/watch/$videoId", params: { videoId } })}
        className="group w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      >
        <div className="bg-card border border-border rounded-xl overflow-hidden card-glow card-glow-hover transition-all duration-200 hover:-translate-y-0.5">
          {/* Thumbnail */}
          <div className="relative aspect-video-custom overflow-hidden bg-muted">
            <img
              src={item.snippet.thumbnails.medium.url}
              alt={item.snippet.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {/* Play overlay */}
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-all duration-200 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 shadow-lg">
                <Play
                  className="w-5 h-5 text-primary-foreground ml-0.5"
                  fill="currentColor"
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3.5">
            <h3 className="font-display font-semibold text-sm leading-snug text-card-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {item.snippet.title}
            </h3>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {item.snippet.channelTitle}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="font-mono-custom text-xs text-muted-foreground">
                  {formatPublishedDate(item.snippet.publishedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

const TRENDING_TOPICS = [
  "Music",
  "Gaming",
  "Tech",
  "Science",
  "Cooking",
  "Travel",
  "Sports",
  "Comedy",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const apiKey = localStorage.getItem("yt_api_key");

  const handleSearch = useCallback(async (searchQuery: string) => {
    const key = localStorage.getItem("yt_api_key");
    if (!key || !searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("q", searchQuery.trim());
      url.searchParams.set("type", "video");
      url.searchParams.set("maxResults", "20");
      url.searchParams.set("key", key);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: { message?: string } })?.error?.message ??
          `Request failed (${res.status})`;
        throw new Error(msg);
      }
      const data = await res.json();
      setResults((data as { items?: YouTubeSearchItem[] }).items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearch(query);
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero search area */}
      <div className="bg-grid-subtle">
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-10">
          {/* No API key banner */}
          {!apiKey && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-primary/10 border border-primary/30 rounded-xl px-5 py-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  API key required to search videos
                </p>
                <p className="text-sm text-muted-foreground">
                  You need a YouTube Data API v3 key to use this app.{" "}
                  <Link
                    to="/settings"
                    className="text-primary hover:underline font-medium"
                  >
                    Add your key in Settings →
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight mb-3">
              Watch what matters.
            </h1>
            <p className="text-muted-foreground text-base">
              Search YouTube without leaving this page.
            </p>
          </motion.div>

          {/* Search form */}
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for videos, channels, topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 bg-card border-border text-base focus-visible:ring-primary focus-visible:border-primary"
                disabled={!apiKey}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={!apiKey || !query.trim() || loading}
              className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
          </motion.form>

          {/* Trending topics */}
          {!hasSearched && apiKey && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex flex-wrap gap-2 justify-center"
            >
              {TRENDING_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setQuery(topic);
                    handleSearch(topic);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-accent transition-all duration-150"
                >
                  {topic}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-destructive/10 border border-destructive/30 rounded-xl px-5 py-4 flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Search failed
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
                {error.toLowerCase().includes("api") && (
                  <Link
                    to="/settings"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Check your API key in Settings →
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"] as const).map(
              (sk) => (
                <div
                  key={sk}
                  className="bg-card border border-border rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-video-custom bg-muted" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-3.5 bg-muted rounded w-full" />
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2 mt-3" />
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display font-semibold text-foreground/80 text-sm">
                Results for
              </h2>
              <Badge
                variant="secondary"
                className="bg-primary/15 text-primary border-primary/20 font-mono-custom text-xs"
              >
                {query}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto font-mono-custom">
                {results.length} videos
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.map((item, i) => (
                <VideoCard key={item.id.videoId} item={item} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Empty state after search */}
        {!loading && hasSearched && results.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-display font-semibold text-lg mb-2">
              No results found
            </p>
            <p className="text-muted-foreground text-sm">
              Try a different search term
            </p>
          </motion.div>
        )}

        {/* Initial state */}
        {!loading && !hasSearched && apiKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Play className="w-7 h-7 text-primary ml-0.5" />
            </div>
            <p className="font-display font-semibold text-lg mb-2">
              Ready to search
            </p>
            <p className="text-muted-foreground text-sm">
              Enter a query above or pick a trending topic
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
