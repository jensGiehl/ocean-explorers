# Ocean Explorers – Geheimnis der Tiefsee

**Drei Strömungen. Eine Lösung. Deine Expedition.**

Ein vollständig spielbares Kopfrechenabenteuer für Kinder um zehn Jahre, entstanden auf Grundlage von „Mathe-Rally“. Eine junge Meeresforscherin folgt mit ihrem Unterwasserscooter den Spuren einer verschollenen Forschungsstation. Drei Strömungsbahnen führen durch Korallenriffe, einen geheimnisvollen Canyon und eine leuchtende Tiefsee. Wähle das Forschungstor mit der richtigen Antwort und sammle Forschungspunkte. Das nächste Geheimnis liegt tiefer.

## Spielen und steuern

1. Wähle eine oder mehrere Rechenarten, einen Zahlenraum und dein Starttempo.
2. Wähle **Expedition starten** und steuere auf die Bahn mit der richtigen Lösung.
3. Nutze den **Strömungsboost**, sobald du sicher bist: Er überspringt die Anfahrt ohne Punkteabzug.
4. Bei einer falschen Antwort bremst das Sicherheitssystem den Scooter sanft ab. Die Ergebnisansicht zeigt Aufgabe, richtige Lösung, Strecke und Forschungspunkte.
5. Speichere dein Ergebnis unter einem Namen und starte den nächsten Tauchgang.

| Steuerung | Aktion |
| --- | --- |
| Pfeil links / rechts | Eine Strömungsbahn nach links / rechts wechseln |
| Pfeil nach oben | Strömungsboost auslösen |
| P oder Escape | Expedition pausieren / fortsetzen |
| Große Bildschirmtasten | Spurwechsel und Strömungsboost auf Smartphone und Tablet |
| Pause | Spiel anhalten und fortsetzen |
| Vollbild | Vollbildansicht öffnen / schließen, sofern vom Browser unterstützt |
| Spieleffekte | Spieleffekte unabhängig von der Musik schalten |
| Hintergrundmusik | Ruhige Unterwasserklänge zuschalten |

Die Oberfläche ist auf kleine Displays und die Bedienung mit den Daumen ausgelegt. Aufgaben und die drei Antworten bleiben kontrastreich über der perspektivischen Unterwasserwelt sichtbar. Die Route führt vom Korallenriff ab 2.500 Metern in den Unterwasser-Canyon und ab 5.000 Metern in die leuchtende Tiefsee. Kurze Entdeckungen begleiten die Expedition.

Die Hintergrundmusik ist standardmäßig ausgeschaltet und lässt sich getrennt von den Spieleffekten in der Vorbereitung und direkt im Spiel schalten. Die Auswahl wird auf dem Gerät gespeichert. Ruhige, synthetisch erzeugte Unterwasserklänge entstehen lokal mit Web Audio; Musikdownloads oder externe Dienste sind nicht erforderlich. Die Musik pausiert bei einer Spielpause und beim Wechsel in einen anderen Browser-Tab und endet mit der Expedition. Der Browser benötigt dafür zunächst eine Interaktion mit der Seite. Die Einstellung für reduzierte Bewegung des Betriebssystems wird berücksichtigt.

## Aufgaben, Tempo und Forschungspunkte

- Addition und Subtraktion in den Zahlenräumen bis **20**, **100** oder **1.000**.
- Subtraktion ohne negative Ergebnisse.
- Kleines Einmaleins mit Faktoren von **1 bis 10**.
- Division als Umkehraufgabe zum kleinen Einmaleins, ohne Rest und ohne Division durch null.
- Mehrere Rechenarten gleichzeitig auswählbar.
- Immer genau drei unterschiedliche Antwortmöglichkeiten und genau eine richtige Lösung.

Aufgabenerstellung, Antwortprüfung und Punkteberechnung erfolgen auf dem Server. Der Browser übermittelt die gewählte Bahn und die Aufgabennummer, keinen frei wählbaren Punktestand.

| Starttempo | Anfängliche Zeit je Aufgabe | Punktefaktor |
| --- | --- | --- |
| Entspannt | 10 Sekunden | × 1 |
| Normal | 8 Sekunden | × 1,5 |
| Schnell | 6 Sekunden | × 2 |

Eine richtige Antwort bringt **250 Meter**, das abschließende Abbremsen **200 Meter**. Für jede Antwort werden `Meter × Punktefaktor × Tempofaktor` auf ganze Forschungspunkte gerundet und zum Ergebnis addiert. Auf „Normal“ bringt eine richtige Antwort zu Beginn beispielsweise 375 Forschungspunkte, die abschließende Antwort 300.

