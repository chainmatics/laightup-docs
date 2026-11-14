# laightup Dokumentationsplattform: Roadmap

Stand: 2. November 2026. Der vorhandene Produktinhalt bleibt die Grundlage. Das Vorhaben erweitert die Verwaltung schrittweise; die erste Stufe ist noch kein vollständiger GitBook-Ersatz.

## Schritt 1 — lokale Verwaltung (umgesetzt)

Unter `/help/verwalten` sind sieben Ansichten erreichbar: Allgemein, Inhaltsstruktur, URLs & Weiterleitungen, Gestaltung, Prüfung & Freigabe, Berechtigungen und Roadmap. Die Redaktion verlinkt zur Verwaltung. Website-Einstellungen werden in `docs/helpcenter/site.json` gespeichert und von der öffentlichen Ansicht verwendet. Die Themenstruktur bleibt in `structure.json`, deutsche Themennamen in `locales/de/metadata.json`.

Wirksam implementiert:

- Website-Titel im Browser, Standardbeschreibung und Footer-Text.
- Druckfunktion, Markdown-Download und lokale Artikelbewertung einzeln ein-/ausblenden.
- Themen umbenennen und mit zugänglichen Pfeilaktionen sortieren. Kennungen und URLs bleiben stabil; der Generator aktualisiert die Navigation. Seiten öffnen sich aus der Struktur in der Redaktion.
- Akzentfarbe, Kopfzeilenfarbe, Geist oder Systemschrift, fokussierte oder breite Artikelansicht. Eine kompakte Vorschau zeigt die Auswahl vor dem Speichern; die öffentliche Darstellung übernimmt die gespeicherten Werte. Originalscreenshots und Illustrationen werden nicht umgefärbt.
- Eine gemeinsame Speichern-Aktion für Änderungen über die Ansichten hinweg. Verwerfen stellt den zuletzt gespeicherten Stand wieder her. Ungespeicherte Änderungen werden beim Verlassen abgefangen.
- Schreibzugriffe über den bestehenden lokalen Dienst: Ursprung, Loopback und Sitzungstoken; Serialisierung mit Inhaltsänderungen, Revisionskonflikte, Feldprüfung und Kontrastprüfung. Vor Übernahme wird ein privater Sicherungsstand in `.helpcenter-editor/site-history` gespeichert. Bei Generatorfehlern werden Konfiguration, Struktur und Metadaten zurückgesetzt und der vorherige Export wiederhergestellt. Es gibt noch keine Wiederherstellungsoberfläche für diese Sicherungen.

Die Verwaltung und ihr Schreibdienst sind ausschließlich im Entwicklungsserver verfügbar. Ihre UI-Chunks werden im Produktionsbuild nicht ausgeliefert. Der öffentliche Hilfebereich enthält weiterhin nur Produktdokumentation und Produktnews. Die Berechtigungsansicht zeigt die aktuelle Betriebsart. Im aktuellen lokalen Betrieb werden keine aktiven Team-Anmeldungen behauptet.

## Schritt 2 — Themen, Seiten und Unterseiten (umgesetzt)

Unter `/help/verwalten?bereich=struktur` lassen sich Themen mit Beschreibung sowie Seiten und Unterseiten anlegen. Bis zu drei Seitenebenen sind möglich. Pfeilaktionen sortieren Themen und Geschwisterseiten; „Verschieben“ wählt Zielthema, übergeordnete Seite und Position. Ein Seitenzweig wird immer mit allen Unterseiten verschoben. Zyklische Beziehungen, fremde Themenzuordnungen und zu tiefe Strukturen werden auch serverseitig abgewiesen.

Alle Strukturänderungen bleiben zunächst vorgemerkt. „Änderungen speichern“ übernimmt sie gemeinsam; „Verwerfen“ stellt den gespeicherten Stand wieder her. „Speichern und bearbeiten“ übernimmt die Struktur und öffnet die gewählte Seite in der Redaktion. Vorhandene Seiten werden dort umbenannt. Seitenkennungen und bestehende URLs ändern sich durch Verschieben nicht.

Neue Seiten sind kanonische, unveröffentlichte Entwürfe. Die Redaktion zeigt sie mit ihrer Hierarchie; der öffentliche Katalog, Suche, Markdown-Export und Übersetzungseinheiten enthalten sie erst nach „Übernehmen“ im Editor. Eine leere Vorlage kann nicht veröffentlicht werden. Übergeordnete Entwürfe müssen zuerst übernommen werden. Themen ohne veröffentlichte Seiten bleiben öffentlich ausgeblendet. Die öffentliche Navigation, Brotkrumen und Unterseitenlinks übernehmen die gespeicherte Hierarchie.

