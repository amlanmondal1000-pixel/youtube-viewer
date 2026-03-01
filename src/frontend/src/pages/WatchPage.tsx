import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Eye,
  Loader2,
  MessageSquare,
  Send,
  ThumbsUp,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetComments, usePostComment } from "../hooks/useQueries";

interface VideoDetails {
  title: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
}

interface YouTubeVideoResponse {
  items?: Array<{
    snippet: {
      title: string;
      channelTitle: string;
      description: string;
      publishedAt: string;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
    };
  }>;
  error?: { message?: string };
}

function formatCount(n: string): string {
  const num = Number.parseInt(n, 10);
  if (Number.isNaN(num)) return n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCommentTime(timestampBigInt: bigint): string {
  const ts = Number(timestampBigInt);
  // ICP timestamps are in nanoseconds
  const date = new Date(ts / 1_000_000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function WatchPage() {
  const { videoId } = useParams({ from: "/watch/$videoId" });
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().toText();

  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(() => {
    // If logged in, use principal-specific display name; otherwise fall back to generic
    return localStorage.getItem("yt_display_name") ?? "";
  });
  const [commentBody, setCommentBody] = useState("");

  // Sync display name when identity changes
  useEffect(() => {
    if (principalText) {
      const savedName = localStorage.getItem(
        `yt_display_name_${principalText}`,
      );
      if (savedName) setDisplayName(savedName);
    } else {
      const savedName = localStorage.getItem("yt_display_name");
      if (savedName) setDisplayName(savedName);
    }
  }, [principalText]);

  const apiKey = localStorage.getItem("yt_api_key");

  const { data: comments, isLoading: commentsLoading } = useGetComments(
    videoId ?? "",
  );
  const postCommentMutation = usePostComment(videoId ?? "");

  // Fetch video details from YouTube API
  useEffect(() => {
    if (!videoId || !apiKey) {
      setVideoLoading(false);
      return;
    }

    let cancelled = false;
    setVideoLoading(true);
    setVideoError(null);

    async function fetchDetails() {
      try {
        const url = new URL("https://www.googleapis.com/youtube/v3/videos");
        url.searchParams.set("part", "snippet,statistics");
        url.searchParams.set("id", videoId!);
        url.searchParams.set("key", apiKey!);

        const res = await fetch(url.toString());
        if (!res.ok) {
          const data: YouTubeVideoResponse = await res.json().catch(() => ({}));
          throw new Error(
            data?.error?.message ?? `Request failed (${res.status})`,
          );
        }

        const data: YouTubeVideoResponse = await res.json();
        const item = data.items?.[0];
        if (!item) throw new Error("Video not found");

        if (!cancelled) {
          setVideoDetails({
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt,
            viewCount: item.statistics?.viewCount ?? "0",
            likeCount: item.statistics?.likeCount ?? "0",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setVideoError(
            err instanceof Error ? err.message : "Failed to load video details",
          );
        }
      } finally {
        if (!cancelled) setVideoLoading(false);
      }
    }

    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [videoId, apiKey]);

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !commentBody.trim() || !videoId) return;

    // Save display name: use principal-specific key if logged in, otherwise generic key
    if (principalText) {
      localStorage.setItem(
        `yt_display_name_${principalText}`,
        displayName.trim(),
      );
    } else {
      localStorage.setItem("yt_display_name", displayName.trim());
    }

    try {
      await postCommentMutation.mutateAsync({
        author: displayName.trim(),
        body: commentBody.trim(),
      });
      setCommentBody("");
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post comment");
    }
  }

  if (!videoId) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Invalid video ID</p>
          <Link
            to="/"
            className="text-primary hover:underline text-sm mt-2 inline-block"
          >
            Back to Search
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Search
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Video embed */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-xl overflow-hidden border border-border card-glow"
            >
              <div className="aspect-video-custom w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
                  title={videoDetails?.title ?? "YouTube Video"}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Video info */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-3"
            >
              {videoLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              ) : videoError ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span>{videoError}</span>
                </div>
              ) : videoDetails ? (
                <>
                  <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                    {videoDetails.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground/80">
                        {videoDetails.channelTitle}
                      </span>
                    </div>
                    <Separator
                      orientation="vertical"
                      className="h-4 bg-border"
                    />
                    <div className="flex items-center gap-3 text-xs font-mono-custom text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {formatCount(videoDetails.viewCount)} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {formatCount(videoDetails.likeCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(videoDetails.publishedAt)}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>

            {/* No API key warning */}
            {!apiKey && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  <Link
                    to="/settings"
                    className="text-primary hover:underline font-medium"
                  >
                    Add your API key
                  </Link>{" "}
                  to see video details.
                </span>
              </div>
            )}

            <Separator className="bg-border" />

            {/* Comments section */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              aria-label="Comments"
            >
              <div className="flex items-center gap-2 mb-5">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-base">
                  Comments
                </h2>
                {comments && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 font-mono-custom text-xs"
                  >
                    {comments.length}
                  </Badge>
                )}
              </div>

              {/* Post comment form */}
              <form onSubmit={handlePostComment} className="space-y-3 mb-7">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="display-name"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Display Name
                  </Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="Your name..."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-9 bg-input border-border text-sm max-w-xs"
                    maxLength={64}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="comment-body"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Comment
                  </Label>
                  <Textarea
                    id="comment-body"
                    placeholder="Share your thoughts..."
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    className="bg-input border-border text-sm resize-none min-h-[80px]"
                    maxLength={2000}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    !displayName.trim() ||
                    !commentBody.trim() ||
                    postCommentMutation.isPending
                  }
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-9"
                >
                  {postCommentMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 mr-2" />
                  )}
                  {postCommentMutation.isPending
                    ? "Posting..."
                    : "Post Comment"}
                </Button>
              </form>

              {/* Comments list */}
              {commentsLoading ? (
                <div className="space-y-4">
                  {(["c1", "c2", "c3"] as const).map((ck) => (
                    <div key={ck} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-1/4" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments && comments.length > 0 ? (
                <AnimatePresence>
                  <div className="space-y-5">
                    {[...comments]
                      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                      .map((comment) => (
                        <motion.div
                          key={String(comment.id)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3"
                        >
                          <Avatar className="w-8 h-8 flex-shrink-0 bg-accent">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                              {comment.author.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-sm font-semibold font-display text-foreground">
                                {comment.author}
                              </span>
                              <span className="font-mono-custom text-xs text-muted-foreground">
                                {formatCommentTime(comment.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/85 leading-relaxed break-words">
                              {comment.body}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </AnimatePresence>
              ) : (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    No comments yet. Be the first!
                  </p>
                </div>
              )}
            </motion.section>
          </div>

          {/* Sidebar - video description */}
          <aside className="lg:col-span-1">
            {videoDetails?.description && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-4 card-glow"
              >
                <h3 className="font-display font-semibold text-sm mb-3 text-foreground/80">
                  Description
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-[12]">
                  {videoDetails.description}
                </p>
              </motion.div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
