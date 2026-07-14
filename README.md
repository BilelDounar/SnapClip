# SnapClip

**SnapClip** est un utilitaire de productivité **multi-plateforme** (Windows, macOS, Linux) pensé pour une seule chose : **capturer, copier et coller du texte le plus vite possible — entièrement à la souris**, sans raccourci clavier. Il vit dans la barre système (à côté de l'horloge) et s'active en un clic.

## Idée

1. **Armer** la capture (clic sur l'icône de la barre système, ou depuis la fenêtre).
2. Un court compte à rebours vous laisse **basculer vers la fenêtre source**.
3. SnapClip prend un instantané de cette fenêtre, l'analyse par **OCR** et affiche des « pins » sur chaque bloc de texte.
   - **Clic sur un pin** → le bloc entier est copié.
   - **Survol d'un bloc puis clic sur les pastilles** → sélection fine, mot par mot (multi-blocs pris en charge).
4. Dans la fenêtre cible, un **double clic droit** ou un **clic long droit** colle le texte au curseur.

Tout se fait au pointeur. Les 8 derniers extraits sont conservés et re-copiables d'un clic.

## Architecture

- **Frontend** : React + TypeScript + Vite (deux fenêtres : le panneau de contrôle et l'overlay transparent).
- **Backend** : [Tauri 2](https://tauri.app) (Rust) — binaire léger, barre système native, fenêtres transparentes.
- **État** : Zustand (réglages persistés localement).
- **Modules natifs Rust** (cross-platform) :
  - Capture de fenêtre : [`xcap`](https://crates.io/crates/xcap)
  - OCR : [`rusty-tesseract`](https://crates.io/crates/rusty-tesseract) (moteur Tesseract, boîtes au niveau du mot)
  - Simulation de collage : [`enigo`](https://crates.io/crates/enigo) (Ctrl+V / Cmd+V)
  - Écoute souris globale (geste de collage) : [`rdev`](https://crates.io/crates/rdev)

## Prérequis

- Node.js 18+
- Rust (stable) et Cargo
- **Tesseract OCR** installé et dans le `PATH` :
  - Windows : [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
  - macOS : `brew install tesseract`
  - Linux : `sudo apt install tesseract-ocr`
- Dépendances système Linux (build) : `libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libxdo-dev libxi-dev libxtst-dev libpipewire-0.3-dev libdbus-1-dev`

## Développement

```bash
npm install
npm run tauri dev      # lance l'app de bureau (Vite + Tauri)
```

Frontend seul (dans le navigateur, sans capture native) :

```bash
npm run dev
```

## Qualité

```bash
npm run lint           # ESLint
npx tsc --noEmit       # typage
npm test               # Vitest (logique de sélection, stores, réglages)
```

## Build

```bash
npx tauri icon src-tauri/app-icon.png   # génère les icônes (ico/icns/png)
npm run tauri build                      # binaire + installeurs de la plateforme
```

La CI compile le frontend puis l'application sur **Ubuntu, macOS et Windows**.

## Réglages

- **Délai de capture** : temps pour basculer vers la source (immédiat, 1,5 s, 3 s, 5 s).
- **Geste de collage** : double clic droit, clic long droit, ou les deux.
- **Sélection par mot** : active/désactive les pastilles fines.
- **Rester dans la barre système** : garde SnapClip actif à la fermeture de la fenêtre.

## Remarques

- **Permissions** : l'écoute souris globale et la simulation de collage nécessitent, selon l'OS, des autorisations d'accessibilité (macOS : Réglages → Confidentialité → Accessibilité) ou une session X11/Wayland compatible (Linux).
- **OCR hors-ligne** : aucun texte n'est envoyé sur le réseau ; la reconnaissance est locale.
- **Overlay** : la fenêtre d'overlay est transparente, sans bordure et toujours au premier plan ; les coordonnées OCR sont décalées par les bornes de la fenêtre source (`xcap`) pour aligner les pins. Le passage en click-through par-zone reste un axe d'amélioration selon les plateformes.
