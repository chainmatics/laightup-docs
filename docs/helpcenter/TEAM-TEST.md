# Lokaler Teamtest

Stand: 2. November 2026. Diese Umgebung ist ausschließlich eine lokale Testumgebung. Sie nutzt die bestehende Anmeldung des Dokumentationsprojekts, keine laightup.com-Produktkonten.

| Dienst | Adresse | Daten |
| --- | --- | --- |
| Management-UI | http://127.0.0.1:4173/help/verwalten | Repository-Inhalte |
| Backend | http://127.0.0.1:3000 | Isolierter Test-Workspace |
| PostgreSQL 17 | 127.0.0.1:55439 | `.helpcenter-editor/team-test/postgres` |
| Redis | 127.0.0.1:16379 | `.helpcenter-editor/team-test/redis.rdb` |

Alle Dienste binden ausschließlich an Loopback. Die vorhandenen Dienste auf 55432 und 6379 bleiben unberührt. PostgreSQL verwendet SCRAM. Mail wird nur protokolliert; Telemetrie ist deaktiviert. Der vorhandene `log`-Mailtreiber wurde in der Environment-Validierung zugelassen.

## Testkonten

- `pruefer@laightup.test`: Prüfer (Test), Workspace-Owner und deshalb Site-Administrator. Kann fremde Vorschläge freigeben.
- `redaktion@laightup.test`: Redaktion (Test), Workspace-Mitglied mit expliziter Site-Rolle Redakteur. Kann persönliche Entwürfe und Vorschläge bearbeiten, keine Struktur/Einstellungen/Mitglieder ändern und nicht direkt übernehmen.

Erzeugte Passwörter: `.helpcenter-editor/team-test/credentials.json`, ausschließlich lokal und mit Dateirechten 0600. Diese Datei enthält zusätzlich die isolierten Datenbank-/Anwendungsgeheimnisse und wird nicht eingecheckt oder öffentlich ausgeliefert. Keine Passwörter in Tickets oder QA-Berichte kopieren.

Unter **Berechtigungen → Abmelden** lässt sich das Konto wechseln. Die bestehende Anmeldung führt anschließend zur zuvor geöffneten Verwaltungsansicht zurück. Die Oberfläche der bestehenden Login-Seite ist weiterhin die Docmost-Anmeldung; die Management-Ansichten verwenden laightup-Komponenten.

## Erneut starten

Die folgenden Befehle setzen die bereits angelegte lokale Umgebung und die hier vorhandenen Homebrew-Binaries voraus. Sie löschen keine Daten. Aus dem Repository-Verzeichnis ausführen:

```sh
/opt/homebrew/opt/postgresql@17/bin/pg_ctl -D .helpcenter-editor/team-test/postgres -l .helpcenter-editor/team-test/postgres.log -o '-h 127.0.0.1 -p 55439 -k /tmp' start
redis-server --bind 127.0.0.1 --port 16379 --dir "$PWD/.helpcenter-editor/team-test" --dbfilename redis.rdb --logfile "$PWD/.helpcenter-editor/team-test/redis.log" --pidfile "$PWD/.helpcenter-editor/team-test/redis.pid" --daemonize yes
pnpm run help:team:backend
```

Bereits laufende Dienste nicht nochmals starten. Backend-PID: `.helpcenter-editor/team-test/backend.pid`; Log: `backend.log`. Das Backend-Startskript verwendet eine eigene Arbeitsumgebung unter dem ignorierten Testverzeichnis, damit auch seine lokalen Upload-Dateien getrennt bleiben. Nach Änderungen am Backend zunächst den Server bauen. Nach Änderungen an der Anmeldung bzw. `.env` die Management-Ansicht neu laden; alte Editor-Tokens gelten nach einem Vite-Neustart nicht mehr.

Die Anwendungsschemata wurden aus den vorhandenen 52 Migrationen angelegt. Weitere Migrationen lassen sich auf diese isolierte Datenbank mit `node scripts/help-team-test-runtime.mjs migrate` anwenden. `node scripts/help-team-test-setup.mjs` richtet die beiden vorhandenen Testkonten erneut zu, ohne einen zweiten Workspace zu erzeugen. Es weist keine Site-Rollen zu; diese werden über die Management-UI gepflegt.

## Erneut prüfen

```sh
pnpm run help:team:test
```

Das Skript meldet beide echten Testkonten am Backend an und erstellt eine separate Kopie der Inhaltsquellen unter `.helpcenter-editor/team-test/acceptance`. Ein temporärer HTTP-Dienst verwendet denselben Schreibdienst und Generator wie die Management-UI. Diese Inhaltskopie wird bei jedem Testlauf neu aufgebaut. Es werden ausschließlich Daten dieser Kopie ersetzt; der echte Inhalt und vorhandene Entwürfe bleiben unberührt. Der Test vergibt Rollen nur innerhalb seiner eigenen Kopie, nicht in der echten Management-UI. Seine Anmeldesitzungen werden nach dem Test wieder abgemeldet.

Geprüft werden Anmeldung/Zuweisung, direkte unberechtigte API-Aufrufe, persönliche Entwürfe, Einreichen und Kommentare, unveränderlicher Vorschlag, gesperrte eigene Freigabe auch mit Prüferrolle, unabhängige Freigabe mit generiertem Katalog, veraltete Quelle, begründete Rückgabe, sofortiger Rechteentzug und Abmeldung. Ergebnis ohne Tokens/Passwörter: `acceptance-result.json`.

## Stoppen und ursprüngliche Konfiguration

Den Backend-Prozess anhand der gespeicherten PID und seines tatsächlichen Kommandos prüfen und regulär mit SIGTERM beenden. Den PostgreSQL-Testcluster über `pg_ctl -D .helpcenter-editor/team-test/postgres stop` stoppen. Redis ausschließlich über `redis-cli -h 127.0.0.1 -p 16379 shutdown` stoppen. Keine globalen `killall`-Befehle und keinen Redis auf 6379 beenden.

Die `.env` zeigt konsistent auf diese Testdienste. Der vorherige Stand ist unter `.helpcenter-editor/team-test/env.before` gesichert. Bei einer Rückkehr zur früheren Konfiguration inzwischen vorgenommene `.env`-Änderungen zuerst vergleichen; nicht ungeprüft die komplette Datei überschreiben. Eine leere oder einseitige Workspace-Konfiguration ist kein Ersatz für eine bewusste Rückkehr zum lokalen Modus. Der aktivierte Sitzungsmodus gibt bei Backend-Ausfall keinen anonymen Schreibzugriff frei.

## Grenzen

Abgenommen ist der lokale Betrieb mit zwei Konten. Produktiver Verwaltungsdienst, Internet-Bereitstellung, Gruppenrechte/Vererbung, geschützte Leserzugriffe, manipulationssicheres Audit sowie Wiederherstellung bleiben offen. Der öffentliche Hilfebereich bleibt öffentlich. Die bestehenden zwei privaten lokalen Entwürfe wurden nicht migriert; sie liegen weiterhin unverändert im bisherigen lokalen Entwurfsverzeichnis.
