# PokerLearn projekto užduotis

## Projekto pavadinimas

**PokerLearn – pokerio mokymosi, situacijų analizės ir žaidimo simuliavimo platforma.**

## Sprendžiamo uždavinio aprašymas

### Sistemos paskirtis

Pradedantiesiems pokerio žaidėjams dažnai trūksta vienos vietos, kurioje teorija būtų susieta su praktiniais sprendimais ir jų skaitiniu pagrindimu. „PokerLearn“ skirta mokytis Texas Hold’em taisyklių ir strategijos, praktiškai analizuoti žaidimo situacijas bei suprasti, kaip sprendimą veikia tikimybės, banko dydis ir galimi varžovo veiksmai.

Platformoje naudotojas galės skaityti pamokas, spręsti testus su atsakymų paaiškinimais, skaičiuoti pot odds ir EV, atlikti simuliuojamus veiksmus prieš AI žaidėjus ir peržiūrėti rekomendacijų argumentus. Projektas yra mokymosi priemonė; rekomendacijos pateikiamos kaip apytikslė analizė, o ne garantuotas žaidimo rezultatas.

### Funkciniai reikalavimai

Sistema turi:

- viešai pateikti platformos pristatymą ir leisti svečiui registruotis arba prisijungti;
- registruotam naudotojui pateikti mokymosi modulius ir jų pamokas;
- pateikti testus, klausimus, atsakymų variantus ir teisingo atsakymo paaiškinimus;
- saugoti naudotojo pamokų atlikimo ir testų rezultatus bei rodyti pažangą;
- pateikti pokerio situacijų scenarijus su galimais veiksmais ir trenerio komentarais;
- apskaičiuoti pagrindinius rodiklius, įskaitant pot odds ir tikėtiną vertę (EV), pagal naudotojo įvestus dydžius;
- leisti konfigūruoti žaidimą, AI žaidėjų skaičių ir sudėtingumą, statymų dydžius bei veiksmus fold, check, call, raise ir all-in;
- pateikti pasirinkto veiksmo paaiškinimą ir, kai įmanoma, palyginti jį su alternatyvomis;
- suteikti administratoriui priemones mokymosi moduliams, testams ir klausimams tvarkyti.

## Taikomosios srities objektai

Pagrindiniai trys objektai susieti hierarchiškai:

```text
Mokymosi modulis 1 ── 0..* Testas 1 ── 0..* Klausimas
```

Mokymosi modulis turi kelis testus. Kiekvienas testas turi klausimų, o klausimas gali turėti kelis atsakymų variantus. Duomenų modelyje testas saugo nuorodą į modulį (`module_id`), o klausimas – į testą (`quiz_id`). Taip galima grąžinti konkretaus modulio testų sąrašą ir konkretaus testo klausimus.

## Naudotojų rolės

| Rolė | Pagrindinės teisės |
|---|---|
| Svečias | Peržiūrėti viešą puslapį, registruotis ir prisijungti. |
| Mokinys | Peržiūrėti mokymosi turinį, spręsti testus, naudoti skaičiuokles ir simuliacijas, matyti savo pažangą. |
| Redaktorius | Kurti modulius ir tvarkyti tik savo modulius, testus bei klausimus. |
| Administratorius | Kurti, peržiūrėti, keisti ir šalinti modulius, testus bei klausimus; valdyti naudotojų roles. |

## REST API apimtis

Kiekvienam iš trijų pagrindinių objektų realizuoti penki REST metodai: sąrašo gavimas, vieno įrašo gavimas, sukūrimas, atnaujinimas ir pašalinimas.

| Objektas | Metodas | Kelias | Paskirtis |
|---|---|---|---|
| Modulis | GET | `/api/v1/modules` | Gauti modulių sąrašą. |
| Modulis | GET | `/api/v1/modules/{id}` | Gauti vieną modulį. |
| Modulis | POST | `/api/v1/modules` | Sukurti modulį. |
| Modulis | PUT | `/api/v1/modules/{id}` | Atnaujinti modulį. |
| Modulis | DELETE | `/api/v1/modules/{id}` | Pašalinti modulį. |
| Testas | GET | `/api/v1/quizzes` | Gauti testų sąrašą. |
| Testas | GET | `/api/v1/quizzes/{id}` | Gauti vieną testą. |
| Testas | POST | `/api/v1/quizzes` | Sukurti testą. |
| Testas | PUT | `/api/v1/quizzes/{id}` | Atnaujinti testą. |
| Testas | DELETE | `/api/v1/quizzes/{id}` | Pašalinti testą. |
| Klausimas | GET | `/api/v1/questions` | Gauti klausimų sąrašą. |
| Klausimas | GET | `/api/v1/questions/{id}` | Gauti vieną klausimą. |
| Klausimas | POST | `/api/v1/questions` | Sukurti klausimą. |
| Klausimas | PUT | `/api/v1/questions/{id}` | Atnaujinti klausimą. |
| Klausimas | DELETE | `/api/v1/questions/{id}` | Pašalinti klausimą. |

Hierarchinis metodas `GET /api/v1/modules/{moduleId}/quizzes/{quizId}/questions` tikrina visus tris objektus. Taip pat yra `GET /api/v1/modules/{moduleId}/quizzes` ir `GET /api/v1/quizzes/{quizId}/questions`. Sąrašai priima `page`, `limit` ir filtrus; JSON atsakyme pateikiami `data`, `pagination` ir `_links`.

## Pasirinktų technologijų aprašymas

