import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Eye, Play, Sparkles, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface TrendingVideo {
  id: string;
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
  statistics: {
    viewCount?: string;
    likeCount?: string;
  };
}

interface YouTubeTrendingResponse {
  items?: TrendingVideo[];
  error?: { message?: string };
}

function formatViewCount(n?: string): string {
  if (!n) return "";
  const num = Number.parseInt(n, 10);
  if (Number.isNaN(num)) return n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K views`;
  return `${num.toLocaleString()} views`;
}

function TrendingCard({
  video,
  index,
}: {
  video: TrendingVideo;
  index: number;
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <button
        type="button"
        onClick={() =>
          navigate({ to: "/watch/$videoId", params: { videoId: video.id } })
        }
        className="group w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      >
        <div className="bg-card border border-border rounded-xl overflow-hidden card-glow card-glow-hover transition-all duration-200 hover:-translate-y-0.5">
          {/* Thumbnail */}
          <div className="relative aspect-video-custom overflow-hidden bg-muted">
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
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
              {video.snippet.title}
            </h3>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {video.snippet.channelTitle}
                </span>
              </div>
              {video.statistics?.viewCount && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Eye className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono-custom text-xs text-muted-foreground">
                    {formatViewCount(video.statistics.viewCount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

export default function ForYouPage() {
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiKey = localStorage.getItem("yt_api_key");

  useEffect(() => {
    if (!apiKey) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchTrending() {
      try {
        const url = new URL("https://www.googleapis.com/youtube/v3/videos");
        url.searchParams.set("part", "snippet,statistics");
        url.searchParams.set("chart", "mostPopular");
        url.searchParams.set("maxResults", "24");
        url.searchParams.set("regionCode", "US");
        url.searchParams.set("key", apiKey!);

        const res = await fetch(url.toString());
        if (!res.ok) {
          const data: YouTubeTrendingResponse = await res
            .json()
            .catch(() => ({}));
          throw new Error(
            data?.error?.message ?? `Request failed (${res.status})`,
          );
        }

        const data: YouTubeTrendingResponse = await res.json();
        if (!cancelled) {
          setVideos(data.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load trending videos",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrending();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return (
    <main className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-grid-subtle">
        <div className="max-w-7xl mx-auto px-4 pt-10 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">
              Trending Now
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm ml-12"
          >
            Most popular videos on YouTube right now
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* No API key */}
        {!apiKey && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/30 rounded-xl px-5 py-6 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                API key required to view trending videos
              </p>
              <p className="text-sm text-muted-foreground">
                You need a YouTube Data API v3 key to use this feature.{" "}
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
                  Failed to load trending videos
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
            {Array.from({ length: 12 }, (_, i) => `sk-${i}`).map((sk) => (
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
            ))}
          </div>
        )}

        {/* Videos grid */}
        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video, i) => (
              <TrendingCard key={video.id} video={video} index={i} />
            ))}
          </div>
        )}

        {/* Empty state (no error, no videos, not loading) */}
        {!loading && apiKey && videos.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <p className="font-display font-semibold text-lg mb-2">
              No trending videos found
            </p>
            <p className="text-muted-foreground text-sm">
              Try refreshing the page
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
