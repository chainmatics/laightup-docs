# Lokale Redaktion

Stand: 2. November 2026.

Der lokale Entwicklungsserver bietet unter `/help/bearbeiten` ein Redaktionswerkzeug. Im Hilfebereich führt der Stift in der Kopfzeile zur aktuellen Anleitung oder zum jüngsten Produktupdate. Die Route und der Schreibdienst sind im Produktionsbuild nicht enthalten.

## Arbeiten mit Inhalten

1. Anleitung oder Produktupdate im linken Seitenbaum wählen; die Suche grenzt den Baum ein.
2. Titel, Beschreibung und Inhalt bearbeiten. Anleitungen unterstützen visuelle Blöcke sowie Markdown. `/` auf einer leeren Zeile oder das Plus öffnet das durchsuchbare Blockmenü. Eine Textauswahl zeigt die Formatierungsleiste. Tabellen bieten eigene Zeilen- und Spaltenaktionen. Bilder können per URL oder als PNG/JPEG/WebP bis 5 MB eingefügt werden. Blöcke lassen sich über die Pfeilaktionen und den fokussierbaren Griff mit den Pfeiltasten umordnen.
3. Seiteneinstellungen enthalten Themenbereich, Zielgruppe, Lernziel und Suchbegriffe. Der Fokusmodus blendet die Seitenleisten aus; Escape beendet ihn.
4. Entwürfe werden automatisch nach kurzer Schreibpause gespeichert. `Cmd/Ctrl+S` und „Entwurf sichern“ speichern ausdrücklich. „Vorschau“ verwendet die Darstellung des Hilfebereichs, „Änderungen“ zeigt den Vergleich zum übernommenen Stand.
5. „Übernehmen“ prüft und aktualisiert die lokalen Dokumentationsdateien. Es führt keinen Commit, Push oder Deployment aus. Die Versionshistorie stellt frühere Inhalte zunächst als bearbeitbaren Entwurf bereit.

Neue Anleitungen erscheinen zunächst ausschließlich als Entwurf. Produktnews stammen weiterhin aus belegten Releases; ihr redaktioneller Titel, ihre Zusammenfassung und ihre fachlichen Änderungstexte sind editierbar. Quellnachweise und stabile Änderungskennungen bleiben geschützt. Es wird kein Hilfecenter-Newsbeitrag angelegt.

## Prüfung und Freigabe

„Zur Prüfung einreichen“ sichert einen unveränderlichen Vorschlag. Unter Verwaltung → Prüfung & Freigabe werden der Unterschied zum Ausgangsstand, Seiteneinstellungen und Rückmeldungen geprüft. Kommentare und begründete Rückgaben sind möglich. Die Freigabe übernimmt den eingereichten Inhalt; sie übernimmt keine späteren Entwurfsänderungen. Ist die Quelle inzwischen geändert, muss ein neuer Vorschlag auf aktueller Grundlage eingereicht werden.

Im lokalen Betrieb bleiben direkte Übernahme und ausdrücklich gekennzeichnete Selbstfreigabe verfügbar. Im optionalen Workspace-Sitzungsmodus sind persönliche Entwürfe getrennt; Freigabe braucht mindestens die Prüferrolle und eine andere Person. API-Zugriffe prüfen die Rechte unabhängig von den UI-Buttons. Siehe `MANAGEMENT.md` für Einrichtung und Grenzen des lokalen Teamtests. Neue Seiten für den Prüfablauf über die Inhaltsstruktur anlegen, nicht als private Neuanlage des bisherigen Editor-Dialogs.

## Daten und Grenzen

- Autoritative deutsche Artikel: `locales/de/metadata.json`, `locales/de/articles/*.md`, gemeinsame `structure.json`. Updates werden in den bestehenden redaktionellen Release-Daten gepflegt; das Quellenarchiv bleibt unverändert.
- Private Entwürfe und vorherige Stände: `.helpcenter-editor/`, durch `.gitignore` ausgeschlossen. Hochgeladene Bilder sind öffentliche Dokumentationsassets und müssen zur Veröffentlichung geeignet sein.
- Abschnittskennungen, `doc:`-Querverweise und Produktplatzhalter bleiben beim visuellen Bearbeiten erhalten. Neue H2-Abschnitte bekommen eigene stabile Kennungen. Übersetzungsdateien werden nicht automatisch überschrieben; neue oder geänderte deutsche Inhalte müssen weiterhin nach `TRANSLATIONS.md` übersetzt und geprüft werden. Die Redaktionsoberfläche ist derzeit deutsch.
- Der Dienst läuft nur im Entwicklungsserver und akzeptiert lokale Zugriffe. Schreibzugriffe prüfen Herkunft, JSON-Format, Sitzungstoken und Basisrevision. Gleichzeitige Änderungen führen zu einem Konflikt statt stiller Überschreibung.
- Vor Übernahme wird ein vorheriger Stand gespeichert. Schlägt der normale Dokumentationsgenerator fehl, werden die Quelldateien zurückgesetzt und die bisherigen Ausgaben wiederhergestellt. Entwürfe bleiben erhalten.
- Kein Team-Echtzeitbetrieb oder Cloud-Speicher. Der lokale Vorschlagsdienst und die lokal mit zwei Konten geprüfte Workspace-Rollenanbindung ersetzen noch keinen produktiven GitBook-Teamdienst.

