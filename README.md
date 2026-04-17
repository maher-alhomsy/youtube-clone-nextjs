# YouTube Platform Clone (Next.js + tRPC)

A full-stack YouTube-style video platform built with Next.js App Router, tRPC, Drizzle, Clerk, Mux, UploadThing, and Upstash.

The app includes creator studio workflows, public discovery feeds, subscriptions, watch history, liked videos, playlists, search, reactions, comments (with replies), and profile pages with editable banners.

## Highlights

- Creator Studio with direct Mux uploads and metadata management
- Public video watch pages with suggestions
- Category filtering, search, and trending feed
- Subscription feed and subscription management
- Playlists: create, add/remove videos, view playlist details
- Built-in liked videos and watch history pages
- Video and comment reactions (like/dislike)
- Nested comments (reply support)
- User profile pages with banner upload
- AI-assisted title, description, and thumbnail generation
- Webhook-driven user and video lifecycle synchronization

## Tech Stack

- Next.js 16 (App Router) and React 19
- TypeScript
- tRPC + TanStack Query
- Drizzle ORM + PostgreSQL (Neon)
- Clerk authentication
- Mux video ingest, playback, and webhooks
- UploadThing for media uploads (thumbnails and banners)
- Upstash Redis (rate limiting)
- Upstash Workflow/QStash (async AI jobs)
- OpenAI for AI content generation
- Tailwind CSS + Radix/shadcn UI

## Project Structure

```text
src/
	app/              Route groups, pages, and API endpoints
	components/       Shared UI components and primitives
	db/               Drizzle schema and DB client
	hooks/            Shared React hooks
	lib/              Integration clients (mux, redis, workflow, uploadthing)
	modules/          Feature modules (videos, studio, playlists, search, users, etc.)
	scripts/          Utility scripts (category seed)
	trpc/             tRPC init, server/client setup, router composition
```

## Route Map

### Public and Auth

- `/` home feed
- `/search` search results
- `/videos/[videoId]` video watch page
- `/users/[userId]` creator profile
- `/sign-in` and `/sign-up` auth pages

### Feeds

- `/feed/trending` trending videos
- `/feed/subscriptions` videos from subscribed creators
- `/subscriptions` all subscribed creators list

### Playlists

- `/playlists` all owned playlists
- `/playlists/[playlistId]` videos in a playlist
- `/playlists/liked` liked videos
- `/playlists/history` watch history

### Creator Studio

- `/studio` studio video list
- `/studio/videos/[videoId]` edit/manage a specific video

## API Endpoints

- `/api/trpc/[trpc]` primary typed API surface
- `/api/uploadthing` uploadthing route handlers
- `/api/users/webhook` Clerk webhook handler
- `/api/videos/webhook` Mux webhook handler
- `/api/videos/workflows/title` AI title workflow
- `/api/videos/workflows/description` AI description workflow
- `/api/videos/workflows/thumbnail` AI thumbnail workflow

## Feature Modules

- `src/modules/videos` video creation, retrieval, trending/subscribed feeds, revalidation
- `src/modules/studio` creator management UI and workflows
- `src/modules/comments` comments and nested replies
- `src/modules/comment-reactions` reactions on comments
- `src/modules/video-reactions` reactions on videos
- `src/modules/subscriptions` follow/unfollow and subscription lists
- `src/modules/playlists` custom playlists, liked and history views
- `src/modules/search` title/category search with pagination
- `src/modules/suggestions` related videos for watch page
- `src/modules/users` profile data and creator page UI
- `src/modules/categories` category retrieval/filter data

## Data Model Overview

Main tables in `src/db/schema.ts`:

- `users` includes profile image and optional banner
- `videos` with visibility, mux ids, preview and thumbnail metadata
- `categories`
- `subscriptions`
- `video_views`
- `video_reactions`
- `comments` (supports `parentId` for replies)
- `comment_reactions`
- `playlists`
- `playlist_videos`

## Environment Variables

Create `.env.local` and configure service credentials.

Core variables used by the current codebase include:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `MUX_TOKEN_ID`
- `MUX_SECRET_KEY`
- `MUX_WEBHOOK_SECRET`
- `UPLOADTHING_SECRET`
- `UPLOADTHING_APP_ID`
- `QSTASH_TOKEN`
- `UPSTASH_WORKFLOW_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OPENAI_API_KEY`

## Local Development

### 1. Install dependencies

```bash
bun install
```

### 2. Run development server

```bash
bun run dev
```

Open http://localhost:3000.

### 3. Other scripts

```bash
bun run build
bun run start
bun run lint
```

### 4. Seed categories

After database setup/migrations, seed initial categories with:

```bash
bun src/scripts/seed-categories.ts
```

## Media and AI Workflow Notes

- Video upload starts via Mux direct upload URL creation.
- Mux webhook updates status, playback ID, duration, and generated track metadata.
- Studio actions trigger async workflows through Upstash.
- Workflows call OpenAI to generate title/description/thumbnail.
- UploadThing manages thumbnail and banner uploads, replacing old files when needed.

## Deployment Notes

- Ensure a public app URL is available for Clerk/Mux/UploadThing webhook callbacks.
- Keep environment variables configured in your deployment target.
- Verify webhook secrets match provider dashboards.
- The code relies on absolute app URL behavior via `NEXT_PUBLIC_APP_URL`.

## Current Status

This README reflects the latest route and feature set currently present in this repository, including playlists, trending and subscription feeds, user pages, banner upload, and expanded tRPC routers.