`structure.json` unterstützt Schema 2 mit optionalem `parentId` und `status: "draft"`; Schema 1 bleibt lesbar. Ein gemeinsamer Validator ordnet den Baum für Schreibdienst, Generator und UI. Neue Quelldateien werden bei fehlgeschlagener Generierung zurückgenommen; bestehende Metadaten, Übersetzungen, private Redaktionsentwürfe und Artikeltexte bleiben erhalten.

Noch offen: Sprach-/Versionsvarianten in der Verwaltung, externe Navigationslinks sowie wiederherstellbare Archivierung. Die Verwaltungsoberfläche bleibt lokal und deutschsprachig; dies ist kein Team- oder Freigabedienst.

## Schritt 3 — Team, Rechte und Freigaben (lokaler Teamtest abgenommen, produktiver Betrieb offen)

Die Verwaltung enthält jetzt „Prüfung & Freigabe“. In der Redaktion reicht „Zur Prüfung einreichen“ einen unveränderlichen Inhaltsstand ein. Die Prüfung zeigt Titel, Beschreibung und Markdown-Änderungen, getrennte Seiteneinstellungen sowie Kommentare und begründete Rückgaben. Lange unveränderte Textabschnitte sind aufklappbar. Suche und Statusauswahl grenzen die Vorschläge ein. Die Freigabe übernimmt genau den eingereichten Stand über den vorhandenen geprüften Generator; spätere Änderungen am persönlichen Entwurf verändern diesen Vorschlag nicht. Veraltete Quellrevisionen werden beim Übernehmen abgewiesen.

Zwei ausdrücklich getrennte Betriebsarten:

- **Lokal ohne Workspace-Anbindung:** eine lokale Redaktion mit Administratorrechten. Direkte Übernahme bleibt vorhanden. Selbstfreigabe ist für den lokalen Testbetrieb erlaubt und sichtbar beschriftet. Keine erfundenen Teammitglieder. Der öffentliche Hilfebereich bleibt unverändert öffentlich.
- **Workspace-Sitzung (aktuell lokal aktiviert und mit zwei echten Konten geprüft):** Die vorhandene Docmost-/NestJS-Anmeldung bestätigt Benutzer und Workspace bei jeder Anfrage über `/api/help-authoring/session`. Dieser Endpunkt erfordert eine interaktive Sitzung, keine API-/OAuth-Tokens. Eine fremde Workspace-ID, abgelaufene/widerrufene Anmeldung oder nicht zugewiesene Mitgliedschaft sperrt den Zugriff. Ein nicht erreichbares Backend führt nicht zum lokalen Fallback.

Im Sitzungsmodus werden direkte Rollen auf dieser Site vergeben: Leser, Kommentator, Redakteur, Prüfer, Strukturverantwortlicher, Administrator. Workspace-Owner und -Administratoren bleiben Administratoren. Nur Administratoren können anderen aktiven Workspace-Mitgliedern Rollen zuweisen oder deren Zugriff entziehen. Eigene Rollen und geerbte Workspace-Administration sind in dieser UI nicht änderbar. Rollenprüfungen erfolgen an den schreibenden Endpunkten: Redaktion ab Redakteur, Entscheidungen ab Prüfer, Struktur ab Strukturverantwortlicher, Website-Einstellungen/Gestaltung und Mitglieder ab Administrator. Direkte Inhaltsübernahme wird im Sitzungsmodus serverseitig gesperrt; eigene Vorschläge müssen von einer anderen Person freigegeben werden. Private Redaktionsentwürfe sind nach Workspace und Benutzer getrennt.

### Workspace-Anbindung aktivieren

Beide Werte gemeinsam in der lokalen `.env` konfigurieren, danach den Entwicklungsserver neu starten:

```dotenv
HELP_EDITOR_AUTH_ORIGIN=http://localhost:3000
HELP_EDITOR_WORKSPACE_ID=<bestehende-workspace-uuid>
```

