# Inhalte für weitere Sprachen pflegen

Deutsch ist die Ausgangssprache. Diese Umstellung strukturiert die Inhalte und ihren Übersetzungsprozess; sie veröffentlicht noch keine zusätzliche Sprache. Der Sprachzugang in der Kopfzeile ist als Dropdown umgesetzt; aktuell liefert er ausschließlich die deutsche Fassung aus. Die laufende Oberfläche verwendet weiter die deutsche Fassung. Feste Oberflächentexte und Beschriftungen in individuellen Grafiken sind bei einer späteren Sprachaktivierung zusätzlich an die Sprachdaten anzubinden; Artikeltexte und Inhalte der Neuerungen sind bereits sprachweise organisiert.

## Quellen und erzeugte Dateien

```text
structure.json                       stabile IDs, Beziehungen, Quellen, Inhaltstypen
locales.json                         Ausgangssprache, Sprachkennungen, Entwurf/Veröffentlichung
locales/
  de/
    metadata.json                    Texte von Kategorien, Artikeln und Neuerungen
    messages.json                    zentrale Begriffe, Titel, Kategorien und Suchsynonyme
    articles/<article-id>.md          deutsche Artikeltexte
  <weitere-sprache>/
    metadata.json
    messages.json
    articles/<article-id>.md
    release-texts/<source-update-id>.md
    translation-state.json           geprüfte Hashes der deutschen Übersetzungseinheiten
release-archive/                      unveränderte Linear-Originale, sprachunabhängige Herkunft
source-snapshot.json                 main-SHA und Codequellen
translation-status.json              erzeugter Bericht fehlender/veralteter Einheiten
generated/<sprache>/bundle.json       erzeugtes sprachbezogenes Inhaltspaket
```

**Bearbeitet werden `structure.json` und die jeweiligen Dateien in `locales/`.** Die bisherigen `catalog.json`, `updates.json`, `content/*.md` und `messages.json` werden für die bestehende Anwendung aus der Ausgangssprache erzeugt. Sie sind Kompatibilitätsausgaben und keine zweite Inhaltsquelle. Auch `generated/`, öffentliche Markdown-Dateien, SUMMARY und LLM-Indizes werden nicht direkt übersetzt.

- Stabile Artikel-IDs bleiben unverändert, selbst wenn sie historisch deutsch benannt sind. Die IDs sind interne Schlüssel, keine zu übersetzenden Texte. `metadata.articles.<id>.slug` ist davon getrennt und kann in weiteren Sprachen anders lauten. Deutsche Slugs und URLs bleiben unverändert.
- Kategoriezuordnungen, Lernpfad-Schritte, Quellen, Visual-Varianten, Datumswerte, Release-IDs und Beziehungen stehen ausschließlich in `structure.json`. Der Neuerungsbereich enthält ausschließlich Produktmeldungen (`product`) mit einer bestätigten Release-Quelle. Helpcenter-Neuigkeiten gehören nicht in dieses Archiv.
- Artikel-Metadaten enthalten Titel, Beschreibung, Zielgruppe, Lernziel und Suchbegriffe. Neuerungstexte sind über Update- und stabile Change-IDs organisiert. Beim Ergänzen oder Umordnen keine vorhandenen IDs neu vergeben. Linkziele sind Artikel-IDs; Linktexte werden je Sprache übersetzt.
- Die 18 ursprünglichen Release-Texte bleiben unverändert im Archiv. Für die Ausgangssprache stammen die vollständigen Rohtexte aus diesem Archiv. Übersetzungen liegen getrennt unter `release-texts/`; sie überschreiben niemals Originale oder Quellen-Hashes. Übersetzt wird die fachliche Darstellung mit lesbaren Titeln, ohne Quellenlinks. Ticketnummern, Ticketbeschreibungen und technische Implementierungsdetails werden niemals öffentlich übersetzt oder ausgespielt. Originale und technische Herkunft bleiben intern. Der Client und die Suche verwenden ausschließlich `releases.public.json`; öffentliche Rohdateien sind nicht zulässig.

