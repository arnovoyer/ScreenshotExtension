# Screenshot to Mockup (Firefox Extension)

Eine Firefox-Erweiterung (Manifest V3), die den sichtbaren Bereich eines Tabs als Screenshot aufnimmt und in einem Editor als Mockup gestaltet.

## Funktionen

- Capture des sichtbaren Tab-Bereichs
- Editor in neuem Tab mit Live-Vorschau
- Browser-Frame um den Screenshot:
  - Safari-Style
  - Chrome-Style
  - Kein Frame
- Hintergrundoptionen:
  - Transparent
  - Solide Farbe
  - Farbverlauf
- Weicher Schlagschatten (Intensitaet + Blur)
- Anpassbares Padding
- Export als PNG ueber Download-Button

## Projektstruktur

- `manifest.json`: Firefox-Manifest (MV3), Permissions, Background, Action
- `background.js`: Capture-Logik und Oeffnen des Editor-Tabs
- `popup.html`: Start-UI mit Capture-Button
- `popup.js`: Trigger fuer Screenshot-Capture
- `editor.html`: Editor-UI (Controls + Canvas-Flaeche)
- `editor.js`: Rendering-Logik (Canvas), Styling-Optionen, PNG-Export
- `content.js`: Altbestand aus vorheriger Version (aktuell nicht notwendig fuer den Screenshot-Flow)

## Technischer Ablauf

1. In Popup auf "Screenshot erfassen" klicken.
2. `popup.js` sendet eine `START_CAPTURE`-Message an den Hintergrundprozess.
3. `background.js` nutzt `browser.tabs.captureVisibleTab(...)` und speichert die Bilddaten temporaer in `browser.storage.session` (Fallback: `browser.storage.local`).
4. `background.js` oeffnet `editor.html` mit Capture-ID in der URL.
5. `editor.js` laedt die Bilddaten, rendert das Mockup auf Canvas und entfernt den temporaeren Speicher-Eintrag.
6. Export per `browser.downloads.download(...)` als PNG.

## Installation (Temporar in Firefox)

1. Firefox oeffnen.
2. `about:debugging` aufrufen.
3. "This Firefox" waehlen.
4. Auf "Temporarily Load Add-on..." klicken.
5. Die Datei `manifest.json` aus diesem Projektordner auswaehlen.

## Nutzung

1. Erweiterungs-Popup oeffnen.
2. "Screenshot erfassen" klicken.
3. Im Editor folgende Werte anpassen:
   - Browser-Frame
   - Hintergrund
   - Padding
   - Schlagschatten/Blur
4. "PNG herunterladen" klicken und Speicherort waehlen.

## Wichtige Firefox-Hinweise

- Diese Version ist auf Firefox ausgelegt.
- Im Manifest wird fuer Firefox `background.scripts` verwendet.
- `background.service_worker` kann je nach Firefox-Version oder Konfiguration bei temporaerer Installation fehlschlagen.

## Troubleshooting

### Fehler: "background.service_worker is currently disabled. Add background.scripts."

Loesung:
- In `manifest.json` muss unter `background` die Eigenschaft `scripts` gesetzt sein.
- Beispiel:

```json
"background": {
  "scripts": ["background.js"]
}
```

### Kein Screenshot wird geladen

- Sicherstellen, dass der Capture direkt ueber das Popup gestartet wurde.
- Editor nicht isoliert ohne gueltige Capture-ID oeffnen.
- Erweiterung neu laden in `about:debugging` und erneut testen.

### Download startet nicht

- Pruefen, ob die Permission `downloads` in `manifest.json` gesetzt ist.
- Download-Popup von Firefox erlauben.

## Weiterentwicklungsideen

- Presets (z. B. Product Hunt, Hero Header, Social Preview)
- Zoom/Scale-Control im Editor
- Einfuegen von Text-Overlays und Badges
- Multi-Capture-Historie
- Optionaler Dark-Frame-Mode