Der Tempofaktor ist für die ersten neun Aufgaben 1. Ab Aufgabe 10 steigt er je Aufgabe um 0,025 bis höchstens 2, erreicht bei Aufgabe 49. Die Anfahrtszeit wird durch diesen Faktor geteilt. Der Strömungsboost verändert weder Punkte noch Strecke. Die mathematischen Regeln, Zeiten und Punkte entsprechen der vorhandenen Anwendung.

Der im Tauchcomputer angezeigte Punktefaktor kombiniert Starttempo und Tempofaktor. Er wird auf dem Server berechnet.

Die Bestenliste zeigt die **Top 3** und zusätzlich deinen eigenen Rang, falls du weiter unten liegst. Ein Top-3-Ergebnis erhält drei Sekunden lang aufsteigendes Blasenkonfetti; bei reduzierter Bewegung entfällt dieser Effekt. Der zuletzt verwendete Name wird für ein Jahr in einem Cookie auf diesem Gerät gespeichert und beim nächsten Eintragen vorausgefüllt. Eine Anmeldung ist nicht erforderlich.

## Lokal starten

Voraussetzung ist ein **JDK 27**, die zum Umsetzungszeitpunkt aktuelle stabile Java-Version. Maven 3.9.16 wird über den mitgelieferten Maven Wrapper geladen; eine separate Maven-Installation ist nicht nötig. Der erste Build benötigt eine Internetverbindung. Danach werden Schriftarten, Grafiken und Bootstrap lokal ausgeliefert, ohne CDN-Anfragen.

Prüfe die aktive Java-Version mit `java -version`. Falls mehrere JDKs installiert sind, setze `JAVA_HOME` auf dein JDK-27-Verzeichnis und ergänze dessen `bin`-Ordner am Anfang von `PATH`. Unter PowerShell beispielsweise, mit angepasstem Pfad:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-27'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

Windows / PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Linux / macOS:

```bash
chmod +x mvnw
./mvnw spring-boot:run
```

