# YouTube Viewer

## Current State
- React frontend with TanStack Router
- Three pages: SearchPage (home), WatchPage, SettingsPage
- Motoko backend stores per-video comments (postComment, getComments, deleteComment, getCommentCount)
- YouTube Data API v3 key stored in localStorage
- No authentication or personalization

## Requested Changes (Diff)

### Add
- Internet Identity login/logout via the authorization component
- "For You" page (new route `/foryou`) that auto-loads recommended/trending videos using the saved API key
- Login button in the nav header showing current login state (logged in / log out)
- When logged in, users' comments are attributed to their display name stored in profile; when logged out, they can still enter a display name manually

### Modify
- Nav header: add Login/Logout button alongside Settings link
- App.tsx: add `/foryou` route
- Backend: add user profile storage (displayName per principal) so logged-in users can set and retrieve a display name
- SearchPage: add "For You" nav tab alongside search

### Remove
- Nothing removed

## Implementation Plan
1. Select `authorization` component
2. Update Motoko backend to add `getUserProfile`, `setUserProfile` (display name per principal), and keep existing comment functions
3. Add `ForYouPage.tsx` that fetches trending/recommended videos from YouTube API (using `chart=mostPopular` endpoint) and renders VideoCard grid
4. Update `App.tsx` to add `/foryou` route, login button in nav, and import authorization hooks
5. Update `WatchPage.tsx` comment form to pre-fill display name from user profile when logged in
6. Add profile hook to read/write display name from backend
