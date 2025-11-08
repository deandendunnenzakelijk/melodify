# Melodify - Spotify Clone

Een volledige Spotify-clone webapplicatie met moderne functionaliteit en design, gebouwd met React, Tailwind CSS en Supabase.

## Features

### ✅ Kernfunctionaliteit
- **Gebruikersauthenticatie**: Registreren, inloggen met Supabase Auth
- **Audio Player**: Volledige audio player met play/pause, next/previous, shuffle, repeat
- **Real-time Muziek Streaming**: Stream muziek direct vanuit de database
- **Zoekfunctie**: Zoek door artiesten, nummers en albums
- **Afspeellijsten**: Maak, bewerk en beheer je eigen playlists
- **Liked Songs**: Like je favoriete nummers en bekijk ze in één overzicht
- **Bibliotheek**: Bekijk al je playlists en opgeslagen content
- **Luistergeschiedenis**: Houd bij wat je hebt geluisterd
- **Queue Systeem**: Wachtrij beheer voor naadloos afspelen

### 🎨 Design Features
- **Modern UI**: Geïnspireerd op Spotify Premium 2025
- **Dark & Light Mode**: Schakel tussen donkere en lichte thema's
- **Responsive Design**: Werkt perfect op desktop, tablet en mobiel
- **Smooth Animations**: Vloeiende overgangen en hover effecten
- **Mini Player**: Blijft onderaan tijdens navigatie

### 🛠️ Admin Features
- **Admin Dashboard**: Beheer artiesten en tracks
- **Content Upload**: Voeg nieuwe muziek toe aan de database
- **User Management**: Bekijk en beheer gebruikers (via Supabase)

### 🎵 Player Features
- Volume control met slider
- Progress bar met seek functionaliteit
- Shuffle en repeat modes
- Like/unlike functionaliteit vanuit de player
- Albumcover weergave
- Artist informatie

## Tech Stack

### Frontend
- **React 18** met TypeScript
- **Vite** voor snelle development
- **Tailwind CSS** voor styling
- **Lucide React** voor icons

### Backend & Database
- **Supabase** voor:
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Row Level Security (RLS)

## Database Schema

### Tables
- `profiles` - Gebruikersprofielen met premium status
- `artists` - Artiest informatie
- `albums` - Album details
- `tracks` - Muziek tracks met audio URLs
- `playlists` - Gebruiker playlists
- `playlist_tracks` - Playlist-track relaties
- `liked_tracks` - Gelikede nummers per gebruiker
- `listening_history` - Luistergeschiedenis
- `follows` - Volg-relaties tussen gebruikers

## Installatie

### Vereisten
- Node.js 18+ geïnstalleerd
- Een Supabase account (gratis)

### Stappen

1. **Clone de repository**
   ```bash
   git clone <repository-url>
   cd melodify
   ```

2. **Installeer dependencies**
   ```bash
   npm install
   ```

3. **Environment variabelen**

   De `.env` file is al geconfigureerd met Supabase credentials. De database schema is al aangemaakt.

  Voor de artiestmodus en Cloudflare R2 uploads heb je daarnaast het volgende nodig:

  - `VITE_R2_SIGNING_URL`: HTTPS-endpoint van je Cloudflare Worker of andere backend die gesigneerde `PUT`-URL's naar R2 afgeeft.
  - `VITE_R2_SIGNING_API_KEY`: (optioneel) API-key die als `x-api-key`-header naar je worker wordt gestuurd.
  - `VITE_R2_PUBLIC_BASE_URL`: (optioneel) Publieke basis-URL van je bucket, bv. `https://pub-<bucket>.r2.dev`, gebruikt als fallback wanneer het signing-endpoint geen publieke URL terugstuurt.

   > ⚠️ **Geheimen opslaan**: Deel Cloudflare API-tokens, access keys of secrets nooit in de repository. Bewaar ze als environment variabelen of in een secrets manager.

  Een minimale Worker om upload-URL's te verstrekken ziet er zo uit:

   ```ts
   export default {
     async fetch(request, env) {
       if (request.method !== 'POST') {
         return new Response('Method not allowed', { status: 405 });
       }

       const { fileName, contentType, folder, objectKey, metadata } = await request.json();
       const safeName = fileName || 'upload';
       const key = objectKey ?? `${folder ? `${folder}/` : ''}${Date.now()}-${safeName}`;

       const signed = await env.MY_BUCKET.createPresignedUrl({
         method: 'PUT',
         key,
         expiration: 60,
         headers: {
           'content-type': contentType ?? 'application/octet-stream',
         },
         customMetadata: metadata ?? {},
       });

       return Response.json({
         uploadUrl: signed.url,
         key,
         publicUrl: `${env.PUBLIC_BASE_URL}/${key}`,
       });
     },
   } satisfies ExportedHandler<{ MY_BUCKET: R2Bucket; PUBLIC_BASE_URL: string }>;
   ```

  Bind de R2 bucket (`MY_BUCKET`) en een `PUBLIC_BASE_URL` secret in `wrangler.toml` en beveilig het endpoint met bijvoorbeeld een API-key voordat je het in `VITE_R2_SIGNING_URL` configureert.

  #### Worker testen

  1. **Vraag handmatig een gesigneerde URL op**

     ```bash
     curl -X POST https://<jouw-worker>.workers.dev \
       -H "content-type: application/json" \
       -H "x-api-key: <jouw-api-key>" \
       -d '{
         "fileName": "demo.mp3",
         "contentType": "audio/mpeg",
         "folder": "artists/test/tracks"
       }'
     ```

     De response hoort `uploadUrl`, `key` en `publicUrl` te bevatten. Krijg je `401`, controleer dan de API-key.

  2. **Upload een bestand naar de gesigneerde URL**

     ```bash
     curl -X PUT "<uploadUrl uit stap 1>" \
       -H "content-type: audio/mpeg" \
       --data-binary @pad/naar/bestand.mp3
     ```

     Bij succes verschijnt het object onder de teruggegeven `key` in je R2-bucket.

  3. **Koppel de frontend**

     Voeg de volgende regels toe aan je `.env` of `.env.local`:

     ```bash
     VITE_R2_SIGNING_URL=https://<jouw-worker>.workers.dev
     VITE_R2_SIGNING_API_KEY=<jouw-api-key>
     VITE_R2_PUBLIC_BASE_URL=https://pub-<bucket>.r2.dev
     ```

     Herstart `npm run dev`. De frontend stuurt nu automatisch de `x-api-key` mee en gebruikt de worker om upload-URL's op te vragen.