Der Backend-Origin muss lokal oder HTTPS sein und den neuen Session-Endpunkt enthalten. Er muss zum über `/api` angebundenen Login-Backend passen. Anmeldung und Verwaltung auf demselben Browser-Host verwenden, damit die bestehende Sitzung mitgesendet wird. Keine Geheimnisse werden an den Client exportiert. Erst mit erreichbarem Backend anmelden, als Workspace-Administrator Mitglieder zuweisen und den Ablauf mit mindestens zwei realen Sitzungen abnehmen. Die lokale Arbeitsumgebung wird durch diese Einstellungen nicht zu einem öffentlich betriebenen Teamdienst; Loopback-/Origin-/Token-Prüfungen bleiben bestehen. Kein anderer Workspace und keine laightup-Produktanmeldung wird automatisch verwendet.

### Aktive lokale Team-Testumgebung

Die aktuelle `.env` verbindet die Verwaltung mit dem isolierten Test-Workspace. Backend: `127.0.0.1:3000`, PostgreSQL: `127.0.0.1:55439`, eigener Redis: `127.0.0.1:16379`. PostgreSQL lauscht nur lokal und verwendet SCRAM-Passwortanmeldung. Die bestehende Datenbank auf Port 55432 und der vorhandene Redis auf Port 6379 werden nicht verwendet. Mails werden ausschließlich vom vorhandenen Log-Treiber protokolliert. Telemetrie ist deaktiviert.

Zwei echte Testkonten: „Prüfer (Test)“ als Workspace-Owner/Administrator und „Redaktion (Test)“ als Mitglied mit expliziter Redakteursrolle. Die erzeugten Kennwörter stehen ausschließlich in `.helpcenter-editor/team-test/credentials.json` (Dateirechte 0600); keine Passwörter oder Cookies in Repository-Dokumentation kopieren. Die ursprüngliche `.env` ist privat als `env.before` gesichert. Bestehende lokale Entwürfe bleiben erhalten und werden nicht stillschweigend in die neuen persönlichen Benutzerverzeichnisse verschoben.

`scripts/help-team-live-acceptance.mjs` prüft beide echten Sitzungen gegen die laufende Anmeldung, aber mit einer separaten Inhaltskopie. Es prüft unabhängige Freigabe samt Generierung, Kommentar/Rückgabe, unveränderlichen Vorschlag, private Entwürfe, eigene Freigabe mit Prüferrolle, direkte unberechtigte API-Aufrufe, Rechteentzug und Abmeldung. Die Inhaltskopie liegt unter `.helpcenter-editor/team-test/acceptance`; der echte Hilfebereich erhält keine Testbeiträge. Ergebnis: `acceptance-result.json`.

Auch im Browser wurden beide Konten angemeldet, die Rückkehr zur vorherigen Verwaltungsansicht, Rollenzuweisung, Schreibschutz der Struktur, fehlende direkte Übernahme für Redakteure und reguläre Abmeldung geprüft. Die UI bleibt lokal erreichbar; dies ist keine Bereitstellung im Internet. Start-/Stopp-Hinweise stehen in `TEAM-TEST.md`.

### Speicherung und Grenzen

- Teamrollen, Vorschläge, Kommentare und Aktivitätsverlauf: `.helpcenter-editor/team/<workspace-id>.json`, lokal `local.json`. Keine Änderungen am Produkt-Release-Archiv. Die letzten 100 Aktivitäten sind für Administratoren sichtbar. Dies ist ein lokaler Verlauf, kein manipulationssicheres Audit-System.
- Rollenänderungen und Entscheidungen sind serialisiert und revisionsgebunden. Quelldateiänderungen verwenden dieselbe Schreibwarteschlange über alle Benutzerdienste hinweg. Bei Generatorfehlern bleiben Quelle und Vorschlag erhalten.
- Vor der Übernahme wird der Status `applying` dauerhaft gespeichert. Ein Prozessabbruch kann diesen Status hinterlassen. Dann Quellen, Sicherungsstand und Vorschlag manuell prüfen; keine automatische Wiederholung oder zweite Freigabe anbieten. Eine Wiederherstellungs-UI folgt mit dem Betriebsmodell.
- Private Zustandsdateien und autoritative Entwurfsquellen sind vom direkten Vite-Dateizugriff ausgeschlossen. Hochgeladene Medien bleiben öffentliche Dokumentationsassets; vertrauliche Medien benötigen die geplante geschützte Medienverwaltung.
- Neue private Anleitungen aus dem bisherigen Editor-Dialog müssen für diesen Ablauf zuerst über die Inhaltsstruktur als kanonische Entwurfsseite angelegt werden. Das Prüfwerkzeug veröffentlicht keine fremden privaten Neuanlagen.

