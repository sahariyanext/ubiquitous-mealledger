##Meal Ledger 

## Development

Install dependencies and start the local development server:

```sh
npm i
npm run dev
```

## Production build

```sh
npm run build
```

## Supabase setup

1. Open the Supabase SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).
2. Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable key.
3. In Netlify, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under the site's environment variables.
4. Deploy again. Users can then create an account and their meal entries will sync across devices.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