Öffne anschließend [http://localhost:8080](http://localhost:8080).

Tests ausführen und die ausführbare JAR-Datei erstellen:

```powershell
.\mvnw.cmd clean verify
```

Unter Linux / macOS lautet der Befehl `./mvnw clean verify`. Die Anwendung anschließend starten:

```bash
java -jar target/ocean-explorers-1.0.0.jar
```

## Daten und Konfiguration

Die eingebettete H2-Datenbank speichert Highscores dauerhaft in `./data/ocean-explorers.mv.db`. Das Verzeichnis wird bei Bedarf angelegt. Laufende Expeditionen liegen im Arbeitsspeicher; ein Neustart beendet sie. Bereits gespeicherte Highscores bleiben erhalten. Eine Spielsession läuft zwei Stunden nach der letzten Antwort ab.

| Umgebungsvariable | Standard | Bedeutung |
| --- | --- | --- |
| `PORT` | `8080` | HTTP-Port der Anwendung |
| `OCEAN_EXPLORERS_DATA_DIR` | `./data` | Verzeichnis der H2-Datenbank |
| `OCEAN_EXPLORERS_DB_PASSWORD` | leer | Passwort der eingebetteten Datenbank |

Wenn ein Datenbankpasswort gesetzt wurde, muss beim nächsten Start derselben Datenbank dasselbe Passwort verwendet werden. Im Container liegt das Standardverzeichnis unter `/app/data`.

Ein Name besteht aus 1 bis 24 Zeichen. Erlaubt sind Buchstaben, Ziffern, Leerzeichen sowie `.`, `_`, `'`, `−` und `-`. Ein Ergebnis lässt sich pro Expedition einmal speichern. Bei Punktegleichstand entscheiden gelöste Aufgaben, Strecke und danach der frühere Eintrag über die Reihenfolge. Wiederholte Übertragungen einer Antwort mit derselben Aufgabennummer vergeben keine doppelten Punkte.

## Docker

Der mehrstufige Docker-Build kompiliert und testet mit JDK 27. Das fertige Image enthält eine Java-27-Laufzeit und startet mit UID/GID `10001`. Auf dem Host genügt Docker; Java und Maven müssen dort nicht installiert sein.

### Image lokal bauen

```bash
docker build --pull -t ocean-explorers:local .
docker run -d --name ocean-explorers --pull=never -p 8089:8080 -v ocean-explorers-data:/app/data ocean-explorers:local
```

Das Spiel ist unter [http://localhost:8089](http://localhost:8089) erreichbar. **8089 ist der Port am Host, 8080 der Port im Container.** Das benannte Volume `ocean-explorers-data` enthält die Datenbank und bewahrt Highscores auch beim Ersetzen des Containers auf.

### Veröffentlichtes Image starten oder aktualisieren

Die Registry-Adresse `ghcr.io/dein-name/ocean-explorers:latest` ist ein **anzupassender Platzhalter**. Es wird kein bereits veröffentlichtes Image vorausgesetzt. Veröffentliche dein Image beispielsweise nach der Anmeldung bei deiner Registry:

```bash
docker build -t ghcr.io/dein-name/ocean-explorers:latest .
docker push ghcr.io/dein-name/ocean-explorers:latest
```

Dieses Bash-Skript lädt beim Start die aktuelle veröffentlichte Version:

```bash
IMAGE=ghcr.io/dein-name/ocean-explorers:latest

docker rm -f ocean-explorers 2>/dev/null

docker run -d \
  --name ocean-explorers \
  --pull=always \
  -p 8089:8080 \
  -v ocean-explorers-data:/app/data \
  "$IMAGE"
```

Auch hier ist **8089 der Host-Port und 8080 der Container-Port**. Das Volume bleibt beim Entfernen des Containers erhalten. `--pull=always` benötigt ein tatsächlich veröffentlichtes Image. Das lokal gebaute Image verwendest du mit dem vorherigen Beispiel und `--pull=never`.

### Datenbank in einen Host-Ordner einbinden

Alternativ zum benannten Volume lässt sich ein Host-Ordner nach `/app/data` einbinden. Er muss für UID/GID `10001` schreibbar sein.

Linux:

```bash
mkdir -p data
sudo chown 10001:10001 data
docker run -d --name ocean-explorers --pull=never -p 8089:8080 --mount "type=bind,source=$(pwd)/data,target=/app/data" ocean-explorers:local
```

Windows / PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path .\data | Out-Null
docker run -d --name ocean-explorers --pull=never -p 8089:8080 --mount "type=bind,source=$PWD/data,target=/app/data" ocean-explorers:local
```

Verwende jeweils nur einen Container mit derselben eingebetteten Datenbank. Stoppe für ein Backup den Container und sichere den Inhalt des Volumes oder Host-Ordners. Weitere Ein- oder Ausgabeordner werden nicht verwendet; zusätzliche Mounts sind daher nicht nötig.

## Technik und Tests

- Java 27, Maven Wrapper und durchgehend UTF-8.
- Spring Boot 4.1.1 mit deaktiviertem Spring-Boot-Banner.
- Basispaket `de.agiehl`, objektorientierter Java-Code und unveränderliche Records für Spielzustände.
- Bootstrap 5.3.8 als WebJar.
- HTML, CSS und JavaScript mit Canvas; kein Node-Build erforderlich.
- Lokal gebündelte Schriften DM Sans und Outfit mit beiliegenden OFL-Lizenzen.
- Lokal gebündelte Illustrationen mit dokumentierter Herkunft und Erzeugungsprompts in [docs/art-assets.md](docs/art-assets.md).
- Eingebettete H2-Datenbank für Highscores.

`./mvnw verify` prüft die vier Aufgabentypen und Zahlenräume, eindeutige Antwortmöglichkeiten, Spielende, Forschungspunkte, unveränderte Boost-Punkte, Startzeiten, Tempoanstieg und dessen Obergrenze. Die Tests prüfen außerdem API-Eingabevalidierung, wiederholbare Antworten ohne doppelte Punkte, einmalige Ergebnisspeicherung, Highscore-Sortierung, eigenen Rang und Datenbank-Persistenz nach erneutem Öffnen.

Die 24 Java-Tests laufen beim Maven-Build. Sieben zusätzliche Audiotests lassen sich optional mit Node.js ausführen; Node wird für das Bauen und Spielen nicht benötigt:

```bash
node --test src/test/js/music.test.mjs
```

Die Browserprüfung umfasste Desktop mit 1.440 × 1.000 Pixeln sowie Smartphoneansichten mit 390 × 844 und 320 × 640 Pixeln. Geprüft wurden Tastatursteuerung, große Steuertasten, direkte Antwortwahl, Boost, Pause und Fortsetzen, Aufgaben im Zahlenraum 1.000, getrennte Audiotasten, eine Expedition bis über 5.000 Meter, sichere Rückkehr, Speichern, Namensvorausfüllung sowie Top 3 und eigener Rang darunter. Prüfdetails und Aufnahmen stehen in [docs/testing.md](docs/testing.md).

Die Punkteberechnung erfolgt auf dem Server. Antwortzeiten werden dort nicht erzwungen; die Bestenliste ist für ein gemeinsames Lernspiel gedacht und bietet keinen Schutz vor automatisiertem Spielen. Der Docker-Build ist vorbereitet, wurde in dieser Umgebung ohne installierte Docker-Engine jedoch nicht ausgeführt.