## Neue Seiten und Hierarchie

Die Management-UI legt neue Seiten mit stabiler ID, deutscher Metadatenzeile und Markdown-Vorlage in den autoritativen Quellen an. `parentId` und Reihenfolge sind sprachunabhängige Struktur. Seiten mit `status: "draft"` und Themen ohne veröffentlichte Seiten werden aus öffentlichen Paketen und deutschen Übersetzungseinheiten ausgeblendet. Erst die Übernahme einer ausgefüllten Seite in der Redaktion erzeugt neue Übersetzungseinheiten. Dann nach dem unten beschriebenen Hash-/Prüfprozess übersetzen; bestehende fremdsprachige Dateien nicht automatisch überschreiben. Strukturelles Verschieben ändert weder IDs noch Slugs oder Übersetzungstexte. Themennamen und -beschreibungen werden je Sprache übersetzt.

## Querverweise und Anker

In bearbeiteten Artikelquellen werden semantische Links verwendet:

```markdown
[Eine Playlist zusammenstellen](doc:playlist-erstellen)
[Tags verwenden](doc:bibliothek#inhalte-mit-tags-wiederfinden)

<!-- section: inhalte-mit-tags-wiederfinden -->
## Inhalte mit Tags wiederfinden
```

Das Linkziel und der `section`-Schlüssel werden **nicht übersetzt**. Übersetzt werden sichtbarer Linktext und Überschrift. Der Compiler löst IDs in die Slugs und den konfigurierten Sprachpfad auf. So verweist ein französischer Artikel später auf den französischen Zielartikel und denselben stabilen Abschnitt. Neue interne Artikelverweise in `doc:`-Form schreiben; keine deutschen `/help/...`-Pfade in eine andere Sprache kopieren.

Jede H2 benötigt genau einen eindeutigen `section`-Marker direkt davor. Reihenfolge und IDs der Marker bleiben in der Übersetzung erhalten. Platzhalter wie `{{angebot.preis}}` und `{{system.location.city}}` sind Produktvariablen und bleiben ebenfalls exakt erhalten. Der Compiler blockiert falsche Verweise, fehlende Marker, veränderte Variablen und doppelte Slugs.

## Übersetzungsablauf

Im Repository-Verzeichnis:

```sh
# Neue Sprache als unvollständigen Entwurf anlegen, ohne deutsche Kopien als Übersetzung auszugeben:
node scripts/helpcenter-translations.mjs init en en-GB

# Fehlende und nach deutschen Änderungen veraltete Einheiten anzeigen:
node scripts/helpcenter-translations.mjs status

# Inhaltliche Vorschau als JSON-Paket, mit ausdrücklich ausgewiesenem deutschen Fallback:
node scripts/helpcenter-translations.mjs preview en

# Erst nach tatsächlicher sprachlicher/fachlicher Prüfung und vollständiger Übersetzung:
node scripts/helpcenter-translations.mjs review en
```

`review` übersetzt nichts. Es bestätigt bewusst, dass die vorhandene Übersetzung gegen den aktuellen Ausgangstext geprüft wurde, und speichert dessen Hashes. Die Prüfung betrifft einzelne Felder und Textdateien: Eine geänderte deutsche Beschreibung macht ihre Übersetzung veraltet, nicht alle Artikel. Fehlende Einheiten und unerkannte Schlüssel müssen vor der Bestätigung behoben sein. Vorschauen dürfen fehlende Einheiten durch Deutsch ersetzen; der Statusbericht kennzeichnet dies. Der normale Build erlaubt für veröffentlichte Inhaltspakete weder fehlende noch veraltete Einheiten.

`published` in `locales.json` bedeutet, dass ein vollständiges Inhaltspaket erzeugt werden darf. Eine zusätzliche öffentliche Sprache erfordert außerdem die bewusste Anbindung dieses Pakets an die Routen, Seitensprache, Richtung, Datums-/Zahlformate, Suche, Oberflächentexte, Grafikbeschriftungen und Sprachwahl. Ein Sprachordner allein erzeugt keine automatisch erreichbare übersetzte Website. Diese Aktivierung erfolgt erst mit fertigen Texten, damit keine gemischte Sprachfassung öffentlich erscheint.

