# Weekly Plate – Backend

Python (FastAPI) API with a PostgreSQL database on Supabase, for the
React Native app.

## How the pieces fit

```
React Native app (Expo)
  ├── signs in directly with Supabase Auth (email / Google / Apple)
  └── calls this API with the user's token  ──►  FastAPI (Python)
                                                   ├── validation (Pydantic)
                                                   ├── business rules (app/services)
                                                   └── Supabase: PostgreSQL + photo storage
                                                         └── Row Level Security on every table
```

Validation runs in three layers: the app form (instant feedback), the API
(the real check), and the database (constraints and RLS as a safety net).

## Folders

| Path | What it is |
| --- | --- |
| `supabase/migrations/` | Database tables, field rules, permissions, photo bucket |
| `app/schemas.py` | Request validation rules |
| `app/services/recipes.py` | Business rules: free-plan limit, photos, plans, follows |
| `app/services/photos.py` | Photo checks: real image, size, removes GPS metadata, resizes |
| `app/services/planner.py` | Weekly dinner planner |
| `app/repo/` | Storage: Supabase (production) and in-memory (tests, local dev) |
| `app/main.py` | HTTP routes |
| `tests/` | Automated tests |

## Run it locally without Supabase

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
USE_MEMORY_REPO=1 uvicorn app.main:app --reload
```

Open http://localhost:8000/docs to try every endpoint. In memory mode send
`Authorization: Bearer dev:00000000-0000-0000-0000-000000000001`.

## Connect to Supabase

1. Create a free project at supabase.com (region: Central EU / Frankfurt).
2. Install the Supabase CLI and run `supabase link` then `supabase db push`
   (or paste `supabase/migrations/*.sql` into the SQL editor).
3. Copy `.env.example` to `.env` and fill in the URL and anon key.
4. `uvicorn app.main:app --reload`

## Tests

```bash
pytest            # or: python -m unittest discover -s tests -t .
```

- `test_database.py` runs the real migration on a throwaway local PostgreSQL
  and checks privacy, limits and field rules (skipped if PostgreSQL is not installed).
- `test_api.py` runs HTTP requests against the app in memory mode.

## Error format

Every error has the same shape. The app shows the message in Hebrew,
English or Russian based on `code` and `params`:

```json
{"errors": [{"field": "ingredients.1.qty", "code": "greater_than",
             "message": "Input should be greater than 0", "params": {"gt": 0}}]}
```

## For the React Native app

- Generate typed API calls from the schema:
  `npx openapi-typescript http://localhost:8000/openapi.json -o src/api/types.ts`
- Sign-in uses `@supabase/supabase-js` in the app; pass
  `session.access_token` as the `Authorization: Bearer` header to this API.

## Not tested yet

`app/repo/supabase_repo.py` and token checks with Supabase signing keys
(JWKS) have not been run against a live Supabase project. Run the app
against your project once it exists and check the main flows.