Noch offen: Team-/Gruppenrechte und deren Vererbung, produktiver Verwaltungsdienst mit dauerhafter Datenbank, authentifizierter Leserzugriff sowie manipulationssicheres Audit und Wiederherstellung. Schritt 3 ist deshalb noch nicht vollständig abgeschlossen.

## Schritt 4 — Veröffentlichung und Betrieb (offen)

- Entwurf und Live-Version getrennt halten; explizite Veröffentlichung, Rücknahme und Wiederherstellung. Vorschau-Links mit Ablauf und Zugriffsschutz.
- Eigene Domains und Unterverzeichnisse mit funktionierenden Redirects, Metadaten, Assets und Suchindex. Kein Domainformular ohne Hosting-/DNS-Integration.
- Dauerhafte Speicherung, Medienverwaltung, Backups mit geprüftem Restore, Monitoring und Migration vorhandener lokaler Entwürfe/Verläufe.
- Erweiterungen wie zentrale Feedbackauswertung, Analytics, Integrationen oder AI/MCP erst mit realem Dienst, Datenschutz-/Zugriffsmodell und überprüfbaren Ergebnissen.

Abnahme: Eine Freigabe erzeugt einen reproduzierbaren Live-Stand; eine Rücknahme stellt Inhalt, Suche und Downloads gemeinsam wieder her. Der Betrieb lässt sich aus einem Backup wiederherstellen.

## Referenzen und Gestaltung