## Grenzen zwischen Inhalt und Darstellung

Die gemeinsame Struktur dupliziert weder Komponenten noch CSS. Hero-Bild, HTML-Typografie, Cards und Bewegung bleiben gemeinsam. Bildtexte, Alt-Texte, Grafikbeschriftungen und fachliche Begriffe müssen beim Sprachrollout als übersetzbare Einheiten ergänzt oder angebunden werden; kein Text wird dafür in Bilder eingebrannt. Ein Glossar für Produktbegriffe und gegebenenfalls regionale Formate kann pro Sprache ergänzt werden, ohne die IDs oder Produktvariablen zu ändern.

Neue Releases zuerst mit stabilen IDs und deutschem Text einpflegen, Originale archivieren, danach den Statusbericht erzeugen. Für neue Sprachen werden Übersetzungen anhand derselben Release-ID ergänzt; Veröffentlichungsdatum und Quelle ändern sich nicht. Die fachliche Vollständigkeit jeder Sprache ist zusätzlich zum unveränderten Originalarchiv zu prüfen.

## Prüfung

```sh
node --test scripts/helpcenter-locales.test.mjs
node scripts/build-helpcenter.mjs
pnpm exec nx run client:test -- src/features/helpcenter/content.test.ts src/features/helpcenter/release-notes.test.ts src/features/helpcenter/update-search.test.ts
pnpm exec nx run client:build
```

Der Build schreibt die Kompatibilitätsausgaben idempotent und validiert sie anschließend mit den bisherigen Inhaltsprüfungen. Der Bericht unter `translation-status.json` ist maschinenlesbar und kann später von einem Übersetzungsdienst oder CI verwendet werden. Zugangsdaten oder ein externer Übersetzungsanbieter werden dafür nicht benötigt.

## Sprach-Dropdown und neue Sprachfassungen

`languages.json` ist ein Auswahlkatalog mit 47 Einträgen, kein Nachweis veröffentlichter Übersetzungen. Das kompakte Dropdown zeigt ausschließlich ein Suchfeld und Regionen. Europa bleibt eine einzige Gruppe neben Asien. Bei Hover oder Tastaturfokus öffnen sich seitlich alphabetisch sortierte Sprachen mit Flaggen und Eigennamen; auf schmalen Ansichten öffnet ein Tippen dieselbe Liste mit Rücksprung zu den Regionen. Die globale Suche findet Eigenname, deutschen/englischen Namen, Land und Sprachcode. Filter und Favoriten entfallen. Jede Sprache steht genau einmal im Katalog und genau einer Gruppe. Dialekt- und Regionalvarianten sind für diese Produktauswahl ausgeschlossen; Norwegisch wird ohne getrennte Bokmål-/Nynorsk-Einträge angeboten. Der Katalog ist eine kuratierte Produktsprachauswahl, keine sprachwissenschaftliche Klassifikation.

Die Bedienoberfläche liegt unter `locales/de/messages.json` → `languagePicker`. Namen und Flaggen sind im Katalog hinterlegt. Die aktuelle Sprache bleibt Deutsch; andere Auswahlen speichern ausschließlich eine lokale Präferenz und zeigen ausdrücklich, dass diese Sprachfassung noch fehlt. Das ist keine Anmeldung zu einer Benachrichtigung.

Eine neue Fassung erst nach dem bestehenden Übersetzungs- und Reviewprozess veröffentlichen. Anschließend das geprüfte Paket tatsächlich an Routen, Suche, UI, Datumsformate und Seitensprache anbinden und die Aktivierung im Sprach-Dropdown ergänzen. `languageAvailable()` in `languages.ts` prüft zusätzlich zur Veröffentlichung, ob eine Sprache bereits vom Renderer unterstützt wird. Ein Katalogeintrag oder `published` allein darf diesen Schutz nicht umgehen.
