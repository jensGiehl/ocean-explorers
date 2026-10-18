# Prüfprotokoll

Stand: 18. Oktober 2026.

## Automatisiert

- Maven Wrapper mit JDK 27: 24 erfolgreiche Java-Tests für Aufgaben, drei eindeutige Antworten, vier Rechenarten und Zahlenräume, Spielablauf, exakte Zeitvorgaben, Forschungspunkte und Boost, Tempoanstieg ab Aufgabe 10 und Obergrenze, serverseitigen Punktefaktor, REST-Validierung, Antwortwiederholung, Highscore-Ränge und dauerhafte H2-Speicherung.
- `node --test src/test/js/music.test.mjs`: sieben erfolgreiche Tests für Standard „aus“, gespeicherte Präferenz ohne Autoplay, Scheduling während des Spiels, Stoppen aller Stimmen und Timer bei Pause, echte `visibilitychange`-Ereignisse, Schutz vor Neustart im versteckten Dokument und Ausschalten mit Speicherung der Präferenz.
- JavaScript-Syntaxprüfung für alle drei Spielmodule.
- Canvas-Smoke-Test mit vier Abmessungen, drei Regionen, allen Bahnen und Anfahrtszuständen, Boost, Sicherheitsstopp und eingefrorener Animationszeit.

## Browser

Die Anwendung wurde im integrierten Browser bei 1.440 × 1.000, 390 × 844 und 320 × 640 Pixeln gespielt. Die Smartphonegrößen sind simulierte Viewports; physische Mobilgeräte wurden nicht verwendet.

| Ablauf | Ergebnis |
| --- | --- |
| Start, gesperrte Ausrüstung, Aufgabe und drei Antworten | Erfolgreich |
| Pfeiltasten, Pfeil nach oben, P und Escape | Erfolgreich |
| Linke/rechte Steuertaste und direkte Antwortwahl | Erfolgreich, Bahnen entsprechen der Reihenfolge der Tore |
| Strömungsboost | Antwort wird vorgezogen, Forschungspunkte bleiben unverändert |
| Smartphone mit 390 Pixeln Breite | Steuertasten 60 × 62 Pixel, Boost 155 × 62 Pixel, vollständig im Sichtbereich |
| Smartphone mit 320 Pixeln Breite | Keine horizontale Überbreite, dreistellige Aufgabe und Antworten lesbar, Steuertasten mindestens 54 × 62 Pixel |
| Tempo und Punktefaktor | Aufgabe 10 und folgende zeigen den steigenden serverseitigen Faktor |
| Regionen | Korallenriff, Canyon ab 2.500 Metern und Tiefsee ab 5.000 Metern erreicht |
| Getrennte Audiotasten | Musik aktiv bei ausgeschalteten Spieleffekten; Pause und Fortsetzen geprüft |
| Falsche Antwort | Sanfter Sicherheitsstopp, korrekte Gleichung, Strecke und Forschungspunkte im Ergebnis |
| Bestenliste | Namen gespeichert, Top-3-Rückmeldung, persönlicher vierter Platz unter den Top 3 |
| Nächste Namenseingabe | Zuletzt gespeicherter Name vorausgefüllt |

Die Sandbox des integrierten Browsers bildet das Verstecken eines Tabs nicht zuverlässig nach. Der Visibility-Schutz wird deshalb zusätzlich über die tatsächlichen Ereignis-Listener in den Audiotests geprüft. Die Vollbildanforderung wurde im Browser ausgelöst; native Vollbilddarstellung und Betriebssystem-Einstellungen für reduzierte Bewegung sollten zusätzlich im Zielbrowser geprüft werden. Der Canvas wurde für eingefrorene Animationszeit geprüft; CSS unterdrückt Bewegungseffekte bei `prefers-reduced-motion`.

Docker ist in dieser Umgebung nicht installiert; der Image-Build wurde nicht ausgeführt.

## Aufnahmen

- [Smartphone-Spiel mit Zahlenraum 1.000](screenshots/mobile-game.jpg)
- [Top 3 und persönlicher Rang](screenshots/mobile-leaderboard.jpg)
- [Desktopansicht](screenshots/desktop.jpg)

Die Testeinträge aus der Browserprüfung gehören nicht zu den ausgelieferten Daten. Die Datenbank wird beim ersten regulären Start frisch angelegt.