- **React, TypeScript, Vite ir Tailwind CSS** naudojami interaktyviai ir telefonams pritaikytai naudotojo sąsajai kurti. React Router valdo puslapių navigaciją, Axios siunčia API užklausas, o Zustand saugo dalį sąsajos būsenos.
- **Go ir Gin** naudojami serverio programai ir REST API maršrutams realizuoti. Go pasirinkta dėl aiškios serverio struktūros ir tinkamo našumo, o Gin suteikia HTTP maršrutizavimą bei užklausų apdorojimo priemones.
- **MariaDB/MySQL** saugo naudotojus, mokymosi modulius, pamokas, testus, klausimus, atsakymus ir pažangos duomenis.
- **GORM** naudojamas Go programos ir reliacinės duomenų bazės sąveikai bei modelių migracijoms. MySQL tvarkyklė leidžia prisijungti prie MariaDB/MySQL serverio.
- **JWT** naudojamas autentifikacijai; rolė ir modulio savininko ID riboja rašymo veiksmus.
- **OpenAPI** specifikacija yra `docs/openapi.yaml`, o Postman rinkinys - `docs/PokerLearn.postman_collection.json`.
- **Git saugykla ir `README.md`** naudojami projekto kodui bei projekto užduoties aprašui laikyti ir versijoms sekti.

## Autentifikacija ir saugumas

Prieigos JWT galioja 15 minučių. Atnaujinimo žetonas galioja 7 dienas, naršyklėje saugomas `HttpOnly` ir `SameSite` slapuke, serveryje - tik jo SHA-256 maiša. Viešame HTTPS diegime `COOKIE_SECURE=true` įjungia `Secure`. Atnaujinant žetonas rotuojamas; atsijungiant arba aptikus pakartotinį panaudojimą sesijos panaikinamos. Gin middleware tikrina žetono parašą, ID, rolę ir versiją, o rašymo veiksmai - modulio savininką.

## Architektūra ir diegimas

Kliento pusė kreipiasi į Go API per HTTPS ir REST/JSON. API per GORM pasiekia MariaDB. **Oracle Cloud Infrastructure Compute VM** diegimui parengti `compose.yaml`, du Dockerfile ir Caddy konfigūracija. Caddy pateikia React failus ir persiunčia `/api` į Go. API ir duomenų bazė yra tik vidiniame Docker tinkle. Tai parengta architektūra; viešas diegimas dar neatliktas.

## Paleidimas vietoje

JWT ir endpointų demonstravimas per gynimą: [DEMONSTRAVIMAS_LT.md](docs/DEMONSTRAVIMAS_LT.md).

2026-11-09 atnaujinimas: integruoti shadcn/ui valdikliai ir vietiniai Inter / Newsreader šriftai, atnaujintas pokerio stalas, įvesties validacija ir OpenAPI. Testavimo instrukcijos: [API_TESTING.md](docs/API_TESTING.md); viešo diegimo darbai: [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md). API maršrutai registruojami `backend/controllers/routes.go`.

Atnaujintos mokymosi aplinkos, simuliatoriaus, skaičiavimų ir testavimo aprašymas: [Training Experience](docs/TRAINING_ENGINE.md). Naujos bibliotekos pažanga ir asmeninės pastabos saugomos konkrečioje naršyklėje, atskirai kiekvienam naudotojui; jos nesinchronizuojamos tarp įrenginių.

1. Paleiskite MariaDB ir sukurkite `poker_db` duomenų bazę bei `poker_app` naudotoją arba nustatykite savo `DATABASE_DSN`.
2. PowerShell lange `backend` kataloge nustatykite ilgą atsitiktinį `JWT_SECRET` ir paleiskite `go run .`:

   ```powershell
   $env:JWT_SECRET = "replace-with-at-least-32-random-characters"
   go run .
   ```

3. Kitame lange `frontend` kataloge paleiskite `npm ci` ir `npm run dev`. Sąsaja pasiekiama `http://localhost:5173`; Vite persiunčia `/api` į `localhost:8080`.
4. Užregistruokite paskyrą. Kad ji taptų pirmuoju administratoriumi, nustatykite `ADMIN_EMAIL` į tos paskyros el. paštą ir iš naujo paleiskite Go serverį. Vėliau administratorius gali keisti roles per `PUT /api/users/{id}/role`.

## Diegimas Oracle VM

VM turi turėti Docker Compose, viešą IP, į domeną nukreiptą DNS įrašą ir atvertus 80/443 prievadus. Sukurkite `.env` pagal `.env.example`, įrašykite realų domeną, unikalius duomenų bazės slaptažodžius ir bent 32 simbolių `JWT_SECRET`, tada vykdykite `docker compose up -d --build`. Tikrinti galima `https://<domenas>/api/health`. Be VM ir domeno projektas dar nėra viešai pasiekiamas.

## Patikra ir ataskaita

`cd backend; go test ./...` tikrina Go kodą ir OpenAPI sintaksę. `cd frontend; npm run build` patikrina TypeScript ir surenka sąsają. Postman rinkinyje yra 15 metodų, hierarchiniai keliai ir klaidų atvejai. Ataskaita: `outputs/LAB0_PokerLearn_ataskaita.docx`.

## Projekto užduoties vieta ir derinimas

Projekto užduotis laikoma šioje Git saugykloje, `README.md` faile. Pagrindinė dėstytojui derinti tema: **pokerio mokymosi ir simuliavimo platforma „PokerLearn“**. Derinimui siūlomi trys pagrindiniai objektai: **Mokymosi modulis, Testas ir Klausimas**, susieti ryšiu `Mokymosi modulis → Testas → Klausimas`. Šis aprašas nusako siūlomą projekto apimtį; temos ir objektų galutinis patvirtinimas priklauso nuo suderinimo su dėstytoju.
