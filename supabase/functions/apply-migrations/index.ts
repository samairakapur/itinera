// apply-migrations — one-shot DDL runner
// Applies schema changes that can't go through supabase db push due to
// network timeouts. Uses the internal DB URL (available in Edge Functions).
//
// POST /functions/v1/apply-migrations
// Body: { secret: string }   must equal SUPABASE_SERVICE_ROLE_KEY

import postgres from 'https://deno.land/x/postgresjs@v3.4.4/mod.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    // Simple one-time passphrase — function will be deleted after use
    if (body.secret !== 'itinera-migrate-2026') {
      return json({ error: 'unauthorized' }, 401);
    }

    // SUPABASE_DB_URL is automatically set for Edge Functions
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) return json({ error: 'SUPABASE_DB_URL not available' }, 500);

    const sql = postgres(dbUrl, { max: 1 });
    const results: { migration: string; status: string; error?: string }[] = [];

    const migrations = [
      {
        name: 'add price_tier to itinerary_items',
        ddl: `ALTER TABLE public.itinerary_items ADD COLUMN IF NOT EXISTS price_tier TEXT;`,
      },
      {
        name: 'invite token RLS — anyone can view trip via active invite token',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'itineraries'
                AND policyname = 'Anyone can view trip via active invite token'
            ) THEN
              CREATE POLICY "Anyone can view trip via active invite token"
              ON public.itineraries
              FOR SELECT
              USING (invite_link_active = true AND invite_token IS NOT NULL);
            END IF;
          END $$;
        `,
      },
      {
        name: 'invite token RLS — authenticated users can self-join via invite link',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'trip_collaborators'
                AND policyname = 'Authenticated users can self-join via invite link'
            ) THEN
              CREATE POLICY "Authenticated users can self-join via invite link"
              ON public.trip_collaborators
              FOR INSERT
              WITH CHECK (
                auth.uid() = user_id
                AND EXISTS (
                  SELECT 1 FROM public.itineraries i
                  WHERE i.id = itinerary_id
                    AND i.invite_link_active = true
                    AND i.invite_token IS NOT NULL
                )
              );
            END IF;
          END $$;
        `,
      },
      {
        name: 'backfill missing invite_tokens',
        ddl: `
          UPDATE public.itineraries
          SET invite_token = LEFT(REPLACE(gen_random_uuid()::text, '-', ''), 12)
          WHERE invite_token IS NULL;
        `,
      },
      // -----------------------------------------------------------------------
      // 20260328: Fix collaborator RLS so joined members see itinerary content
      // -----------------------------------------------------------------------
      {
        name: 'collaborator RLS — update is_itinerary_collaborator to check user_id OR email',
        ddl: `
          CREATE OR REPLACE FUNCTION public.is_itinerary_collaborator(itinerary_uuid UUID)
          RETURNS BOOLEAN
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = public
          AS $$
          BEGIN
            RETURN EXISTS (
              SELECT 1
              FROM public.trip_collaborators
              WHERE itinerary_id = itinerary_uuid
                AND (
                  user_id = auth.uid()
                  OR email = auth.email()
                )
            );
          END;
          $$;
        `,
      },
      {
        name: 'collaborator RLS — trip_days SELECT policy for collaborators',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'trip_days'
                AND policyname = 'Collaborators can view shared trip days'
            ) THEN
              CREATE POLICY "Collaborators can view shared trip days"
              ON public.trip_days
              FOR SELECT
              USING (public.is_itinerary_collaborator(itinerary_id));
            END IF;
          END $$;
        `,
      },
      {
        name: 'collaborator RLS — ensure itinerary_items collaborator SELECT exists',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'itinerary_items'
                AND policyname = 'Collaborators can view shared itinerary items'
            ) THEN
              CREATE POLICY "Collaborators can view shared itinerary items"
              ON public.itinerary_items
              FOR SELECT
              USING (public.is_itinerary_collaborator(itinerary_id));
            END IF;
          END $$;
        `,
      },
      {
        name: 'collaborator RLS — ensure itineraries collaborator SELECT exists',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'itineraries'
                AND policyname = 'Collaborators can view shared itineraries'
            ) THEN
              CREATE POLICY "Collaborators can view shared itineraries"
              ON public.itineraries
              FOR SELECT
              USING (public.is_itinerary_collaborator(id));
            END IF;
          END $$;
        `,
      },
      {
        name: 'collaborator RLS — ensure trip_legs collaborator SELECT exists',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'trip_legs'
                AND policyname = 'Collaborators can view shared trip legs'
            ) THEN
              CREATE POLICY "Collaborators can view shared trip legs"
              ON public.trip_legs
              FOR SELECT
              USING (public.is_itinerary_collaborator(itinerary_id));
            END IF;
          END $$;
        `,
      },
      {
        name: 'collaborator RLS — ensure day_preferences collaborator SELECT exists',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'day_preferences'
                AND policyname = 'Collaborators can view shared day preferences'
            ) THEN
              CREATE POLICY "Collaborators can view shared day preferences"
              ON public.day_preferences
              FOR SELECT
              USING (public.is_itinerary_collaborator(itinerary_id));
            END IF;
          END $$;
        `,
      },
      {
        name: 'collaborator RLS — ensure flight_details collaborator SELECT exists',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'flight_details'
                AND policyname = 'Collaborators can view shared flight details'
            ) THEN
              CREATE POLICY "Collaborators can view shared flight details"
              ON public.flight_details
              FOR SELECT
              USING (public.is_itinerary_collaborator(itinerary_id));
            END IF;
          END $$;
        `,
      },
      // -----------------------------------------------------------------------
      // 20260328b: trip_messages (AI concierge) and trip_chat (group chat)
      // -----------------------------------------------------------------------
      {
        name: 'create trip_messages table (AI concierge)',
        ddl: `
          CREATE TABLE IF NOT EXISTS public.trip_messages (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            trip_id    UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
            user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
            role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content    TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS idx_trip_messages_trip_id
            ON public.trip_messages (trip_id, created_at DESC);
          ALTER TABLE public.trip_messages ENABLE ROW LEVEL SECURITY;
        `,
      },
      {
        name: 'trip_messages RLS policies',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'trip_messages'
                AND policyname = 'Trip members can view concierge messages'
            ) THEN
              CREATE POLICY "Trip members can view concierge messages"
              ON public.trip_messages FOR SELECT
              USING (public.is_itinerary_collaborator(trip_id) OR public.owns_itinerary(trip_id));
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'trip_messages'
                AND policyname = 'Trip members can insert concierge messages'
            ) THEN
              CREATE POLICY "Trip members can insert concierge messages"
              ON public.trip_messages FOR INSERT
              WITH CHECK (public.is_itinerary_collaborator(trip_id) OR public.owns_itinerary(trip_id));
            END IF;
          END $$;
        `,
      },
      {
        name: 'trip_messages realtime',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables
              WHERE pubname = 'supabase_realtime' AND tablename = 'trip_messages'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_messages;
            END IF;
          END $$;
        `,
      },
      {
        name: 'create trip_chat table (group chat)',
        ddl: `
          CREATE TABLE IF NOT EXISTS public.trip_chat (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            trip_id    UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
            user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
            message    TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS idx_trip_chat_trip_id
            ON public.trip_chat (trip_id, created_at ASC);
          ALTER TABLE public.trip_chat ENABLE ROW LEVEL SECURITY;
        `,
      },
      {
        name: 'trip_chat RLS policies',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'trip_chat'
                AND policyname = 'Trip members can view chat messages'
            ) THEN
              CREATE POLICY "Trip members can view chat messages"
              ON public.trip_chat FOR SELECT
              USING (public.is_itinerary_collaborator(trip_id) OR public.owns_itinerary(trip_id));
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'trip_chat'
                AND policyname = 'Trip members can send chat messages'
            ) THEN
              CREATE POLICY "Trip members can send chat messages"
              ON public.trip_chat FOR INSERT
              WITH CHECK (
                auth.uid() = user_id
                AND (public.is_itinerary_collaborator(trip_id) OR public.owns_itinerary(trip_id))
              );
            END IF;
          END $$;
        `,
      },
      {
        name: 'trip_chat realtime',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables
              WHERE pubname = 'supabase_realtime' AND tablename = 'trip_chat'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_chat;
            END IF;
          END $$;
        `,
      },
      {
        name: 'itinerary_items — add Viator pre-selected tour columns',
        ddl: `
          ALTER TABLE public.itinerary_items
            ADD COLUMN IF NOT EXISTS viator_product_code TEXT,
            ADD COLUMN IF NOT EXISTS viator_booking_url TEXT,
            ADD COLUMN IF NOT EXISTS viator_product_title TEXT,
            ADD COLUMN IF NOT EXISTS viator_price_per_person DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS viator_rating DECIMAL(3,2),
            ADD COLUMN IF NOT EXISTS viator_duration_minutes INTEGER,
            ADD COLUMN IF NOT EXISTS viator_image_url TEXT;
        `,
      },
      {
        // The original trip_chat RLS used SECURITY DEFINER helper functions which
        // Supabase Realtime evaluates incorrectly for postgres_changes subscriptions —
        // events aren't delivered to non-owner members. Replace with inline SQL so that
        // Realtime can correctly check each subscriber's access. Also set REPLICA IDENTITY
        // FULL so the full row is available for RLS evaluation on DELETE events.
        name: 'trip_chat — fix RLS for cross-user Realtime delivery (inline SQL + REPLICA IDENTITY FULL)',
        ddl: `
          ALTER TABLE public.trip_chat REPLICA IDENTITY FULL;

          DROP POLICY IF EXISTS "Trip members can view chat messages" ON public.trip_chat;
          DROP POLICY IF EXISTS "Trip members can send chat messages" ON public.trip_chat;

          CREATE POLICY "Trip members can view chat messages"
          ON public.trip_chat FOR SELECT TO authenticated
          USING (
            EXISTS (SELECT 1 FROM public.itineraries WHERE id = trip_id AND user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.trip_collaborators WHERE itinerary_id = trip_id AND email = auth.email())
            OR EXISTS (SELECT 1 FROM public.trip_collaborators WHERE itinerary_id = trip_id AND user_id = auth.uid())
          );

          CREATE POLICY "Trip members can send chat messages"
          ON public.trip_chat FOR INSERT TO authenticated
          WITH CHECK (
            auth.uid() = user_id
            AND (
              EXISTS (SELECT 1 FROM public.itineraries WHERE id = trip_id AND user_id = auth.uid())
              OR EXISTS (SELECT 1 FROM public.trip_collaborators WHERE itinerary_id = trip_id AND email = auth.email())
              OR EXISTS (SELECT 1 FROM public.trip_collaborators WHERE itinerary_id = trip_id AND user_id = auth.uid())
            )
          );
        `,
      },
      {
        // Viator enrichment (run by the authenticated trip owner) needs UPDATE on
        // itinerary_items to write viator_* columns. The existing UPDATE policy only covers
        // the owner (owns_itinerary). Add a dedicated policy for viator column writes.
        name: 'itinerary_items — allow owner to UPDATE viator enrichment columns',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'itinerary_items'
                AND policyname = 'Owner can update viator enrichment on items'
            ) THEN
              CREATE POLICY "Owner can update viator enrichment on items"
              ON public.itinerary_items FOR UPDATE TO authenticated
              USING (public.owns_itinerary(itinerary_id))
              WITH CHECK (public.owns_itinerary(itinerary_id));
            END IF;
          END $$;
        `,
      },
      {
        name: 'profiles — allow all authenticated users to read all profiles (needed for chat display names)',
        ddl: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'profiles'
                AND policyname = 'Users can read all profiles'
            ) THEN
              CREATE POLICY "Users can read all profiles"
              ON public.profiles
              FOR SELECT
              TO authenticated
              USING (true);
            END IF;
          END $$;
        `,
      },
      {
        name: 'trip_reflections — end-of-day reflection log',
        ddl: `
          CREATE TABLE IF NOT EXISTS public.trip_reflections (
            id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            trip_id              UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
            user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            day_index            INTEGER NOT NULL,
            reflection_text      TEXT NOT NULL,
            aria_response        TEXT,
            pace_adjustment_made BOOLEAN DEFAULT false,
            created_at           TIMESTAMPTZ DEFAULT NOW()
          );
          ALTER TABLE public.trip_reflections ENABLE ROW LEVEL SECURITY;
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'trip_reflections'
                AND policyname = 'Users can manage their own reflections'
            ) THEN
              CREATE POLICY "Users can manage their own reflections"
              ON public.trip_reflections FOR ALL TO authenticated
              USING  (auth.uid() = user_id)
              WITH CHECK (auth.uid() = user_id);
            END IF;
          END $$;
          CREATE INDEX IF NOT EXISTS idx_trip_reflections_trip_id
            ON public.trip_reflections (trip_id, day_index);
        `,
      },
      {
        name: 'profiles — add onboarding completion columns',
        ddl: `
          ALTER TABLE public.profiles
            ADD COLUMN IF NOT EXISTS has_completed_onboarding_1 boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS has_completed_onboarding_2 boolean DEFAULT false;
        `,
      },
      {
        name: 'saved_places — favourites/wishlist table',
        ddl: `
          DO $$ BEGIN
            CREATE TABLE IF NOT EXISTS public.saved_places (
              id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              place_name    TEXT NOT NULL,
              place_type    TEXT NOT NULL CHECK (place_type IN ('attraction', 'restaurant', 'cafe')),
              city          TEXT NOT NULL,
              country       TEXT,
              image_url     TEXT,
              notes         TEXT,
              viator_product_id  TEXT,
              foursquare_id      TEXT,
              created_at    TIMESTAMPTZ DEFAULT NOW()
            );

            -- RLS
            ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'saved_places' AND policyname = 'Users can manage their own saved places'
            ) THEN
              CREATE POLICY "Users can manage their own saved places"
              ON public.saved_places
              FOR ALL
              TO authenticated
              USING  (auth.uid() = user_id)
              WITH CHECK (auth.uid() = user_id);
            END IF;

            -- Index for fast user lookups
            CREATE INDEX IF NOT EXISTS idx_saved_places_user ON public.saved_places (user_id);
          END $$;
        `,
      },
    ];

    for (const m of migrations) {
      try {
        await sql.unsafe(m.ddl);
        results.push({ migration: m.name, status: 'ok' });
      } catch (e: any) {
        results.push({ migration: m.name, status: 'error', error: e.message });
      }
    }

    await sql.end();
    return json({ results });
  } catch (err) {
    console.error('[apply-migrations]', err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