## Referenz und Prüfung

Referenz ist der offizielle [GitBook-Editor-Leitfaden mit Videodemo](https://gitbook.com/docs/guides/editing-and-publishing-documentation/how-to-use-gitbooks-editor): Seitenbaum, Titel/Beschreibung, Slash-Menü, Inline-Formatierung, Markdown sowie Änderungen vor dem Veröffentlichen prüfen. Ein angemeldeter GitBook-Testbereich wurde nicht verwendet. Die subjektive Gleichwertigkeit der Bedienung wird nicht aus einem Funktionsinventar abgeleitet.

Automatisch geprüft werden Markdown-/Schema-Rundläufe einschließlich Tabellenköpfen, stabiler Anker, interner Links und Platzhalter; sichere Übernahme, Konflikte, Rücksetzen bei Generatorfehlern, Historie, neue Entwürfe, Uploadbytes und Zugriffsschutz. Im Browser geprüft: neue Testanleitung, Wechsel zwischen Markdown und visuellem Editor, Tabellen, Auswahlformatierung, Umordnen per Pfeilaktion/Tastatur, lokale Entwurfssicherung, Vorschau und Bestätigungsdialoge. Die ausschließlich dafür angelegte Testseite wurde verworfen. Pointer-Drag wurde implementiert, ließ sich in der Browserautomation jedoch nicht zuverlässig bestätigen; eine umfassende Drag-/Mobil-Abnahme steht aus.

## Inhaltsstruktur und Gestaltung

Der Abgleich mit GitBooks [Content structure](https://gitbook.com/docs/create-content/content-structure), [Sections](https://gitbook.com/docs/create-content/content-structure/space), [Groups](https://gitbook.com/docs/create-content/content-structure/collection) und [Pages](https://gitbook.com/docs/create-content/content-structure/page) ergibt für laightup diese Hierarchie:

- **Hilfebereich** als gemeinsame Site.
- **Anleitungen und Produktnews** als getrennte Inhaltsbereiche in der Redaktion.
- **Themen** als aufklappbare Gruppen innerhalb der Anleitungen, aus dem vorhandenen gemeinsamen Strukturkatalog.
- **Seiten und Unterseiten** als einzelne Aufgaben, Begriffe oder Referenzen, bis zu drei Seitenebenen. Abschnittsanker strukturieren den jeweiligen Seiteninhalt.

Die neue Inhaltsübersicht zeigt die tatsächlichen Themen und Seiten als verlinkte Karten sowie einen Index der Produktupdates. Seiten lassen sich von dort bearbeiten; das Plus an einem Thema übernimmt den Bereich in den Dialog für eine neue Anleitung. Die Seitensuche findet Treffer auch in zugeklappten Themen und im jeweils anderen Inhaltsbereich. Die bestehende Themenzuordnung in den Seiteneinstellungen verschiebt die Anleitung weiterhin über den geprüften Übernahmeprozess.

Die Gestaltung nutzt eine weiße Schreibfläche ohne äußere Papierkarte, feinere Hierarchielinien, besser lesbare Navigation und Inhaltsschrift sowie sparsame Markenakzente. Produktseiten, URLs und Übersetzungsschlüssel werden dafür nicht umbenannt. Es werden keine zusätzlichen leeren Hierarchieebenen oder unbelegten Inhaltsarten eingeführt. Themen, Seiten und Unterseiten werden in der Management-UI angelegt, verschoben und sortiert (siehe `MANAGEMENT.md`). Neue Management-Seiten bleiben bis zur inhaltlichen Übernahme unveröffentlicht. Beim Wechsel des Themenbereichs im Editor zieht der gesamte Seitenzweig mit. Eine übergeordnete Entwurfsseite muss vor ihren Unterseiten übernommen werden.

Zusätzlich geprüft: Bereichswechsel, Suche über beide Bereiche und zugeklappte Themen, Öffnen der korrekten Seite aus der Inhaltsübersicht und Themenvorwahl beim Anlegen. Drei Komponententests sichern diese Abläufe; Bereichswechsel, Suche und Themenvorwahl wurden auch im Browser ausgeführt.
