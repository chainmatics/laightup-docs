# Standort, Gerätename und Uhrzeit einsetzen

Nutze vorhandene Informationen, ohne eigene Wertetabellen zu pflegen.

<!-- section: verfugbare-informationsarten -->
## Verfügbare Informationsarten
Systemplatzhalter stellen Informationen zu Gerät, Arbeitsbereich und Standort bereit. Hinzu kommen Datum und Uhrzeit. Die Platzhalterauswahl im Editor ist der richtige Einstieg für den in deiner Umgebung angebotenen Umfang.

| Beispiel | Inhalt |
| --- | --- |
| `{{system.device.name}}` | Gerätename |
| `{{system.location.name}}` | Standortname |
| `{{system.location.city}}` | Stadt des Standorts |
| `{{system.location.street}}` | Straße |
| `{{system.datetime.date}}` | Datum |
| `{{system.datetime.time}}` | Uhrzeit |

<!-- section: werte-an-der-quelle-pflegen -->
## Werte an der Quelle pflegen
Ist der Standortname falsch, korrigiere die Standortdaten. Ein Platzhalter macht unvollständige Stammdaten nicht automatisch richtig. Prüfe außerdem, ob das Gerät dem richtigen Standort zugeordnet ist.

<!-- section: vorschau-richtig-lesen -->
## Vorschau richtig lesen
Die Systemgruppe lässt sich gegen ein Gerät testen. Datum und Uhrzeit werden im Player aufgelöst; die Editorvorschau verwendet dafür Beispielwerte. Eine statische Vorschau ist daher kein Nachweis für den späteren exakten Uhrzeitwert.

[Standortdaten pflegen](/help/standort-anlegen)
