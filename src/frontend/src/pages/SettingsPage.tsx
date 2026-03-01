import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("yt_api_key") ?? "",
  );
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      toast.error("Please enter a valid API key");
      return;
    }
    localStorage.setItem("yt_api_key", trimmed);
    setSaved(true);
    toast.success("API key saved successfully");
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    localStorage.removeItem("yt_api_key");
    setApiKey("");
    toast.success("API key removed");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Search
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <Key className="w-4 h-4 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">Settings</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Configure your YouTube Data API v3 key to start watching videos.
            </p>
          </div>

          {/* Card */}
          <Card className="bg-card border-border card-glow">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg">
                YouTube API Key
              </CardTitle>
              <CardDescription>
                Your key is stored locally in your browser and never sent to our
                servers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-sm font-medium">
                  YouTube Data API v3 Key
                </Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showKey ? "text" : "password"}
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    className="bg-input border-border pr-10 font-mono text-sm placeholder:text-muted-foreground/40"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={saved}
                >
                  {saved ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    "Save Key"
                  )}
                </Button>
                {apiKey && (
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="border-border text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator className="my-8 bg-border" />

          {/* Instructions */}
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold text-foreground/80">
              How to get a free API key
            </h2>
            <ol className="space-y-3 text-sm text-muted-foreground list-none">
              {[
                "Go to Google Cloud Console and create a new project.",
                'In the navigation, go to "APIs & Services" → "Library".',
                'Search for "YouTube Data API v3" and click Enable.',
                'Go to "APIs & Services" → "Credentials".',
                'Click "Create Credentials" → "API Key". Copy your key.',
              ].map((step, idx) => (
                <li key={step} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono-custom font-semibold mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium mt-2"
            >
              Open Google Cloud Console
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
