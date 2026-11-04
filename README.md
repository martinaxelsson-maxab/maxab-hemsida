# Maxab Fastigheter

Statisk webbplats för Maxab Fastigheter AB. Den publiceras med GitHub Pages och kan senare kopplas till maxab.com.

Sidorna är:

- **Start** – kort beskrivning av uthyrningen i Arboga
- **Felanmälan** – formulär till thomas@maxab.com
- **Lediga lokaler** – lista som läses från `data/lediga.json`
- **Logga in** – personal, via länk i sidfoten

## Köra lokalt

Öppna inte html-filerna direkt från hårddisken. Listan med lokaler hämtas med JavaScript och behöver en liten webbserver. I repots rot:

```bash
python3 -m http.server 8000
```

Öppna sedan http://localhost:8000

## Lägga till eller ta bort ett ledigt objekt

Allt som syns under Lediga lokaler styrs av `data/lediga.json`. Sidans html behöver inte ändras.

1. Öppna `data/lediga.json`.
2. Kopiera exemplet och lägg ett nytt objekt i listan `objekt`. Ordningen i filen är ordningen på sidan.
3. Sätt `"published": true` när objektet ska synas. Värdet ska vara `true` eller `false` utan citattecken.
4. Lägg eventuella bilder i `assets/objekt/` och peka på dem med en relativ sökväg, till exempel `assets/objekt/lager-1.jpg`. Använd enkla filnamn utan mellanslag.
5. Spara, committa och pusha till `main`. GitHub Pages publicerar ändringen.

Ett objekt som inte ska synas kan tas bort ur listan, eller stå kvar med `"published": false`.

För att se utkast i webbläsaren, öppna `lediga.html?utkast=1`. Den vyn är inte den vanliga sidan. Besökare utan den adressen ser bara objekt med `"published": true`. Just nu finns ett exempelobjekt som är dolt, så den publika sidan visar det tomma läget.

```json
{
  "id": "lager-exempel",
  "published": true,
  "title": "Rubrik som besökaren ser",
  "type": "industri",
  "address": "Gatuadress, Arboga",
  "areaSqm": 320,
  "description": "Kort beskrivning.",
  "images": ["assets/objekt/lager-1.jpg"],
  "access": "Enligt överenskommelse",
  "rent": "Enligt överenskommelse"
}
```

`type` är `industri`, `handel` eller `kontor`. `images` kan vara en tom lista. `rent` och `access` kan utelämnas eller vara tomma strängar, då visas inte den raden.

Varje publicerat objekt får en intresseanmälan. Den skickas till **martin@maxab.com**, med objektets rubrik i ämnesraden. Felanmälan går till en annan adress, se nedan.

## Formulär

