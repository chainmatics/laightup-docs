# Bedingungen, Reihenfolge und Standardwerte

Verstehe, welche Zeile für ein Gerät gewinnt.

<!-- section: zuerst-gewinnt-die-erste-passende-zeile -->
## Zuerst gewinnt die erste passende Zeile
Die Auswertung prüft die Bedingungszeilen in ihrer Reihenfolge. Die erste passende Zeile gewinnt. Die Standardzeile nimmt nicht an dieser Auswahl teil; sie füllt fehlende Werte auf.

<!-- section: leere-werte-fallen-auf-den-standard-zuruck -->
## Leere Werte fallen auf den Standard zurück
Ist ein Wert in der gewinnenden Zeile leer, wird der Standardwert der entsprechenden Spalte verwendet. Fehlt auch dieser, bleibt der ausgegebene Wert leer.

| Standard | Passende Zeile | Ausgabe |
| --- | --- | --- |
| Preis: 4,90 € | Preis: 3,90 € | 3,90 € |
| Titel: Frisch für dich | Titel: leer | Frisch für dich |

<!-- section: bedingungen-bewusst-kombinieren -->
## Bedingungen bewusst kombinieren
Alle Angaben innerhalb einer Bedingung müssen zutreffen. Zusätzliche Bedingungen können Alternativen bilden. Eine normale Zeile ohne Bedingung greift nicht; dafür gibt es die Standardzeile.

<!-- section: uberschneidungen-prufen -->
## Überschneidungen prüfen
Wenn mehrere Zeilen auf dasselbe Gerät passen könnten, ist die Reihenfolge entscheidend. Teste mindestens ein Gerät pro gewünschtem Fall sowie ein Gerät, das auf die Standardwerte zurückfallen soll.

> Prüfe vor dem Ausspielen nicht nur den geänderten Preis. Eine falsche Bedingung kann alle Werte derselben Zeile auf unerwartete Geräte anwenden.

[Zur Gerätevorschau](doc:platzhalter-anlegen)
