# Spielgrafiken

Die Spielgrafiken wurden am 18. Oktober 2026 mit dem integrierten OpenAI-Bildgenerator über die imagegen-Skill erzeugt. Es wurden keine externen Bildquellen oder API-Schlüssel verwendet. Beide finalen PNG-Dateien befinden sich im Projekt und benötigen zur Laufzeit keinen externen Bilddienst.

| Datei | Verwendung | Format |
| --- | --- | --- |
| `src/main/resources/static/images/ocean-world.png` | Unterwasserwelt mit Korallen, Lichtstrahlen und Ruinen; zentrale Wasserfläche für das Spiel | PNG, 1672 × 941 Pixel |
| `src/main/resources/static/images/explorer.png` | Forscherin mit Tauchausrüstung und Unterwasserscooter | PNG mit echtem Alphakanal, 1201 × 1309 Pixel |

Die Grafiken wurden visuell auf vollständige Motive, einheitliche Farbwirkung, fehlende Texte und Eignung für den vorgesehenen Einsatz geprüft. Der Alphakanal der Forscherin wurde zusätzlich über die Bildmetadaten und einen transparenten Eckpixel geprüft. Die Originalausgaben des Bildgenerators blieben erhalten.

## Prompt für die Unterwasserwelt

```text
Use case: stylized-concept. Asset type: wide landscape background artwork for a polished premium underwater exploration math racing browser game. Primary request: immersive underwater reef and canyon panorama, rich painterly hand-painted modern adventure game concept art, production quality environmental illustration. Scene: deep clear tropical ocean, visible surface high above with magnificent shafts of turquoise sunlight penetrating into a navy and petrol canyon; coral ledges and rocks at left and right foreground, warm orange and golden corals, a few violet anemones, distant submerged ancient research station ruins and an arch in the middle distance. Small believable distant turtles, a manta ray and schools of silver fish as supporting ocean life. Composition: very wide landscape approximately 16:9, camera looking ahead and very slightly down along an open underwater route, strong depth with atmospheric perspective. Keep central and lower central 60 percent relatively open blue water, dark enough for bright game objects to be overlaid later. Strong visual interest along sides and upper third, beautiful cinematic light, luminous particles, polished illustration with painterly edges and material detail, sophisticated navy/petrol/turquoise palette with measured coral orange, warm yellow, violet accents. Constraints: this is only environmental artwork, no user interface, no track or lane markings, no labels, no typography, no logo, no watermark, no text, no human, no diver, no player character, no visual borders.
```

## Prompt für die Forscherin

```text
Use case: stylized-concept. Asset type: isolated game character sprite on genuinely transparent alpha background for an underwater adventure game. Primary request: a competent athletic young girl ocean researcher, approximately 10 to 12 years old, in a practical fully covering dark teal wetsuit and orange/yellow compact scuba tank kit. Short dark hair, practical diving mask and goggles, fins. She grips a sleek teal-and-yellow underwater scooter with both hands in front of her and is swimming confidently forward and slightly upward, heading away from viewer. Rear three-quarter view from slightly above and behind, entire figure including both long fins, head, both arms, tank and the entire scooter visible, clear recognizable silhouette. Body angled diagonally bottom-left toward top-right, but keep a compact vertical sprite composition with generous transparent padding on all sides. The scooter is a small streamlined submarine propulsion device with a yellow cylindrical motor housing and two handles, clear engineering, no blades exposed. Style: premium polished hand-painted adventure game character illustration, charming capable and realistic proportions for her age, richly painted materials, subtle turquoise underwater rim light, dark navy teal and warm orange yellow accents, painterly detail, strong contrast. This character will be composited over a dark blue underwater reef scene. Constraints: transparent background with actual alpha, no scenery, no seabed, no water rectangle, no checkerboard, no bubbles beyond silhouette, no shadow plane, no text, no watermark, no logo, no interface. Fully clothed modest practical diving gear, only one person, only two arms, only two legs, anatomically correct hands and limbs.
```
