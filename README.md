# SnapClip

SnapClip est un utilitaire Windows de productivité permettant l'extraction ultra-rapide de texte depuis une application source et son injection instantanée dans une application cible, le tout à la souris.

## Fonctionnement

1. **Armer la capture** : cliquez sur « Armer la capture ». Un compte à rebours démarre (délai configurable) pendant lequel vous basculez vers la fenêtre à capturer — la capture cible ainsi la fenêtre *source* et non SnapClip.
2. **Sélectionner** : SnapClip effectue un OCR de la fenêtre au premier plan et affiche des « pins » sur chaque bloc détecté.
   - Cliquez un pin pour copier le bloc entier.
   - Survolez un bloc puis cliquez les pastilles pour sélectionner mot par mot (sélection multi-blocs prise en charge).
3. **Coller** : dans la fenêtre cible, un **double clic droit** ou un **clic long droit** colle le texte à la position du curseur (geste configurable).

Les 8 derniers extraits sont conservés dans un historique ; un clic les recopie dans le presse-papiers.

### Réglages

Accessibles depuis l'écran principal :

- **Délai de capture** : temps laissé pour basculer vers la fenêtre source (immédiat, 1,5 s, 3 s, 5 s).
- **Geste de collage** : double clic droit, clic long droit, ou les deux.
- **Sélection par mot** : active/désactive les pastilles de sélection fine.

## Architecture

- **Framework** : React Native for Windows 0.74 + TypeScript
- **Modules natifs** : Windows Runtime Component C# (`windows/SnapClipNative`)
  - `OcrModule` : capture de fenêtre + OCR Windows (`Windows.Media.Ocr`)
  - `OverlayWindowModule` : positionnement et informations sur les fenêtres
  - `InputHookModule` : hook souris global (`WH_MOUSE_LL`)
  - `ClipboardModule` : presse-papiers + simulation `Ctrl+V`
- **State** : Zustand

## Prérequis

- Windows 10/11
- Node.js 18+
- Visual Studio 2022 avec les workloads :
  - Développement pour la plateforme Windows universelle
  - Développement Desktop C++
- Windows SDK 10.0.19041+

## Installation

```bash
npm install
```

## Lancer l'application

```bash
npm start          # Metro bundler
npx react-native run-windows
```

## Tests

```bash
npm test
```

## Packaging

Le projet génère un package MSIX via le projet UWP `windows/SnapClip`. Le manifeste inclut la capacité `runFullTrust` nécessaire aux hooks souris globaux et à la simulation d'entrée clavier.

## Remarques importantes

- L'application nécessite la capacité `runFullTrust` pour interagir avec d'autres fenêtres Windows.
- Les hooks globaux et la simulation de touches peuvent être bloqués par certains antivirus ou nécessiter une exécution en administrateur.
- Le développement et le débogage nécessitent un environnement Windows complet avec Visual Studio.
- Les coordonnées OCR sont décalées via `OverlayWindowModule.getWindowBounds` pour aligner les pins sur la fenêtre source. L'overlay est actuellement rendu dans la fenêtre de l'application ; un rendu dans une fenêtre transparente *topmost* click-through est le prochain jalon pour une superposition parfaite au-dessus de la fenêtre source.
