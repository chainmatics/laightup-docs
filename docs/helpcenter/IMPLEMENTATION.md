# laightup Helpcenter

Stand: 1. November 2026. Implementiert im vorhandenen Docmost-Client unter `/help`.

## Referenz und Übertragung

Das [Channable Helpcenter](https://helpcenter.channable.com/) wurde als veröffentlichte Website untersucht: Startseite, Themenwechsel, Inhaltsstruktur einer Sektion, Suchzugang, Sprachwahl, Theme-Steuerung, Artikelaktionen, Feedback und Footer. Seine Aufgabenorientierung wird übernommen, seine Texte, Bilder und Markenassets werden nicht kopiert.

Die Referenz setzt eine horizontale Themenleiste über eine kontextabhängige Kapitelnavigation. Eine Startseite erschließt Themen über Karten. Im Artikel helfen Brotkrümel und Anker; ergänzende Angebote führen zu anderen Lernwegen. laightup erhält dieselbe Orientierung mit eigenen Themen, einer eigenen CI und eigenständigen Inhalten. Die Anzahl der Karten folgt dem vorhandenen Produktumfang.

| Channable-Aufgabe | laightup-Aufgabe | Umsetzung |
| --- | --- | --- |
| Einstieg | Erste Schritte | Schnellstart und Begriffe |
| Material importieren und verbessern | Inhalte & Designs | Bibliothek und Formatvarianten |
| AI-gestützte Optimierung | Gestalten mit AI | Easy Flow, Referenzen, Retusche |
| Kanäle bedienen | Playlists, Sendepläne, Displays | Drei getrennte Themen nach Arbeitsaufgabe |
| Verwaltung | Versionen & Freigaben | Entwurf, Prüfung und Live-Version |
| Lernangebote | Vertiefung und Fehlerdiagnose | Grundlagen, Vorschau und Fehlersuche |

Academy, Demo-Center, Statusseite und Changelog werden nicht als vorhandene laightup-Angebote erfunden. Eine Sprachangabe DE zeigt den tatsächlichen Inhaltsumfang; weitere Sprachen benötigen gepflegte Übersetzungen.

## GitBook-Funktionsinventar und Entscheidung

Das Inventar deckt die Funktionsfamilien des [offiziellen Dokumentationsindex](https://gitbook.com/docs/llms.txt) ab, einschließlich Redaktion und Betrieb. Es ist keine Behauptung, GitBooks gesamten SaaS-Funktionsumfang nachgebaut zu haben. Tarifabhängige Verfügbarkeit ist vor einer Beschaffung separat zu prüfen.

| GitBook-Funktionsfamilie | Entscheidung im laightup-Helpcenter |
| --- | --- |
| Sites, Sektionen, Gruppen, Seiten | Startseite, zwölf Themenübersichten und 39 Inhalte |
| Themenleiste, Seitenbaum, Brotkrümel, Inhaltsverzeichnis | Implementiert, mobile Navigation als Drawer |
| Karten, Links, Überschriften, Listen, Tabellen, Hinweise | Implementiert mit Markdown und Themenkarten |
| Dateien, Bilder, Videos, Embeds | Markdown-Bilder und Links unterstützt; keine unbelegten Produkt-Screenshots |
| Tabs, Stepper, Expandables, Spalten | Nummerierte Anleitungen; klappbarer Navigationsbaum; lokaler Blockeditor, siehe `EDITOR.md` |
| Code, Mermaid, Formeln, Zeichnungen, Prompts | Vorhandene Docmost-Editorfunktionen werden nicht dupliziert; im neuen Helpcenter noch keine Spezialrenderer |
| Variablen, wiederverwendbare und bedingte Inhalte | Gemeinsamer Katalog; keine neue Vorlagen- oder Segment-Engine |
| OpenAPI, Playground, Codebeispiele | Noch keine öffentliche laightup-API-Referenz behauptet |
| Logo, Farben, Schriften, Themes, Layout, Footer | CI-Assets und Geist aus laightup; Hell-/Dunkelmodus; Druckstylesheet |
| Suche und Quick Find | Lokale Volltextsuche, Gewichtung, deutsche Normalisierung, Synonyme, Cmd/Ctrl+K |
| AI Assistant, externe Wissensquellen, Embed | Keine simulierten AI-Antworten; benötigt echten Dienst und Quellenanbindung |
| Agent, Übersetzung, Channels | Kein autonomer Schreibdienst eingerichtet |
| llms.txt, vollständiger Markdown-Text | Unter `/helpcenter/llms.txt`, `/helpcenter/llms-full.txt` und `/helpcenter/markdown/` |
| MCP für Leser; API, CLI und SDK für Autoren | Kein MCP-/GitBook-Dienst eingerichtet; Markdown ist portabel verfügbar |
| GitHub-/GitLab-Sync, Monorepos, PR-Previews | Inhalte im bestehenden Repository; kein externer GitBook-Sync aktiviert |
| Versionshistorie, Change Requests, Reviews, Merge-Regeln | Lokale Entwürfe, Vergleich und Versionshistorie; Repository bleibt Veröffentlichungsworkflow |
| Live-Editor, Kommentare, Teamrollen, Benachrichtigungen | Lokaler Editor unter `/help/bearbeiten`; öffentliche Ansicht liest versionierte Dateien; kein Team-Echtzeitbetrieb |
| Öffentlich/privat, Share-Links, Besucher-Auth | `/help` enthält nur öffentliche Produktanleitungen; kein Besucher-Login |
| Adaptive Inhalte, Nutzersegmente, SSO/SAML | Nicht eingerichtet; produktinterne Berechtigungen sind kein Schutz des öffentlichen Helpcenters |
| Varianten, Sprachen, Produktversionen | Deutsch, ein Inhaltsstand; Sprach-Dropdown mit klar gekennzeichneten zukünftigen Fassungen |
| Custom Domain, Unterverzeichnis, Redirects, CDN | Route im vorhandenen Client; Hosting und Domain bleiben eine Deployment-Aufgabe |
| SEO, Social-Metadaten | Titel, Beschreibung, Sprache; kein serverseitiges Prerendering neuer Routen |
| PDF, Markdown, Copy | Browserdruck/PDF, Download und Clipboard; kein serverseitiger PDF-Export |
| Analytics, Suchanfragen, Seitenbewertungen | Feedback nur lokal vorgemerkt; keine zentrale Erfassung oder Analytics behauptet |
| AI-Insights, Agent-Traffic, Inhaltslücken, Broken Links | Linkprüfung beim Build; keine Remote-Analytik |
| Integrationen, Webhooks, Custom Blocks, ContentKit | Nicht eingerichtet; keine Platzhalter-Integrationen |
| Pläne, Credits, Abrechnung, Enterprise-Verwaltung | Beschaffungs- und Plattformfunktionen, kein Teil der Kundenanleitungen |

Vertiefte Primärquellen: [Site-Struktur](https://gitbook.com/docs/manage-your-site/site-structure.md), [Anpassung](https://gitbook.com/docs/manage-your-site/customization.md), [Redaktion](https://gitbook.com/docs/collaborate/change-requests.md), [Leser-AI](https://gitbook.com/docs/ai-for-your-readers/gitbook-ai-assistant.md), [Zugriff](https://gitbook.com/docs/publish/site-audience/authenticated-access.md), [Analytics](https://gitbook.com/docs/analytics/insights.md), [GitBook-Tarife](https://www.gitbook.com/pricing).

## Reverse Engineering und Quellenqualität

Ein Werkzeug oder Skill namens REA / Reverse Engineer Anything wurde weder im aktiven Werkzeugkatalog noch in den lokalen Skill-Verzeichnissen gefunden. Verwendet wurde direkte Untersuchung der gerenderten Referenz, ihrer zugänglichen Struktur und des laightup-Quellcodes. Dies ist kein ausgeführter REA-Skill.

Die Artikelquellen stehen einzeln in `catalog.json`. Hauptquellen im Schwester-Repository `laightup`:

- `docs/project-guide.md`: Produktbausteine, Player, Freigabeprozess.
- `docs/helpful-docs/playouts-overview.md`: Tageskalender, Pin, Programmrollen, Konflikte und Übergaben.
- `docs/architecture/broadcast-plans-playout-model.md`: Planungsmodi, Versionen und fachliche Grenzen.
- `docs/ai/easy-flow-ai-overview.md`: Briefing, Varianten, Referenzen, Format- und Bearbeitungsablauf.
- `apps/frontend/src/components/devices/useDevicesController.ts`: Kopplungscode, Name, Standort, Rotation und Gruppen.
- `apps/frontend/src/components/devices/DeviceFormDialog.tsx`: sichtbarer Registrierungsablauf.

Die Anleitungen sind aus Dokumentation und Code abgeleitet. Sie wurden nicht gegen eine angemeldete laightup-Produktivinstanz fachlich abgenommen. Feature-Flags und Planungsmodi werden deshalb ausdrücklich beschrieben. Nicht implementierte Content Boxes und geplante Datenintegrationen fehlen bewusst. Hardware-Installation, Vertragsleistungen, Rollenrechte und API-Endpunkte werden ohne belastbaren Nachweis nicht erfunden.

## Pflege und Start

```sh
pnpm exec nx run client:dev --host 127.0.0.1 --port 4173
# http://127.0.0.1:4173/help
pnpm exec nx run client:build
pnpm exec nx run client:test -- src/features/helpcenter/content.test.ts
```

Inhalte in `docs/helpcenter/content/*.md` bearbeiten. Titel, Beschreibung, Bereich und Quelle in `catalog.json` pflegen. Der Client importiert diese Dateien direkt. `scripts/build-helpcenter.mjs` erzeugt Downloads, LLM-Indizes und `SUMMARY.md`; er prüft doppelte Slugs, Zuordnungen und interne Artikellinks. Dev-Start und Build führen den Export automatisch aus. Nach Inhaltsänderungen im laufenden Dev-Server den Export erneut ausführen, damit Downloads denselben Stand erhalten.

Feedback ist eine lokale Lesermarkierung, keine an das Team übermittelte Bewertung. Private Betriebsdaten gehören nicht in diese öffentlich auslieferbaren Markdown-Dateien.

## Weitere Schritte nach dem ersten Inhaltsstand

Fachliche Abnahme mit einem Produktverantwortlichen; echte Screenshots aus einem freigegebenen Demo-Tenant; player-spezifische Installationsanleitungen; überprüfte Rollenmatrix; Produktänderungen in einem gepflegten Changelog. Ein AI-Assistent und zentrale Feedbackauswertung brauchen echte Backend-Funktionen. Diese Erweiterungen sind hier als Grenzen benannt, keine bereits ausgelieferten Features.

## Prüfung des gelieferten Stands

- Produktionsbuild über Nx erfolgreich; TypeScript-Prüfung darin enthalten.
- Sieben gezielte Vitest-Tests erfolgreich: Suche/Terminologie, Inhaltsanker, Sanitizing und vollständiger Katalog.
- Alle 39 Inhalte und acht Themenübersichten im echten Browser geöffnet; Hauptüberschrift und Layout geprüft. Artikel ohne fehlende Inhaltsanker. Ergebnisse unter `qa/v2/article-routes.json` und `qa/v2/category-routes.json`.
- Startseite, Artikel, Dunkelmodus und mobile Navigation visuell geprüft. Mobile Tabellen anschließend in beschriftete Zeilenkarten umgebaut, damit Inhalte ohne horizontales Abschneiden lesbar bleiben.
- Volltexttreffer, leere Ergebnisse, Fehlerseite, Markdown-Clipboard und tatsächlicher Dateidownload geprüft. Lokales Feedback bleibt nach Neuladen ausgewählt.
- Druckaktion ist verdrahtet und das Druckstylesheet implementiert. Die native Druckvorschau ließ sich über die Browserautomation nicht zuverlässig verifizieren; kein tatsächlicher Druck ausgelöst.
- Repository-Lint konnte nicht starten: Der installierten Abhängigkeit `@tanstack/eslint-plugin-query` fehlt `build/modern/index.js`. Das ist kein erfolgreicher Lint-Lauf. Keine Dependencies für diese Inhaltsarbeit ersetzt.
- `source-snapshot.json` hält Commit und Dateihashes der verwendeten laightup-Quellen fest. Die Produktanleitungen bleiben ein erster abgeleiteter Inhaltsstand, keine fachliche Produktionsabnahme.


## Ausbau: Aufgaben, Grafiken und semantische Inhalte

Der aktuelle Stand enthält 39 Inhalte in zwölf Themenbereichen, darunter vier Lernpfade. Die Startseite führt über Aufgaben und Zielgruppen zu passenden Schrittfolgen. Der Themenindex bleibt als zweiter Zugang erhalten.

- **Lernpfade:** Standort starten, Aktion ausspielen, Inhalte je Standort personalisieren, Arbeitsbereich organisieren. Jeder Pfad referenziert vier vorhandene Anleitungen.
- **Ergänzte Themen:** Player-Vorbereitung, Standortanlage, Betriebszeiten und Neustartzeit, Geräteverwaltung, eigene und systemeigene Platzhalter, Bedingungsreihenfolge und Standardwerte, allgemeine und persönliche Einstellungen, Mitgliederverwaltung. „Parameter“ meint entsprechend der Rückmeldung dynamische Inhalte und Platzhalter; Wiedergabeparameter stehen separat im Bereich Sendepläne.
- **Grafiken:** eigenständige SVG-Netzwerkgrafik auf der Startseite, beschriftete Ablaufgrafiken in Artikeln, Sendeplan-Prinzipgrafik und interaktives Platzhalter-Beispiel. Fiktive Preiswerte sind ausdrücklich als Beispiel gekennzeichnet; die Demo verändert keine Produktdaten.
- **Motion:** dezente Einblendungen, Hover-Effekte und animierte Verbindungslinien. Eine persistente Pausefunktion stoppt Bewegungen; reduzierte Bewegung aus dem Betriebssystem wird berücksichtigt. Suchdialog und mobile Navigation respektieren diese Einstellung ebenfalls.
- **Semantik:** Jeder Inhalt besitzt Typ, Zielgruppe, Lernziel, Tags, Quelle und gegebenenfalls referenzierte Lernschritte. Typen unterscheiden Anleitung, Grundlagen, Nachschlagen, Problemlösung und Lernpfad. HTML-Artikel, Überschriften, Navigation, beschriftete Figuren und JSON-LD ergänzen die inhaltliche Struktur.
- **Suche:** Einstieg über Aufgaben oder Themen, nach Inhaltstyp filterbare Treffer, Titel und verständliche Zusammenfassungen, Suchbegriff-Markierung, Synonyme und gewichtetes Ranking. Pfeiltasten und Enter steuern die Trefferauswahl; Escape schließt. Hell-/Dunkelmodus und Smartphone-Ansicht sind berücksichtigt. Die Suche arbeitet lokal mit dem Inhaltsindex, nicht mit einem angebundenen Sprachmodell.

Der Installationstext beschreibt die belegten Player-Plattformen, Voraussetzungen und den Übergang zur Registrierung. Konkrete Hardware-Menüfolgen, Paketadressen und Gerätesupport sind im untersuchten Verwaltungs-Repository nicht vollständig dokumentiert und werden nicht erfunden.

Zusätzliche maßgebliche Quellen sind `LocationFormDialog.tsx`, `DeviceEditDialog.tsx`, `settingsNav.ts`, `TenantTab.tsx`, `PreferencesTab.tsx`, `UserFormDialog.tsx`, `useUsersController.ts`, `systemPlaceholders.ts`, `PlaceholderTester.tsx` sowie der Backend-Resolver `resolve-placeholders.ts`. Die Platzhalter-Anleitungen halten insbesondere die erste passende Bedingungszeile, das Auffüllen leerer Werte aus der Standardzeile und die unmittelbare Ausspielung nach Bestätigung fest.

## Gestaltung nach zusätzlicher Referenz

Die [Swarmia-Anleitung zur PR Inbox](https://help.swarmia.com/features/managing-pull-requests-in-progress-with-the-pull-request-view) und deren Einstieg wurden zusätzlich im Browser untersucht. Übernommen wird das Prinzip, Abbildungen direkt an der zugehörigen Erklärung zu platzieren; Swarmia-Texte und Produktbilder werden nicht übernommen.

Die vier Einstiegskarten haben eigene SVG-Illustrationen: Standortkarte mit Registrierung, Motiv mit Zeitfenster, lokale Platzhalterwerte und Teamstruktur. Der Themenindex ist eine Kartengalerie mit funktionsbezogenen Motiven. Die Motive sind eigenständige Illustrationen, keine behaupteten Screenshots der Produktoberfläche. Kurze Bildunterschriften erklären den fachlichen Zusammenhang. Wiederholte generische Bildunterschriften und einige austauschbare Überschriften wurden gekürzt beziehungsweise ersetzt.

Artikelfiguren stehen nun nach der ersten erklärenden Sektion. Für Platzhalterregeln, Systemwerte und die Gruppeneinrichtung werden unterschiedliche Grafiken verwendet. Die Reihenfolge und sämtliche Überschriften des Markdown-Quelltexts bleiben erhalten; die Prüfung unter `qa/v3/article-routes.json` vergleicht dafür alle 39 Artikel mit ihren Quellen.

## Was ist neu?

`/help/was-ist-neu` ist eine eigene chronologische Übersicht im gemeinsamen Helpcenter-Rahmen, mit aktiver oberer Navigation und Zugang über die mobile Kapitelnavigation. Einträge werden in `updates.json` gepflegt: ISO-Datum, Kategorie, Titel, Kurzbeschreibung sowie Änderungen mit Verweisen auf Artikel-Slugs. Neueste Einträge stehen zuerst. Der Inhaltsgenerator prüft eindeutige IDs, gültige und absteigende Daten, Pflichtfelder und sämtliche Anleitungslinks bei jedem Start und Build.

Der erste Eintrag vom 1. November 2026 dokumentiert ausdrücklich die Änderungen am Helpcenter. Aus Git-Commit-Daten werden keine Produkt-Veröffentlichungstermine abgeleitet. Künftige Produktmeldungen benötigen bestätigte Veröffentlichungstermine und Beschreibungen. Die Seite verwendet eine datierte Timeline, eine violette Titelgrafik und bestehende Farbvariablen für Hell-/Dunkelmodus; mobil steht das Datum über der Karte.

### Produkt-Releases aus Linear

Am 1. November 2026 wurden sämtliche 20 Projektupdates des angegebenen Linear-Projekts gelesen (keine Folgeseite). Daraus entstanden 13 Produkt-Einträge für den 20. August bis 29. Oktober 2026: zwölf Production-Releases einschließlich der kombinierten Staging-/Production-Veröffentlichungen sowie ein Production-Hotfix. Fünf reine Staging-Updates wurden nur deshalb als ergänzende Inhaltsquelle verwendet, weil das jeweilige Production-Update ihre unveränderte Übernahme ausdrücklich bestätigt. Ein weiteres reines Staging-Update hat einen inhaltlich vollständigen Production-Nachfolger und wird nicht separat veröffentlicht.

`release-sources.json` dokumentiert pro Eintrag die Production-Quelle und gegebenenfalls die referenzierte Staging-Quelle mit Linear-URL, Update-ID, Titel, Erstellungszeit und SHA-256 des gelesenen Textes. Dieses Manifest wird nicht in die öffentliche Oberfläche importiert. Dort erscheinen redaktionell zusammengefasste Nutzeränderungen und bestehende Anleitungslinks. Interne Ticketlisten, Infrastrukturdetails, Commit-Zahlen und Sicherheitsimplementierungen werden nicht ausgespielt. Die separat vorgesehene Freischaltung der Kommentare bleibt im Eintrag vom 22. Oktober ausdrücklich erwähnt. Datumsangaben stammen aus den Production-Überschriften, nicht aus Staging-Terminen oder Git-Commits. Historische Änderungen beschreiben den damaligen Release-Stand.

Die Standardansicht zeigt Produktupdates. Filter erlauben Helpcenter-Updates oder alle Meldungen; jeweils vier Einträge erscheinen zunächst, ältere werden über eine Schaltfläche nachgeladen. Die Übernahme ist ein redaktioneller Stand und keine automatische Synchronisierung mit Linear.

## Erster Lauf von laightup-docs-maintainer: vollständige Originale

Am 1. November 2026 wurde der neue Skill angewendet. Linear wurde erneut vollständig gelesen: 20 Projektupdates, keine weitere Seite, dieselben 13 Production-Publikationen wie beim vorherigen Abruf. Die fünf ausdrücklich unverändert übernommenen Staging-Texte wurden den zugehörigen Production-Meldungen zugeordnet. Der Produktcode wurde aus frisch abgeglichenem `origin/main` gelesen: `5e2bca0f34a4f4349555133e334c34ff330ad237`.

Die gelesenen Originalquellen liegen vollständig und hashgeprüft im internen Archiv unter `release-archive/`. Die spätere Nutzeranweisung schließt jegliche Ticketdetails aus der öffentlichen Dokumentation aus. `scripts/build-release-originals.mjs` erzeugt deshalb zwei getrennte Ausgaben: `releases.json` für die interne Quellenprüfung und `releases.public.json` für Oberfläche und Suche. Nur die öffentliche Ausgabe wird vom Client importiert. Technische Detailabschnitte, Ticketnummern und -beschreibungen, PR-/Commit-Angaben sowie interne Quellenverweise sind dort entfernt. Frühere öffentliche Rohdateien werden beim Build entfernt; sie dürfen nicht wieder ausgegeben werden. Fachliche Produktänderungen und Einschränkungen bleiben erhalten.

Elf Anleitungen wurden aktualisiert: Bibliothek/Importe, Varianten, Easy Flow, Referenzen/Brand Kits, Retusche, Kalender/Simulation, FAQ, Einstellungsübersicht, Teamverwaltung, Einladungen und allgemeine Arbeitsbereichseinstellungen. Im main-Abgleich wurden außerdem die aus einem anderen Entwicklungsstand stammende Berechtigungsansicht, Rollendefinition und AI-Kennzeichnung unter Allgemein korrigiert. Bestehende Slugs bleiben erhalten. PDF-Importgrenzen (100 pro Import, zehn Seiten je Design), Vektorkonvertierung mit Raster-Fallback und die feste Standard-Variante sind jetzt ausdrücklich erklärt. Vorhandene Fachgrafiken bleiben passend zugeordnet; zusätzliche dekorative Grafiken waren für diese Übernahme nicht erforderlich. Videos bleiben zurückgestellt.

Prüfnachweise und die punktweise Zuordnung der Releases stehen unter `qa/full-releases/`. Der Lauf ist eine einmalige Quellenübernahme und richtet keinen automatischen Abruf ein.

### Lesbare Release-Überschriften

Auf Wunsch werden im Hilfebereich die redaktionellen, inhaltlich beschreibenden Überschriften auch für die vollständigen Texte verwendet, etwa „Easy Flow: genauer im Brief, konsistenter im Design“. Das Veröffentlichungsdatum erscheint deutsch als „Update vom 29. Oktober 2026“. Übernommene Ergänzungen heißen „Weitere Details zu diesem Update“. Nur die dargestellte Hauptüberschrift wird ersetzt; die Originaltexte im Archiv, im UI-Datenmodell und im Markdown-Download bleiben bytegenau erhalten. Features, Korrekturen, Einschränkungen und technische Details werden weiterhin vollständig dargestellt.

### Fachliche Darstellung und Suche in „Was ist neu?“

Die spätere Nutzeranweisung präzisiert die öffentliche Darstellung: beschreibende deutsche Überschriften und Datumsangaben, keine Quellenlinks oder Original-Downloads in der Oberfläche. „Alle Produktänderungen“ zeigt die fachlichen Änderungsinhalte ohne Ticketdetails, technische Abschnitte, Quellenlinks oder Herkunftszeilen. Deren eigentliche Inhalte bleiben im selben Eintrag enthalten. Die archivierten Quellen und UI-Rohtexte bleiben intern unverändert nachvollziehbar. Diese Darstellungsregel ersetzt die vorher dokumentierte Anzeige von Quellen-/Downloadlinks.

Die neue lokale Suche durchsucht Titel, Zusammenfassungen, vollständige Änderungsinhalte einschließlich übernommener Ergänzungen sowie deutsche und ISO-Datumsangaben. Mehrere Suchwörter werden gemeinsam berücksichtigt, Groß-/Kleinschreibung und Umlaute normalisiert. Die Suche kombiniert sich mit den Kategorien und setzt die sichtbare Trefferzahl auf vier zurück; die übrigen Ergebnisse bleiben nachladbar. Zurücksetzen und ein Leerzustand sind vorhanden. Es werden keine Suchanfragen an externe Dienste gesendet.

### Hero für die Neuerungsübersicht

„Was ist neu?“ hat eine eigenständige große Bildfläche mit integrierter, weiterhin semantischer HTML-Typografie. Die eigens erzeugte Signage-Studioszene wird als WebP mit rund 120 KiB geladen. Auf kleinen Bildschirmen steht die Typografie über dem angepassten Bildausschnitt. Das Motiv illustriert visuelle Kommunikation und ist kein Produkt-Screenshot oder Kundenbeleg. Zwei Einstiege führen zur Neuerungssuche und in den Hilfebereich. Die Bildöffnung läuft einmalig über 1,1 Sekunden und respektiert Bewegungspause und reduzierte Bewegung. Prompt, Assetpfad und Sichtprüfung stehen unter qa/hero/.

## Sprachfähige Inhaltsstruktur

Die bearbeitbaren Inhalte liegen jetzt unter `locales/de/`; `structure.json` enthält sprachneutrale IDs und Beziehungen. Der Compiler erzeugt die bisherigen deutschen Ausgaben kompatibel, damit URLs und Gestaltung unverändert bleiben. Kapitelanker sind explizit und stabil; `doc:`-Verweise werden je Sprachpaket aufgelöst. Artikel-Metadaten, redaktionelle Neuerungen, vollständige Release-Inhalte, zentrale Begriffe und Suchsynonyme sind als Übersetzungseinheiten erfasst. Texte der Einstiegskarten sowie Hero, Suche und Details von „Was ist neu?“ werden aus Sprachdateien gelesen.

Der Workflow kann neue Sprachordner als leere Entwürfe anlegen, vollständige Inhaltspakete prüfen und fehlende oder aufgrund geänderter Ausgangseinheiten veraltete Übersetzungen erkennen. Vorschau-Fallback ist ausdrücklich markiert und wird nicht als fertige Übersetzung veröffentlicht. Produktvariablen, Nachrichtvariablen, Abschnitts-IDs und interne Verweise werden validiert. Die jetzige Anwendung bleibt deutsch: ein Sprachpaket allein aktiviert noch keine öffentliche Sprache, Routen, Sprachwahl und verbleibende feste UI-/Grafiktexte sind beim späteren Sprachrollout bewusst anzubinden. Die Übersetzungsstruktur erfindet keine fremdsprachigen Texte.

Anleitung und Quellenpfade: `TRANSLATIONS.md`. Alte Katalog-, Update- und Inhaltsdateien sind nun generierte Kompatibilitätsausgaben, keine zweite bearbeitbare Quelle.

### Ausschließlich Produkt-Neuerungen

Der Bereich „Was ist neu?“ enthält nur noch die 13 bestätigten Produktmeldungen. Der redaktionelle Helpcenter-Beitrag vom 1. November ist aus der bearbeitbaren Struktur und den Sprachtexten entfernt. Kategorieauswahl und Kategorie-Badges entfallen; Suche, Hero und Nachladen bleiben erhalten. Der Compiler lässt ausschließlich Produktmeldungen mit Quellen-ID zu; der Release-Generator prüft diese weiterhin gegen die bestätigten Production-Quellen. Die Pflege-Skill-Regeln wurden entsprechend aktualisiert, damit keine Helpcenter-News erneut importiert werden.

## Sprachwahl als Dropdown

Die Kopfzeile öffnet ein 240 Pixel breites Dropdown mit genau einem Suchfeld und einer Regionsliste. Es gibt nur die Gruppen Europa und Asien; Europa wird nicht weiter unterteilt. Bei Hover oder Fokus klappen seitlich alphabetisch sortierte Sprachen auf. Flagge, Sprachname und Eigenname bilden eine schlichte Zeile. Der kuratierte Katalog enthält 47 eindeutige Spracheinträge ohne Dialekt- oder Regionalvarianten. Norwegisch erscheint einmal. Auf schmalen Ansichten öffnet ein Tippen die Länderliste innerhalb des Dropdowns; „Regionen“ führt zurück. Keine Filter, Favoriten, Karten oder zusätzliche Kopf- und Fußbereiche. Nur Deutsch wird derzeit ausgeliefert; bei Auswahl einer fehlenden Fassung erscheint der entsprechende Hinweis.

Geprüft: Regionsauswahl, Tastaturzugang über Pfeil rechts, Suche, Desktop und mobile Darstellung. Screenshots unter `qa/language-picker/`.

## Redaktionelles Changelog-Layout

„Was ist neu?“ verwendet ein großzügiges zweispaltiges Layout: links Datum und Titel mit ruhiger Sticky-Position, rechts ein optionales Produktvisual und eine kurze Zusammenfassung. Rahmen um komplette Einträge und die frühere Timeline entfallen. Anleitungen mit ihren Querverweisen und vollständige Neuerungen sind separat aufklappbar. Die 13 Produktmeldungen, deren Quellenzuordnung, die vollständigen Release-Texte, Suche und Nachladen bleiben erhalten.

Vier eigene, als Funktionsillustrationen gekennzeichnete Visuals erklären Brief/Markenauftritt, Tags/PDF-Import, editierbare Ebenen und Design-Varianten. Sie sind keine Screenshots der Anwendung. `release-artwork.tsx` ordnet sie stabilen Release-IDs zu; neue Einträge ohne eigenes Visual bleiben vollständig lesbar. Die sichtbaren Beschriftungen und Alternativtexte liegen in `locales/de/messages.json` unter `updates.artwork` und müssen zusammen mit neuem Content übersetzt werden. Bewegungen in den neuen Visuals sind nicht erforderlich; die bestehende Hero-Bewegung respektiert weiterhin die Bewegungssteuerung.

Designreferenz: Framer Updates (Layout, Abstände und visuelle Hierarchie); keine Framer-Texte oder -Assets übernommen. Visuell geprüft: Desktop, dunkles Design und 390-Pixel-Ansicht, Suche nach Tags und Ebenen, Anleitungen und vollständige Release-Texte. Nachweise unter `qa/editorial-updates/`.

## Originalansichten und dezente Markenfarben

Der Easy-Flow-Eintrag zeigt die im laightup-Quellprojekt hinterlegte Produktansicht `apps/frontend/public/product/easyflow-varianten.webp`. Die unverändert übernommene Datei liegt hier unter `apps/client/public/helpcenter/images/product/`. Sie zeigt die Variantenauswahl mit den Aktionen „Verfeinern“ und „Format“. Sie wurde nicht neu in einer Demo-Umgebung aufgenommen; für eine exakte Darstellung weiterer Release-Funktionen werden passende aktuelle Originalaufnahmen benötigt. Andere Visuals bleiben ausdrücklich Funktionsillustrationen und verwenden zurückhaltende Violett-, Flieder- und Türkistöne. Produktansichten werden nicht künstlich eingefärbt.

Prüfung der öffentlichen Grenze: alle 13 generierten öffentlichen Meldungen und die Suche sind frei von Ticket- und internen Technikdetails. Die internen Originale behalten ihre Hashes und vollständigen Inhalte. Auch statische öffentliche Dateien und Produktions-JavaScript wurden auf bekannte interne Ticketinhalte geprüft.

## Lokaler Editor

Seit 2. November 2026 ist der lokale Redaktionsworkflow implementiert. Bedienung, Datenhaltung, Schutzmechanismen und konkrete Prüfgrenzen stehen in [EDITOR.md](EDITOR.md). Die frühere Bestandsaufnahme oben ist hinsichtlich der Redaktion durch diesen Stand ergänzt.
