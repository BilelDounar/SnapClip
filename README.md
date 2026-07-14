<div align="center">
  <img src="src-tauri/icons/icon.png" alt="SnapClip" width="104" height="104" />

  <h1>SnapClip</h1>

  <p><strong>Capturer, copier et coller du texte — entièrement à la souris.</strong></p>

  <p>Un utilitaire de barre système minimaliste et moderne, pour Windows, macOS et Linux.</p>
</div>

---

SnapClip vit dans la barre système (à côté de l'horloge) et s'active en un clic. Il prend un instantané de la fenêtre de votre choix, en extrait le texte par **OCR**, et vous laisse copier ce que vous voulez au pointeur — puis coller n'importe où d'un simple geste de souris. **Aucun raccourci clavier requis.**

## ✨ Fonctionnalités

- 🖱️ **100 % souris** — armer, sélectionner, copier et coller sans toucher au clavier.
- 🔍 **OCR local** — reconnaissance de texte hors-ligne (aucune donnée envoyée sur le réseau).
- 🎯 **Sélection fine** — un bloc entier d'un clic, ou mot par mot (sélection multi-blocs).
- 🧲 **Barre système** — toujours à portée, se replie au lieu de se fermer.
- 🖥️ **Multi-plateforme** — Windows, macOS et Linux depuis une seule base de code.
- 🕘 **Historique** — les 8 derniers extraits, re-copiables d'un clic.
- 🌗 **Thème clair/sombre** automatique et réglages persistés.

## 🚀 Le flux

1. **Armer** la capture — clic sur l'icône de la barre système (ou le bouton de la fenêtre).
2. Un court **compte à rebours** vous laisse basculer vers la fenêtre source.
3. SnapClip capture la fenêtre, l'analyse par OCR et affiche des **« pins »** sur chaque bloc :
   - **clic sur un pin** → le bloc entier est copié ;
   - **survol d'un bloc puis clic sur les pastilles** → sélection mot par mot.
4. Dans la fenêtre cible : **double clic droit** ou **clic long droit** → collage au curseur.

## 🏗️ Architecture

| Couche | Technologie |
| --- | --- |
| Interface | React + TypeScript + [Vite](https://vitejs.dev) |
| Application de bureau | [Tauri 2](https://tauri.app) (Rust) — barre système, fenêtres transparentes |
| État | [Zustand](https://github.com/pmndrs/zustand) (réglages persistés) |
| Capture de fenêtre | [`xcap`](https://crates.io/crates/xcap) |
| OCR | [`rusty-tesseract`](https://crates.io/crates/rusty-tesseract) (moteur Tesseract, boîtes au mot) |
| Collage (Ctrl/Cmd+V) | [`enigo`](https://crates.io/crates/enigo) |
| Geste souris global | [`rdev`](https://crates.io/crates/rdev) |

L'application ouvre deux fenêtres : le **panneau de contrôle** (`index.html`) et un **overlay** transparent, sans bordure et toujours au premier plan (`overlay.html`), qui affiche les pins par-dessus la fenêtre source.

### Arborescence

```
SnapClip/
├── index.html / overlay.html      # points d'entrée des deux fenêtres
├── src/                           # frontend (React + TS)
│   ├── App.tsx                    # panneau de contrôle
│   ├── components/                # Overlay, réglages, historique
│   ├── lib/                       # sélection (pure, testée) + pont Tauri
│   ├── store/                     # stores Zustand (état + réglages)
│   ├── types.ts                   # types OCR partagés
│   └── styles.css                 # design minimaliste (clair/sombre)
└── src-tauri/                     # backend (Rust / Tauri)
    ├── src/
    │   ├── lib.rs                 # commandes, barre système, cycle de vie
    │   ├── capture.rs             # capture de la fenêtre focus (xcap)
    │   ├── ocr.rs                 # OCR → blocs/mots (rusty-tesseract)
    │   └── input.rs               # collage + geste souris global
    ├── tauri.conf.json            # config des fenêtres et du bundle
    └── icons/                     # icônes de l'application
```

## 📋 Prérequis

- **Node.js** 18+
- **Rust** (stable) et Cargo
- **Tesseract OCR** installé et dans le `PATH` :
  - Windows — [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
  - macOS — `brew install tesseract`
  - Linux — `sudo apt install tesseract-ocr`
- **Dépendances système Linux** (pour compiler) :
  ```bash
  sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
    librsvg2-dev libxdo-dev libxi-dev libxtst-dev libpipewire-0.3-dev libdbus-1-dev
  ```

## 🛠️ Développement

```bash
npm install
npm run tauri dev      # lance l'application de bureau (Vite + Tauri)
```

Aperçu du frontend seul, dans le navigateur (sans capture native) :

```bash
npm run dev
```

## ✅ Qualité

```bash
npm run lint           # ESLint
npx tsc --noEmit       # vérification de types
npm test               # Vitest (sélection, stores, réglages)
```

Côté Rust : `cd src-tauri && cargo check`.

## 📦 Build

```bash
npx tauri icon src-tauri/app-icon.png   # (re)génère les icônes ico/icns/png
npm run tauri build                      # binaire + installeurs de la plateforme
```

L'[intégration continue](.github/workflows/ci.yml) vérifie le frontend puis compile l'application sur **Ubuntu, macOS et Windows**.

## ⚙️ Réglages

| Réglage | Description |
| --- | --- |
| Délai de capture | Temps pour basculer vers la source (immédiat, 1,5 s, 3 s, 5 s) |
| Geste de collage | Double clic droit, clic long droit, ou les deux |
| Sélection par mot | Active/désactive les pastilles fines |
| Rester dans la barre système | Garde SnapClip actif à la fermeture de la fenêtre |

## 🔐 Permissions & confidentialité

- L'**écoute souris globale** et la **simulation de collage** requièrent, selon l'OS, des autorisations d'accessibilité (macOS : *Réglages → Confidentialité et sécurité → Accessibilité*) ou une session X11/Wayland compatible (Linux).
- **OCR hors-ligne** : la reconnaissance est effectuée localement, aucun texte n'est transmis sur le réseau.

## 🗺️ Feuille de route

- [ ] Overlay *click-through* par-zone (laisser passer les clics hors des pins) selon les plateformes.
- [ ] Activation par geste souris global configurable (sans passer par la barre système).
- [ ] Choix de la langue OCR dans les réglages.
- [ ] Installeurs signés et publication des artefacts de release.

## 📄 Licence

Projet personnel — licence à définir.
