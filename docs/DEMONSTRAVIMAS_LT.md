# JWT ir API demonstravimas

## Pasiruošimas

Atidaryk [viešą PokerLearn svetainę](https://pokerlearn.144-24-247-126.sslip.io:5000). React sąsaja ir `/api` pasiekiami tuo pačiu HTTPS adresu. Vietiniam darbui naudok `http://127.0.0.1:5173`, o tiesioginėms API užklausoms `http://127.0.0.1:8080`.

CRUD demonstravimui naudok redaktoriaus arba administratoriaus paskyrą. Nauja registracija suteikia tik `learner` rolę. Neturint administratoriaus, pirmiausia registruojama paskyra, jos el. paštas laikinai nustatomas `ADMIN_EMAIL` aplinkos kintamajame ir perkraunamas backend. Po suteikimo bootstrap reikšmę pašalink. Nenaudok tikrų kitų žmonių paskyrų demonstravimui.

## 1. Parodyk, kur gaunamas access žetonas

1. Atidaryk naršyklės kūrėjo įrankius (`F12`) ir `Network` skiltį. Įjunk `Preserve log`.
2. Prisijunk prie svetainės. Pasirink `POST /api/login` užklausą.
3. `Response` skiltyje parodyk `token` ir paskyros `id`, `username`, `role`. Tikras žetonas nėra įrašytas į GitHub saugyklą.
4. Atidaryk mokymosi skydelį. Pasirink `GET /api/modules` ir `Headers` skiltyje parodyk `Authorization: Bearer ...`.

Paaiškinimas: access JWT perduodamas su kiekviena saugoma API užklausa. Žetono parašą, galiojimą ir paskyros duomenis tikrina serveris, ne vien kliento pusė.

## 2. Paaiškink JWT struktūrą ir parodyk kodą

JWT turi tris taškais atskirtas dalis: `header.payload.signature`. Header ir payload yra Base64URL užkoduoti, bet ne užšifruoti. Payload perskaitymas nėra parašo patikrinimas ir nesuteikia galimybės pasirašyti pakeisto žetono.

Mūsų payload laukai:

| Laukas | Paskirtis |
|---|---|
| `sub` | Paskyros ID |
| `role` | `learner`, `editor` arba `admin` |
| `version` | Leidžia atmesti ankstesnius žetonus po atšaukimo |
| `iss` | Išdavėjas `pokerlearn` |
| `iat` | Išdavimo laikas Unix sekundėmis |
| `exp` | Galiojimo pabaiga; `exp - iat = 900` sekundžių |

Atidaryk [jwt.go](../backend/utils/jwt.go): `GenerateToken` sudaro claims ir pasirašo HS256; `ParseToken` tikrina parašą, algoritmą, išdavėją bei galiojimą. Raktas imamas iš `JWT_SECRET`, jo nerodyk auditorijai ir neįkelk į GitHub.

Jei nori parodyti payload be išorinės svetainės, nukopijuok tik demonstracinį JWT ir naršyklės konsolėje paleisk šį kodą. `prompt` yra tik laikinas DevTools veiksmas, ne aplikacijos funkcija:

```javascript
const demoToken = prompt('Demonstracinis access JWT');
const part = demoToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
const bytes = Uint8Array.from(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')), c => c.charCodeAt(0));
const claims = JSON.parse(new TextDecoder().decode(bytes));
console.table(claims);
console.log('Galiojimas sekundėmis:', claims.exp - claims.iat);
```

Po demonstracijos uždaryk konsolę ir atsijunk. Nesiųsk galiojančio JWT į viešus dekoderius ar ekrano nuotraukas.

## 3. Parodyk refresh ir logout

1. DevTools skiltyje `Application -> Cookies` surask `pokerlearn_refresh`. Parodyk `HttpOnly`, `SameSite=Lax` ir `/api` kelią, ne visą žetono reikšmę.
2. Vietinis HTTP paleidimas neturi `Secure`; viešame HTTPS diegime jis įjungiamas per `COOKIE_SECURE=true`.
3. To paties prisijungusio puslapio konsolėje vykdyk:

```javascript
const refreshed = await fetch('/api/refresh', { method: 'POST', credentials: 'include' });
console.log('Refresh statusas:', refreshed.status);
```

4. `Network` skiltyje atidaryk refresh užklausą: atsakymas 200, JSON yra access JWT, o `Set-Cookie` nustato pakeistą refresh žetoną. Rankinis fetch neatnaujina React saugomos būsenos; ją įprastai atnaujina Axios interceptor. Perkrauk puslapį, kad programa pati atliktų atkūrimą.
5. Paspausk `Log out`: `POST /api/logout` turi grąžinti 204. Su prieš atsijungimą išsaugotu access JWT Postman užklausa turi gauti 401.

Refresh žetonas yra atskira atsitiktinė reikšmė, ne JWT. DB saugoma tik jo SHA-256 maiša. Access galioja 15 minučių, refresh sesija - 7 dienas. Kiekvienas refresh rotuoja slapuką; seno refresh pakartotinis panaudojimas atšaukia paskyros sesijas. Du per tą pačią sekundę išduoti access JWT gali sutapti, todėl rotaciją tikrink pagal refresh slapuką, ne vien JWT tekstą.

Kode parodyk [authController.go](../backend/controllers/authController.go) funkcijas `Refresh`, `Logout`, `RequireAuth`; kliento automatinis atnaujinimas yra [axios.ts](../frontend/src/lib/axios.ts).

## 4. Parodyk endpointus per Postman

Importuok [Postman rinkinį](PokerLearn.postman_collection.json). Nustatyk `baseUrl=http://127.0.0.1:8080`, `adminEmail`, `adminPassword` ir paleisk aplankus eilės tvarka. Slaptažodžius laikyk tik vietinėse reikšmėse, ne eksportuojamoje kolekcijoje. Rinkinys kuria demonstracines paskyras bei turinį, todėl jo nepaleisk prieš tikrą produkcinę DB. Išsami instrukcija: [API_TESTING.md](API_TESTING.md).

Vienam objektui parodyk pilną ciklą:

| Užklausa | Tikėtinas atsakymas |
|---|---|
| `GET /api/v1/modules?page=1&limit=2` | 200, `data`, `pagination`, `_links` |
| `POST /api/v1/modules` | 201, naujas ID ir `Location` antraštė |
| `GET /api/v1/modules/{naujasId}` | 200, sukurtas modulis |
| `PUT /api/v1/modules/{naujasId}` | 200, pakeistas modulis |
| `DELETE /api/v1/modules/{naujasId}` | 204, tuščias atsakymas |
| `GET /api/v1/modules/{pašalintasId}` | 404 |

POST ir PUT pavyzdys:

```json
{
  "title": "River practice",
  "description": "Practice river value bets and bluff catches.",
  "display_order": 7
}
```

Parodyk ir išskirtinius atvejus:

| Demonstracija | Kodas ir priežastis |
|---|---|
| `GET /api/v1/modules` su `No Auth` | 401: neautentifikuotas |
| Ta pati užklausa su pakeistu/negaliojančiu JWT | 401: netinkamas parašas ar žetonas |
| `GET /api/v1/modules?page=0` su galiojančiu JWT | 400: netinkama įvestis |
| `POST /api/v1/modules` su mokinio JWT | 403: nepakanka rolės |
| Svetimo modulio PUT/DELETE su kito redaktoriaus JWT | 403: ne tas savininkas |
| Neegzistuojančio modulio GET | 404: resursas nerastas |
| `/api/v1/modules/{A}/quizzes/{B}/questions`, kai B priklauso kitam moduliui | 404: neteisinga hierarchinė apimtis |

Hierarchijos ID pasirink iš gautų arba sukurtų įrašų, ne spėk. Postman rinkinys juos automatiškai įrašo į kolekcijos kintamuosius. Abiem redaktoriams turi būti suteikta ta pati rolė: tuomet 403 aiškiai įrodo savininko ID, o ne vien rolės patikrą.

Kode: [routes.go](../backend/controllers/routes.go) registruoja visus 30 metodų; [resourceController.go](../backend/controllers/resourceController.go) įgyvendina operacijas, `canEditModule` nuosavybės patikrą ir `ListQuestions` hierarchijos tikrinimą. [openapi.yaml](openapi.yaml) aprašo API sutartį.

## Trumpas paaiškinimas dėstytojui

„Sistemoje yra trys hierarchiškai susieti objektai: modulis, testas ir klausimas. Kiekvienam įgyvendinti CRUD ir sąrašo gavimas. API naudoja HTTP metodus, JSON, puslapiavimą ir nuorodas į resursus. Autentifikacijai naudojamas pasirašytas trumpalaikis JWT, o patogiam prisijungimo išlaikymui - rotuojamas refresh žetonas. Autorizacija tikrina ir rolę, ir įrašo savininką, todėl vienas redaktorius negali keisti kito turinio.“

Diegimą parodyk atidaręs viešą svetainę ir [API būsenos endpointą](https://pokerlearn.144-24-247-126.sslip.io:5000/api/health). Teorija, prievadai ir papildomos diegimo patikros aprašytos [diegimo dokumentacijoje](DEPLOYMENT_CHECKLIST.md). 2FA, HTTP atsakymų kešavimas ir pažangos sinchronizavimas tarp įrenginių nėra šios demonstracijos dalis.