Sajten har ingen egen server. Formulären postas till [FormSubmit](https://formsubmit.co).

| Formulär | Mottagare |
| --- | --- |
| Felanmälan | thomas@maxab.com |
| Intresseanmälan, även den allmänna förfrågan när inget är ledigt | martin@maxab.com |

Felanmälan har fälten namn, telefon, e-post, fastighet/adress, beskrivning och en valfri bild. Mailet använder tabellmall (`_template=table`), skräppostkontroll (`_captcha`) och en egen tacksida (`_next`). Tacksidans adress sätts av sidan själv, så samma formulär fungerar lokalt, på GitHub Pages och senare på maxab.com.

**Aktivering, en gång per adress.** Första gången ett formulär skickas till en e-postadress skickar FormSubmit ett aktiveringsmejl till den adressen. Någon måste öppna mejlet och bekräfta länken. Innan dess kommer anmälan inte fram. thomas@maxab.com och martin@maxab.com aktiveras var för sig. Gör ett test från felanmälan och ett från förfrågan under det tomma läget på Lediga lokaler, och bekräfta båda mejlen. Det behövs bara en gång per adress.

## Publicera med GitHub Pages

Workflow-filen `.github/workflows/pages.yml` publicerar repots innehåll när något pushas till `main`.

Gör en gång i repot på GitHub:

1. Settings → Pages.
2. Under **Build and deployment**, sätt **Source** till **GitHub Actions** (inte “Deploy from a branch”).
3. Merga till `main`. Körningen syns under Actions. När den är grön ligger sajten på `https://<användarnamn>.github.io/<repo>/`.

Om repot heter `<användarnamn>.github.io` blir adressen `https://<användarnamn>.github.io/` i stället.

## Koppla maxab.com senare

Gör inte detta förrän domänen ska peka hit. Det finns ingen `CNAME`-fil i repot, och ingen ska läggas dit i förväg.

### Rör inte e-posten

maxab.com har mejl via Google Workspace. När DNS ändras för webbplatsen:

- ändra inte MX-posterna
- ta inte bort befintliga TXT-poster för SPF, DKIM eller DMARC
- en ny TXT-post som GitHub ber om för att verifiera domänen läggs till bredvid de som redan finns

När det är klart ska mejl till `@maxab.com` fortfarande gå till Google. Kontrollera MX innan och efter ändringen. De ska fortsätta peka på Google, till exempel `aspmx.l.google.com`.

### DNS för själva sajten

1. I repot: Settings → Pages → Custom domain → skriv `maxab.com` → Save. Med GitHub Actions behövs ingen `CNAME`-fil i repot.
2. Hos den som hanterar DNS för maxab.com, lägg till webbposterna och lämna MX ifred.

För själva domänen (maxab.com utan www), fyra A-poster:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Och fyra AAAA-poster:

```text
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

Rekommenderat är också en CNAME för `www` som pekar på `<användarnamn>.github.io` (utan reponamn).

Adresserna ovan kommer från GitHubs dokumentation om anpassad domän. Jämför med den aktuella listan innan de sparas, ifall GitHub har bytt adresser.

3. När DNS har slagit igenom, slå på **Enforce HTTPS** under Pages.
4. Om personalinloggningen redan är igång, lägg till `https://maxab.com/**` och `https://www.maxab.com/**` bland tillåtna adresser i Supabase. Se nedan.

## Personalinloggning

GitHub Pages på ett publikt repo kan inte lösenordsskydda filer. Ett lösenord i sidans JavaScript går att läsa för vem som helst, och html-filerna går att ladda ner ändå. Därför finns inget lösenord i koden och inget internt material i `/intern/`.

Inloggningen är **Supabase Auth med engångslänk till e-post** (magic link). Efter inloggning hämtar sidan texter från tabellen `internal_pages`. Den som inte är inloggad får inga rader. Det sköts av Row Level Security i Supabase, inte av en spärr i webbläsaren.

Tills `js/config.js` fylls i visar inloggningen att den inte är aktiverad. Det interna området är då bara det tomma skalet.

### Så aktiverar ni den

1. Skapa ett konto på [supabase.com](https://supabase.com). Gratisnivån räcker.
2. Skapa ett projekt. Välj en region i EU, till exempel Stockholm (`eu-north-1`). Spara databaslösenordet i en lösenordshanterare, inte i repot.
3. **Authentication → Sign In / Providers → Email.** E-post ska vara på. Stäng av **Allow new users to sign up**, så att en besökare inte kan skapa ett konto själv. Formuläret ber dessutom Supabase att inte skapa nya användare (`shouldCreateUser: false`). Båda sakerna ska vara på plats.
4. **Authentication → URL Configuration.**
   - Site URL: adressen sajten faktiskt har, till exempel `https://<användarnamn>.github.io/<repo>/` eller senare `https://maxab.com`.
   - Redirect URLs, lägg till var och en:
     - `http://localhost:8000/**`
     - `https://<användarnamn>.github.io/**`
     - `https://maxab.com/**`
     - `https://www.maxab.com/**`
5. **Project Settings → API Keys** (kan också heta API). Kopiera
   - Project URL
   - den publika nyckeln, `anon` / `public` eller `publishable`
6. Klistra in dem i `js/config.js` i stället för `YOUR_PROJECT_REF` och `YOUR_SUPABASE_ANON_KEY`. Committa och pusha.

   Den publika nyckeln är gjord för att ligga i webbläsaren. Skyddet är inloggningen och RLS, inte att nyckeln är hemlig.

   Lägg **aldrig** in `service_role` eller `secret` i `js/config.js`, i någon html-fil eller någon annanstans i repot.
7. **SQL Editor → New query.** Klistra in hela `intern/schema.sql` och kör. Det skapar tabellen och regeln att bara inloggade får läsa den.
8. Lägg till varje anställd:
   - **Authentication → Users → Add user**
   - samma e-postadress som personen ska logga in med
   - bocka i **Auto Confirm User**
   - spara
9. Personen öppnar **Logga in** på sajten, skriver den adressen och trycker på **Skicka inloggningslänk**. Länken kommer med e-post. Sidan säger samma sak oavsett om adressen finns eller inte. Kommer inget mejl: kontrollera att användaren är skapad, att avsändaren inte fastnat i skräppost, och att sajtens adress finns bland Redirect URLs.

Valfritt: under **Authentication → Emails** kan mallen för magic link skrivas på svenska. Behåll länken som mallen redan innehåller (`{{ .ConfirmationURL }}`).

### Lägga till något inne i det interna området

Två sätt, beroende på vad som ska in:

**En text som bara personal ska se.** Table Editor → `internal_pages` → Insert row. Fyll i `slug` (små bokstäver och bindestreck, till exempel `anteckningar`), `title`, `body` och `sort_order`. Texten dyker upp i menyn för den som är inloggad. Den ligger i Supabase, inte i git.

**Ett nytt verktyg (en egen sida).** Kopiera `intern/exempel.html` till ett nytt namn i samma mapp, till exempel `intern/rond.html`. Byt rubriken. Lägg en länk till filen i menyn (`<nav class="intern-nav">`) i `intern/index.html` och i de andra interna sidorna. Hämta skyddade uppgifter från Supabase i sidans script, efter samma inloggningskontroll som `js/intern.js` redan gör. Skriv inte avtal, hyresgäster eller andra känsliga uppgifter i html-filen. Filen kan läsas av vem som helst som hittar adressen.

## Logotyp

- `assets/logo.svg` – liggande originalkomposition, genomskinlig bakgrund
- `assets/logo.jpg` – samma märke på vit bakgrund
- `assets/logo-liggande.svg` – varianten i sidhuvudet
- `assets/logo-mark.svg` och `assets/favicon.svg` – bara M-märket, används som ikon

Typsnittet Inter ligger som små delmängder i `assets/fonts/` under SIL Open Font License. Licenstexten finns i `assets/fonts/OFL.txt`.

## Filer att känna till

```text
index.html              startsida
felanmalan.html         felanmälan
lediga.html             lediga lokaler
tack.html               sida efter ett formulär
logga-in.html           personalinloggning
404.html                okänd adress
data/lediga.json        lediga objekt
intern/index.html       internt skal
intern/exempel.html     mall för en ny undersida
intern/schema.sql       körs i Supabase, inte i webbläsaren
js/config.js            Supabase-adress och publik nyckel
css/style.css           utseende
.github/workflows/pages.yml
```