4. **Start de development server**
   ```bash
   npm run dev
   ```

5. **Open de app**

   Ga naar `http://localhost:5173` in je browser

## Gebruik

### Eerste gebruik

1. **Account aanmaken**
   - Klik op "Registreren"
   - Vul email, wachtwoord, gebruikersnaam en weergavenaam in
   - Log in met je nieuwe account

2. **Sample data**

   Er zijn al 5 artiesten en 10 tracks toegevoegd aan de database met sample audio.

3. **Admin toegang**

   Om admin te worden, voer deze SQL query uit in Supabase:
   ```sql
   UPDATE profiles
   SET is_admin = true
   WHERE email = 'jouw@email.com';
   ```

### Muziek toevoegen (Admin)

1. Ga naar je profiel dropdown (rechtsboven)
2. Klik op "Admin Dashboard"
3. Voeg artiesten toe met avatar URL
4. Voeg tracks toe met:
   - Titel
   - Artiest selectie
   - Duur in seconden
   - Audio URL (MP3 link)
   - Cover URL (afbeelding)

### Playlists maken

1. Klik op "Playlist maken" in de sidebar
2. Voeg nummers toe vanuit zoekresultaten of je bibliotheek
3. Deel playlists door ze publiek te maken

## Project Structuur

```
melodify/
├── src/
│   ├── components/        # Herbruikbare componenten
│   │   ├── Sidebar.tsx   # Navigatie sidebar
│   │   ├── Player.tsx    # Audio player
│   │   └── Header.tsx    # Top navigatie
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx    # Authenticatie
│   │   ├── PlayerContext.tsx  # Audio player state
│   │   └── ThemeContext.tsx   # Dark/light mode
│   ├── pages/            # Route componenten
│   │   ├── Home.tsx      # Homepage met aanbevelingen
│   │   ├── Search.tsx    # Zoekpagina
│   │   ├── Library.tsx   # Bibliotheek overzicht
│   │   ├── LikedSongs.tsx # Liked songs pagina
│   │   ├── Profile.tsx   # Gebruikersprofiel
│   │   ├── Admin.tsx     # Admin dashboard
│   │   └── Auth.tsx      # Login/registratie
│   ├── lib/              # Utilities en config
│   │   ├── supabase.ts   # Supabase client
│   │   ├── database.types.ts # TypeScript types
│   │   └── utils.ts      # Helper functies
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── supabase/
│   └── migrations/       # Database migraties
└── package.json
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build voor productie
npm run preview  # Preview productie build
npm run lint     # Lint code
```

## Features in Detail

### Audio Player
De audio player gebruikt de native HTML5 Audio API en biedt:
- Play/pause functionaliteit
- Next/previous track navigatie
- Shuffle mode (randomize queue)
- Repeat modes (off/all/one)
- Volume controle
- Seek functionaliteit via progress bar
- Real-time progress tracking

### Authentication
Volledig beveiligde authenticatie met:
- Email/wachtwoord registratie
- Automatische profiel creatie
- Session management
- Row Level Security op alle database operaties

### Search
Geavanceerde zoekfunctionaliteit:
- Real-time zoeken tijdens typen
- Zoek door tracks en artiesten
- Gefilterde resultaten
- Instant preview van zoekresultaten

### Responsive Design
- Desktop: Volledige sidebar, grote albumcovers
- Tablet: Geoptimaliseerde layout
- Mobile: Hamburger menu, gestapelde content

## Security

De applicatie gebruikt Supabase Row Level Security (RLS) voor:
- Gebruikers kunnen alleen hun eigen data bewerken
- Publieke content (tracks, artiesten) is leesbaar voor iedereen
- Admin-only acties worden gecontroleerd op database niveau
- Authenticated access voor alle protected routes

## Performance Optimizations

- Lazy loading van afbeeldingen
- Optimized database queries met joins
- Context-based state management (geen prop drilling)
- Memoization van expensive calculations
- Efficient re-rendering met React best practices

## Toekomstige Features

### Mogelijk uit te breiden met:
- **WebSockets**: Real-time synchronisatie tussen devices
- **Lyrics**: Synchronized lyrics weergave
- **AI Aanbevelingen**: Machine learning voor gepersonaliseerde playlists
- **Offline Mode**: Service Workers voor offline gebruik
- **Social Features**: Volg vrienden, zie wat zij luisteren
- **Audio Analysis**: Beat detection, tempo, key analysis
- **Downloads**: Offline muziek voor premium gebruikers
- **Podcasts**: Ondersteuning voor podcast content
- **Radio**: Auto-generated radio stations
- **Collaborative Playlists**: Samen playlists bewerken

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Licentie

Dit is een educatief project en demo applicatie.

## Credits

- **Design inspiratie**: Spotify
- **Icons**: Lucide React
- **Stock afbeeldingen**: Pexels
- **Sample audio**: SoundHelix (royalty-free)
- **Database & Auth**: Supabase

---

Gebouwd met ❤️ voor muziekliefhebbers
