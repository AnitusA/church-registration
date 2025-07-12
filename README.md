# Church Registration System

A comprehensive church registration system built with Remix, TypeScript, and Supabase.

## Features

- **Role-based Access Control**: Organizer and Secretary roles with different permissions
- **Organizer Dashboard**: 
  - View all participants across all churches
  - Filter, sort, and paginate data
  - Export participant data to CSV
  - Real-time statistics
- **Secretary Dashboard**: Register participants for their church
- **Supabase Integration**: Real-time database with authentication

## Project Structure

```
/my-remix-project
├── .env                         # 🔐 Environment variables (Supabase keys, secrets)
├── .gitignore                   # Should include `.env`
├── remix.config.js              # Remix configuration
├── tailwind.config.js           # Tailwind setup
├── tsconfig.json                # TypeScript config
├── package.json
│
├── /app
│   ├── /routes
│   │   └── /organizer
│   │       └── dashboard.tsx     # 📊 Organizer-only dashboard route
│   │
│   ├── /components
│   │   ├── DashboardTable.tsx    # 📋 Table with filter, sort, paginate, export
│   │   └── FilterBar.tsx         # 🔍 Reusable filters component
│   │
│   ├── /lib
│   │   ├── supabase.server.ts    # 🔌 Server-side Supabase client using .env
│   │   └── auth.ts               # 🔐 Organizer role check / protection
│   │
│   ├── root.tsx                  # App layout + outlet
│   ├── entry.server.tsx
│   └── entry.client.tsx
│
└── README.md
```

## Environment Setup

1. Create a `.env` file in the project root:
```env
SUPABASE_URL=https://sxzpnuuskrgdslcbniid.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4enBudXVza3JnZHNsY2JuaWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODM5NzYsImV4cCI6MjA2Njk1OTk3Nn0.lqyJRBZtlaMTEzr7EqxsY0y86ChJ2kat-gs_8bK1LLk
SESSION_SECRET=your_session_secret_here
```

2. Update your Supabase database schema to include:
   - `participants` table with participant data
   - `profiles` table with `role` field ("organizer" or "secretary") - optional for future auth
   - Appropriate Row Level Security (RLS) policies

## Development

Run the dev server:

```sh
npm run dev
```

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

## Key Components

### Organizer Dashboard (`/app/routes/organizer/dashboard.tsx`)
- Protected route requiring organizer role
- Displays all participants from all churches
- Advanced filtering and sorting capabilities
- CSV export functionality

### DashboardTable (`/app/components/DashboardTable.tsx`)
- Sortable columns
- Pagination
- Export to CSV
- Responsive design

### FilterBar (`/app/components/FilterBar.tsx`)
- Search by name or ID
- Filter by church, role, section, competition
- Clear filters functionality

### Authentication (`/app/lib/auth.ts`)
- Role-based access control
- Server-side authentication helpers
- Route protection utilities

## Styling

This template uses [Tailwind CSS](https://tailwindcss.com/) for styling with a modern, responsive design.
