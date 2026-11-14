# Parameter und Platzhalter verstehen

Lasse dasselbe Design auf unterschiedlichen Geräten passende Werte zeigen.

<!-- section: was-ist-hier-mit-parameter-gemeint -->
## Was ist hier mit Parameter gemeint?
Für dynamische Textwerte verwendet die Oberfläche den Begriff **Platzhalter**. Ein Platzhalter wird beim Ausspielen durch einen passenden Wert ersetzt. Davon zu unterscheiden sind Wiedergabeparameter wie Gewicht, Intervall, Priorität oder Rotation.

<!-- section: zwei-arten-von-platzhaltern -->
## Zwei Arten von Platzhaltern
| Art | Woher kommt der Wert? | Beispiel |
| --- | --- | --- |
| Systemplatzhalter | Aus Gerät, Arbeitsbereich, Standort oder Datum und Uhrzeit | `{{system.location.city}}` |
| Eigene Platzhalter | Aus einer selbst angelegten Gruppe mit Standardwerten und Bedingungen | Gruppe `angebot`, Spalte `preis` → `angebot.preis` |

<!-- section: ein-design-verschiedene-orte -->
## Ein Design, verschiedene Orte
Du gestaltest ein Angebotsmotiv einmal. Für Köln und Berlin können unterschiedliche Werte hinterlegt werden. Das Design bleibt gleich, während die passende Bedingungszeile die Texte für das jeweilige Gerät liefert.

<!-- section: der-weg-zum-richtigen-wert -->
## Der Weg zum richtigen Wert
1. Eine Gruppe definiert die verfügbaren Platzhalter.
2. Die Standardzeile enthält die allgemeinen Werte.
3. Bedingungszeilen überschreiben Werte für passende Geräte.
4. Die Gerätevorschau zeigt, was ein konkretes Gerät erhalten würde.

> Änderungen an eigenen Platzhalterwerten werden nach deiner Bestätigung direkt ausgespielt. Sie durchlaufen nicht automatisch die Designfreigabe.

- [Eigene Platzhalter einrichten](doc:platzhalter-anlegen)
- [Bedingungen und Standardwerte verstehen](doc:platzhalter-regeln)
- [Wiedergabeparameter nachschlagen](doc:wiedergabe-parameter)
