# SnapClip

SnapClip est un utilitaire Windows de productivité permettant l'extraction ultra-rapide de texte depuis une application source et son injection instantanée dans une application cible, le tout à la souris.

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
