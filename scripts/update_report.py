from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
document = Document(ROOT / 'docs/templates/LAB0_PokerLearn_base.docx')
for paragraph in list(document.paragraphs)[19:]:
    paragraph._element.getparent().remove(paragraph._element)
teacher = next(paragraph for paragraph in document.paragraphs if paragraph.text.startswith('Dėstytojas:'))
group = teacher.insert_paragraph_before('Grupė:       ____________________________________')
group.alignment = teacher.alignment
group.paragraph_format.first_line_indent = Pt(0)
for name in ['Normal', 'Heading 1', 'Heading 2']:
    style = document.styles[name]
    style.font.name = 'Arial'
    style.font.color.rgb = __import__('docx').shared.RGBColor(0, 0, 0)
document.styles['Normal'].font.size = Pt(11)
document.styles['Normal'].paragraph_format.line_spacing = 1.15
document.styles['Normal'].paragraph_format.space_after = Pt(7)
document.styles['Heading 1'].font.size = Pt(15)
document.styles['Heading 2'].font.size = Pt(12)

def p(text):
    return document.add_paragraph(text)

def h(text, level=1):
    heading = document.add_heading(text, level)
    if level == 1 and not text.startswith('1.'):
        heading.paragraph_format.page_break_before = True
    return heading

def picture(file, caption, max_height=4.4):
    image = ROOT / file
    width, height = Image.open(image).size
    inches = min(6.1, max_height * width / height)
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.keep_with_next = True
    paragraph.alignment = 1
    paragraph.add_run().add_picture(str(image), width=Inches(inches))
    caption_p = document.add_paragraph(caption)
    caption_p.alignment = 1
    caption_p.paragraph_format.space_after = Pt(12)
    for run in caption_p.runs:
        run.font.size = Pt(9)

