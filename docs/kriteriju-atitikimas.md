# PokerLearn atitikimas kriterijams

Atnaujinta 2026-11-09 pagal Kriterijai (1).pdf. Tai vietinio įgyvendinimo ir patikrų suvestinė, o ne pažado dėl dėstytojo skiriamo balo ar viešo diegimo įrodymas.

| Kriterijus | Būsena ir įrodymas |
|---|---|
| 3 prasmingi objektai ir 15 CRUD/LIST metodų | Įgyvendinta: modulis -> testas -> klausimas; `backend/controllers/routes.go`, `resourceController.go`. |
| Grandinė vienas su daugeliu ir visų 3 objektų URL | Įgyvendinta: `/api/v1/modules/{id}/quizzes/{quizId}/questions`; netinkamam ryšiui 404. |
| Puslapiavimas, filtrai, hypermedia, sudėtinis resursas | Įgyvendinta: `page`, `limit`, tekstiniai/tėviniai filtrai, `_links`, `/api/v1/overview`. |
| Bent 5 prasmingi įrašai hierarchijos lentelėse | Pradiniai duomenys parengti. `TestSeedContentIntegration`, įjungtas su `POKER_INTEGRATION_DSN`, tikrina faktinius modules/quizzes/questions/options kiekius. |
| API testavimo aplinka | 63 Postman užklausos su patikromis; visas rinkinys paleistas per Newman prieš izoliuotą MariaDB. |
| HTTP kodai ir ribinės įvestys | Patikrinti CRUD, 400/401/403/404/409, žetonų gyvavimo ciklas ir nuosavybė. Tarpai, per ilgi tekstai, pasikartojantys atsakymai ir netinkami ID atmetami. Tikras serverio gedimas tebėra 500; absoliutus jo nebuvimas negarantuojamas. |
| JWT su ID/role ir parašu | Įgyvendinta: HS256, sub/role/version/iss/iat/exp, 15 minučių access. |
| Tinkamas žetonų atnaujinimas | Įgyvendinta: 7 dienų refresh, maiša DB, HttpOnly/SameSite slapukas, rotacija, pakartotinio panaudojimo atšaukimas. HTTPS diegime būtinas Secure. |
| Register/login/logout ir 3 rolės | Įgyvendinta: learner/editor/admin; vaidmens ir savininko ID apsauga patikrinta. 2FA papildomas kriterijus neįgyvendintas. |
| GUI CRUD ir autentifikacija | Įgyvendinta: sąrašai, atskiras įrašo skaitymas, kūrimas, keitimas, trynimas; automatinis refresh; administratoriaus rolės keitimo veiksmas. |
| 4 įvesties tipai, ikonos, paveikslai, header/footer, modalai | Įgyvendinta. shadcn/ui Button/Input/Dialog/Tabs/Slider/Switch/Tooltip; Lucide SVG. |
| Vientisas CSS, nestandartiniai šriftai, animacijos ir grįžtamasis ryšys | Įgyvendinta: vietiniai Inter / Newsreader, būsenų pranešimai, CSS animacijos ir reduced-motion. |
| Responsive ir mobilus meniu | Patikrinta 60 puslapio/pločio derinių ir papildomai 20 stalo derinių; 320/390/768/1440px; be horizontalaus slinkimo ir vietų persidengimo. |
| UML diegimo diagrama | Parengta numatomam Oracle VM diegimui; `docs/deployment-diagram.svg`. Tai ne PlantUML ir ne faktinio diegimo patvirtinimas. |
| 3 wireframe ir ekrano vaizdai | Parengta ir atnaujinta: `docs/wireframes.html`, `docs/screenshots/`. |
| OpenAPI su schemomis, pavyzdžiais ir atsakymų kodais | Apima visus 30 realizuotų API metodų; Go testas tikrina maršrutų aprėptį. |
| Ataskaitos struktūra ir numeruotos išvados | Atnaujintas DOCX su tiksliais ribojimais ir naujais ekranais. Tituliniam puslapiui dar reikia studento duomenų; dėstytojo laukas paliktas tuščias. |
| Viešai pasiekiamas frontend ir backend | NEPATVIRTINTA: reikalinga VM prieiga, domenas, realus HTTPS diegimas ir priėmimo patikros. Žr. `DEPLOYMENT_CHECKLIST.md`. |
| Kodo / ataskaitos pateikimas GitHub ar Moodle | NEPATVIRTINTA: vietiniai pakeitimai nėra automatiškai publikuoti. Reikia peržiūrėti ir pateikti galutinę versiją. |
| Temos ir objektų suderinimas su dėstytoju | Studento patvirtinamas organizacinis veiksmas; programos testai to neįrodo. |

Patikrų pakartojimas aprašytas `API_TESTING.md` ir `TRAINING_ENGINE.md`. GUI testai naudoja fiksuotus API atsakymus, o tikri serverio / DB veiksmai tikrinami atskirai. Naujas produkcinis Lighthouse balas nematuotas. Asmeninė pažanga lieka naršyklėje, o AI rekomendacijos yra mokomosios prielaidos, ne GTO sprendimas.