Geprüfte Referenzen: [Site settings](https://gitbook.com/docs/manage-your-site/site-settings), [Site structure](https://gitbook.com/docs/manage-your-site/site-structure), [Customization](https://gitbook.com/docs/manage-your-site/customization), [Site permissions](https://gitbook.com/docs/manage-your-site/site-permissions). Die Referenz beschreibt unter anderem Konfiguration, Inhaltsanordnung, Design und abgestufte Verwaltungsrechte. Nicht jeder dort aufgeführte Dienst ist bereits implementiert.

Designrichtung aus `design-taste-frontend`: Achromatic ledger / Open plane, vorhandene laightup-Schrift und Marke beibehalten. Ruhige beschriftete Navigation, flache Formulare, eine Speicheraktion, echte Strukturdaten und eine Markenvorschau statt Kennzahlenkarten. Die Markenfarben in Logo und Vorschau sind eine bewusste Vorgabe. Die Phasennummern sind reale Reihenfolge, keine dekorativen Kennzahlen. Die statische Designprüfung meldet keine Fehler; die Browserprüfung erfolgt über die freigegebene CUA-Steuerung statt über den separaten CDP-Inspector des Skills.

## Noch offene Teile der vier Referenzbereiche

| Bereich | Erste Stufe | Noch offen |
| --- | --- | --- |
| Site settings | Titel, Beschreibung, Footer, drei Lesefunktionen und Seitenweiterleitungen | Domain/Unterverzeichnis, Ent-/Veröffentlichen, Wiederherstellen/Archivieren einer Site, Integrationen, zentrale Bewertungen/Analytics, AI/MCP und Zielgruppenregeln |
| Site structure | Themen, Seiten und Unterseiten anlegen; Zweige verschieben; Themen und Geschwisterseiten sortieren; öffentliche Hierarchie und Entwürfe | Externe Navigationslinks, Varianten, Standardbereich/-variante, Archivierung |
| Customization | Zwei Farben, zwei Schriftoptionen, Artikelbreite, Vorschau | Logo-/Favicon-Verwaltung, Header-/Footer-Navigation, weitere Layoutoptionen, Seiten-Cover, semantische Hinweis-/Codefarben, Dark-Theme-Regeln, Schriften-/Icon-Varianten und sprachabhängige Angaben |
| Site permissions | Lokale Vorschläge/Kommentare/Freigaben, lokal abgenommene Workspace-Sitzungsanbindung mit direkten Rollen und serverseitigen Prüfungen, persönlicher Entwurfsspeicher, lokaler Verlauf | Gruppenrechte/Vererbung, produktiver Verwaltungsdienst, geschützter Leserzugriff und manipulationssicheres Audit |

Die deutschsprachige Verwaltungsoberfläche wird vor weiteren Sprachen in das bestehende Nachrichtensystem überführt. Lokalisierbare Website-Angaben erhalten dann explizite Locale-Werte; Markenwerte und stabile Kennungen bleiben gemeinsam. Bestehende deutsche Inhalte, vollständige Produktnews, Quellen-/Ticketfilter und die vereinfachte Sprachauswahl bleiben verbindlich.

## laightup-Komponenten statt eigener Verwaltungs-Controls

Auf ausdrücklichen Wunsch basiert die Verwaltung jetzt auf denselben `@chainmatics/laightup-glass`-Bausteinen wie `components/settings/nav/SettingsSidebar.tsx`, `SettingsPageFrame.tsx` und `PreferencesTab.tsx` im laightup-Frontend. Die vorherige generische Gestaltung ist ersetzt: Header, Navigation, gruppierte Einstellungszeilen, Karten, Buttons, Inputs, Textarea, Switches und Select-/Popover-Menüs verwenden die Produktkomponenten. Herkunft und Integrationsanpassungen sind unter `apps/client/src/features/helpcenter/management/laightup-ui/README.md` sowie `SOURCE.json` dokumentiert. Die Übernahme ist eigenständig baubar und verändert das Quellprojekt nicht.

Der frühere Gestaltungsentwurf „Achromatic ledger“ wird damit durch die tatsächliche laightup-Komponentenfamilie abgelöst. Native Speicherdaten, Rollenstatus und Ausbauumfang bleiben gleich. Auf Mobilgeräten lässt sich die Navigation wie in den Produkteinstellungen aufklappen.

## URL-Verwaltung

Unter `/help/verwalten?bereich=urls` lassen sich deutsche Seitenadressen ändern sowie manuelle Weiterleitungen auf veröffentlichte Seiten anlegen, suchen und entfernen. Alle Änderungen werden vorgemerkt und mit der gemeinsamen Speicheraktion übernommen. Verwerfen stellt den gespeicherten Stand wieder her. Die bestehende Struktur-Berechtigung gilt auch für URL-Änderungen; die serverseitigen Sitzungs-, Token- und Revisionsprüfungen bleiben aktiv.

Die Seiten-ID, Quelldatei und Übersetzungsdateien bleiben unverändert. Der deutsche Slug steht in `locales/de/metadata.json`; Weiterleitungen stehen unter `structure.json → urlRedirects.de` als `{from, targetId}`. Ein veröffentlichter alter Slug wird automatisch als Weiterleitung erhalten. Ziel-IDs werden beim Generieren in aktuelle URLs aufgelöst, sodass auch nach mehreren Umbenennungen keine Weiterleitungsketten entstehen. Entwürfe erhalten keine öffentlichen Alias-Adressen. Eigene frühere URLs können zurückgenommen werden. Doppelte Slugs, reservierte System-/Sprachpfade, belegte Alias-Adressen und unveröffentlichte oder unbekannte Ziele werden abgelehnt.

Der Generator prüft URLs und erzeugt `redirects.public.json` sowie das öffentliche Build-Artefakt `helpcenter/redirects.json`. Entwicklungsserver, Vite-Preview und der reguläre Fastify-Produktionsserver antworten auf GET/HEAD mit HTTP 308 und erhalten Queryparameter; Browser behalten Abschnittsanker bei. Alte deutsche Markdown-Downloads werden ebenfalls auf die aktuelle Datei umgeleitet. Clientseitige Navigation verwendet denselben erzeugten Index und erhält Query und Hash. Semantische `doc:`-Links, Suche, Lernpfad-Schritte und Markdown-/LLM-Exporte verwenden die neuen Slugs. Ein fehlgeschlagener Generator setzt Metadaten und Weiterleitungen gemeinsam zurück; bestehende Inhaltsentwürfe werden nicht gelöscht, sind bei veränderter Quellrevision aber neu abzugleichen.

Diese Stufe verwaltet Artikeladressen unter `/help/<slug>`. Themen-IDs, Site-/Sprachpfade und externe Zieladressen werden nicht umbenannt. Für alternative statische Hosting-Plattformen muss der erzeugte Redirect-Index in deren HTTP-Konfiguration übernommen werden; der Client-Fallback allein liefert keinen HTTP-Redirect.

Geprüft: Server-/Compiler-Tests für Umbenennung, ID-Erhalt, semantische Links, Revisionskonflikte, mehrfache Umbenennung, manuelle Weiterleitungen und Generator-Rollback; Komponententests für Vormerken, Validierung und Entfernen. Browserprüfung mit isolierter Inhaltskopie; keine echten Artikel wurden für die Abnahme umbenannt.