heading = document.add_paragraph('Turinys')
heading.paragraph_format.keep_with_next = True
heading.runs[0].bold = True
heading.runs[0].font.size = Pt(15)
heading.paragraph_format.page_break_before = False
toc = document.add_paragraph()
field = OxmlElement('w:fldSimple')
field.set(qn('w:instr'), 'TOC \\o "1-2" \\h \\z \\u')
toc._p.append(field)
document.add_page_break()
h('1. Sprendžiamo uždavinio aprašymas')
h('1.1. Sistemos paskirtis', 2)
p('PokerLearn yra Texas Hold’em mokymosi platforma. Joje teorinės pamokos susiejamos su testais, banko šansų ir tikėtinos vertės skaičiavimais bei žaidimo simuliacijomis. Tikslas yra padėti pagrįsti sprendimą turima informacija, o ne vertinti jį vien pagal atsitiktinį vienos partijos rezultatą.')
h('1.2. Funkciniai reikalavimai', 2)
for text in [
 'Svečias gali peržiūrėti viešą pristatymą, registruotis ir prisijungti.',
 'Mokinys skaito pamokas, sprendžia testus, gauna atsakymų paaiškinimus ir kartoja klaidingai atsakytus klausimus.',
 'Naudotojas skaičiuoja EV ir pot odds, keičia kortas bei varžovo diapazoną Equity Lab aplinkoje.',
 'Simuliacijoje pasirenkama 1–5 AI priešininkai, žetonų kiekis ir baigtinės sesijos trukmė; atliekami fold, check, call, raise bei all-in veiksmai.',
 'Galima išsaugoti mokymosi pastabas, partijas ir stalo nustatymus konkrečioje naršyklėje. Šie duomenys atskiriami pagal paskyros ID.',
 'Redaktorius per GUI kuria ir tvarko jam priklausančius modulius, testus ir klausimus. Administratorius tvarko visą turinį ir keičia paskyros rolę pagal ID.'
]: p(text)
h('2. Sistemos architektūra')
h('2.1. Technologijos ir atsakomybės', 2)
p('React ir TypeScript sudaro komponentinę kliento pusę, Vite naudojamas kūrimui ir produkciniam surinkimui. React Router valdo maršrutus, Zustand – paskyros ir vietinės pažangos būseną, Axios – HTTP užklausas ir automatinį žetono atnaujinimą. Tailwind CSS, shadcn/ui komponentai bei individualus CSS sudaro sąsają; Radix UI suteikia dialogų ir kitų valdiklių elgseną, Lucide – vektorines ikonėles.')
p('Go serveris naudoja Gin HTTP karkasą ir GORM. main.go konfigūruoja serverį, controllers/routes.go registruoja API metodus, controllers vykdo validaciją, teisių patikrą ir duomenų operacijas. MariaDB pasirinkta dėl reliacinių ryšių, užsienio raktų ir transakcijų; MySQL ar PostgreSQL būtų galimos alternatyvos pakeitus tvarkyklę ir patikrinus migracijas.')
h('2.2. Pagrindiniai objektai', 2)
p('Mokymosi modulis (1) → Testas (0..*) → Klausimas (0..*). Modulis turi pavadinimą, aprašymą, rodymo eilę ir savininką. Testas turi pavadinimą bei module_id; klausimas – tekstą, paaiškinimą ir quiz_id. Atsakymų variantai saugomi atskirai. Naudotojas nėra vienas iš trijų vertinamų taikomosios srities objektų.')
h('2.3. Autentifikacija ir autorizacija', 2)
p('Registruotos paskyros rolės yra learner, editor ir admin. Rašymo operacijoms tikrinama rolė ir modulio owner_id: redaktorius negali keisti kito redaktoriaus modulio ar jo vaikinių objektų. Administratorius turi platesnes teises. GUI apribojimai nepakeičia serverio autorizacijos.')
p('JWT access žetonas pasirašomas HS256 algoritmu, naudojant JWT_SECRET aplinkos kintamąjį. Jame yra sub (naudotojo ID), role, version, iss, iat ir exp; galiojimas – 15 minučių. Žetonas perduodamas Authorization: Bearer antrašte. Refresh žetonas galioja 7 dienas, jo SHA-256 maiša saugoma MariaDB, o pats žetonas – HttpOnly ir SameSite=Lax slapuke. Viešame HTTPS diegime nustatomas Secure. Atnaujinant žetonas rotuojamas; pakartotinis panaudojimas ir logout panaikina sesijų galiojimą.')
h('2.4. Numatomas diegimas', 2)
p('Numatomas Oracle Cloud Compute VM diegimas su Docker Compose. Caddy teikia React statinius failus per HTTPS ir persiunčia /api užklausas į Go API. MariaDB ir API nepublikuoja prievadų į internetą. Tai numatoma architektūra: viešas URL ir faktinis debesijos diegimas šio atnaujinimo metu dar nepatvirtinti.')
picture('docs/screenshots/deployment-diagram.png', '2.1 pav. Numatoma Oracle VM diegimo diagrama')
h('3. REST API realizacija ir testavimas')
h('3.1. Metodai ir apimtis', 2)
p('Kiekvienam pagrindiniam objektui yra GET sąrašas, GET vienas įrašas, POST, PUT ir DELETE – iš viso 15 metodų. Resursų keliai yra /api/v1/modules, /api/v1/quizzes ir /api/v1/questions; vieno įrašo kelyje papildomai nurodomas ID. Visame serveryje registruota 30 API metodų.')
p('GET /api/v1/modules/{moduleId}/quizzes/{quizId}/questions apima visą grandinę. Serveris tikrina, ar testas priklauso nurodytam moduliui; netinkamam ryšiui grąžina 404. Sąrašai priima page (1–1000000), limit (1–100), pavadinimo ar teksto ir tėvinio objekto filtrus. JSON atsakymuose yra data, pagination ir _links. GET /api/v1/overview apjungia trijų esybių skaičius.')
p('Pradiniame mokymosi užpildyme numatyti 6 moduliai, 10 testų ir 22 klausimai. Atskira papildoma mokymosi biblioteka turi 12 temų ir 36 paaiškintus klausimus; jos nereikia painioti su API valdomų įrašų kiekiu.')
h('3.2. Validacija ir HTTP kodai', 2)
p('Sėkmingas skaitymas ir keitimas grąžina 200, sukūrimas – 201 su Location, pašalinimas – 204 be turinio. Neteisinga įvestis grąžina 400, neprisijungusi paskyra – 401, nepakankamos teisės arba svetimas savininkas – 403, nerastas ar netinkamai susietas objektas – 404, pasikartojanti registracija – 409.')
p('Po tarpų pašalinimo tikrinami tekstų ilgiai, skaitinės ribos ir atsakymų unikalumas. Klausimui reikia 2–8 skirtingų atsakymų ir vieno teisingo. Ribojamas bcrypt slaptažodžio UTF-8 ilgis. GORM užklausoms reikšmės perduodamos parametrais. Tikra serverio ar duomenų bazės klaida lieka 500; tokios klaidos neslepiamos klaidingu 400 ar sėkmingu atsakymu.')
h('3.3. Atliktos patikros', 2)
p('2026-11-09 paleistas integracinis testas prieš MariaDB: naudotos atskiros crit_<nonce>_ lentelės, kurios po testo pašalintos. Patikrinti visi 30 produkcinių maršrutų, trijų objektų CRUD, filtravimas, puslapiavimas, hierarchija, vaidmenys ir svetimo turinio apsauga. Patikrinti refresh rotacijos, seno žetono pakartotinio panaudojimo ir logout atvejai.')
p('Per Newman sėkmingai įvykdytos visos 63 Postman rinkinio užklausos. Go testai papildomai tikrina JWT, įvesties validaciją, OpenAPI atitikimą maršrutams ir diegimo konfigūracijos struktūrą. Kliento dalyje yra 19 pokerio skaičiavimų ir variklio testų. Naršyklėje tikrinta 60 bendrų puslapių ir ekrano dydžių derinių bei 20 stalo derinių su 1–5 priešininkais. GUI testų API atsakymai fiksuoti; tikras serveris atskirai tikrintas integraciniais testais.')
p('Specifikacija su JSON schemomis, pavyzdžiais ir atsakymų kodais pateikta docs/openapi.yaml, Postman rinkinys – docs/PokerLearn.postman_collection.json, bandymo ir gynimo instrukcijos – docs/API_TESTING.md. YAML testas tikrina ne tik sintaksę, bet ir kiekvieno produkcinio maršruto dokumentavimą.')
h('4. Naudotojo sąsajos projektas')
h('4.1. Sąsajos eskizai', 2)
p('Trijų ekranų žemo detalumo eskizai parengti HTML ir CSS priemonėmis. Jie parodo viešo puslapio, mokymosi skydelio ir turinio redaktoriaus pagrindinę struktūrą. Šaltinis – docs/wireframes.html.')
for file, caption in [
 ('wireframe-landing.png', '4.1 pav. Viešo puslapio eskizas'),
 ('wireframe-dashboard.png', '4.2 pav. Mokymosi skydelio eskizas'),
 ('wireframe-editor.png', '4.3 pav. Turinio redaktoriaus eskizas')
]: picture('docs/screenshots/' + file, caption, 3.4)
h('4.2. Įgyvendinti ekranai', 2)
p('Formose naudojami teksto ir skaitiniai laukai, textarea, sąrašai, radio ir switch pasirinkimai, statymo slankiklis. Dialogai palaiko klaviatūros fokusą ir uždarymą Escape. Veiksmų rezultatai pateikiami sąsajoje, be naršyklės alert. Naudojami vietiniai Inter ir Newsreader šriftai, Lucide SVG, header/footer ir CSS animacijos. Ekranvaizdžiai rodo kontroliuojamas testines sąsajos būsenas, o ne tikrų paskyrų duomenis.')
for file, caption in [
 ('landing.png', '4.4 pav. Viešasis PokerLearn puslapis'),
 ('dashboard.png', '4.5 pav. Mokymosi skydelis'),
 ('content-editor.png', '4.6 pav. Turinio valdymas ir paskyrų rolės'),
 ('poker-table.png', '4.7 pav. Individualiai sukurtas pokerio stalas'),
 ('poker-table-mobile.png', '4.8 pav. Kompaktiškas stalo išdėstymas')
]: picture('docs/screenshots/' + file, caption)
h('5. Diegimas ir ribojimai')
p('Parengti abu Dockerfile, compose.yaml, Caddy konfigūracija ir aplinkos kintamųjų pavyzdys. Galutiniam publikavimui dar reikalinga VM prieiga, domenas, DNS, HTTPS ir tikros slaptos reikšmės. Po diegimo būtina patikrinti registraciją, prisijungimą, CRUD ir refresh slapuko Secure požymį. Viešo frontend ir backend talpinimo kriterijus dar nelaikomas įvykdytu.')
p('Asmeninės pastabos, mokymosi pažanga ir išsaugoti stalo nustatymai laikomi naršyklėje, atskirai pagal paskyros ID. Jie nesinchronizuojami tarp įrenginių. MariaDB saugo paskyras, autentifikacijos sesijas ir API valdomą mokymosi turinį. Tikimybės skaičiuojamos atrankiniu modeliavimu; AI nėra GTO ar ICM sprendiklis. Statymo EV remiasi supaprastintu vieno atsakančio žaidėjo modeliu ir neįtraukia būsimų statymų ar rake.')
p('Naujas produkcinės aplinkos Lighthouse našumo balas šioje ataskaitoje nepateikiamas. Kodo testai, mobilios geometrijos patikros ir produkcinis surinkimas neįrodo konkretaus Lighthouse balo. Galutinę ataskaitą dar reikia pateikti GitHub arba Moodle; tituliniame puslapyje palikti studento ir dėstytojo duomenų laukai.')
h('6. Išvados')
for text in [
 '1. Realizuota modulis–testas–klausimas grandinė ir 15 CRUD/LIST metodų. Tėvinio ryšio patikra leidžia taikyti URL apimties valdymą, o puslapiavimas bei filtravimas riboja vienu metu perduodamų duomenų kiekį.',
 '2. Sujungta rolės ir savininko ID autorizacija. Taip vienodos redaktoriaus teisės nesuteikia galimybės pakeisti kito redaktoriaus turinio; ši apsauga patikrinta integraciniais testais.',
 '3. Trumpalaikiai JWT ir refresh rotacija sumažina ilgai galiojančio prieigos žetono poreikį. Žetono versija ir sesijų atšaukimas leidžia atmesti jau išduotą prieigą po logout arba aptikto pakartotinio panaudojimo.',
 '4. Normalizuota įvestis ir ribojami laukai padeda atskirti naudotojo klaidas nuo serverio gedimų. Visų 30 maršrutų ir 63 Postman užklausų patikra suteikia pakartojamą pagrindinių reikalavimų įrodymą, bet nepakeičia produkcinio stebėjimo.',
 '5. shadcn/ui valdikliai, vietiniai šriftai ir konteinerio pločiui pritaikytas pokerio stalas pagerina sąsajos nuoseklumą. Skaičiavimai atskirti į Web Worker, todėl jų vykdymas neblokuoja pagrindinės sąsajos gijos.',
 '6. Viešo diegimo ir ataskaitos pateikimo darbai lieka atskiri nuo lokaliai veikiančios programos. Jų negalima laikyti užbaigtais vien dėl parengtų Docker failų ar vietinių testų.'
]: p(text)
document.save(ROOT / 'docs/PokerLearn_ataskaita.docx')
print('Updated report written; title-page placeholders preserved.')
