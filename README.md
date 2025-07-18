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