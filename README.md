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

## Fonctionnement

1. **Activer** SnapClip, puis basculer vers la fenêtre source.
2. SnapClip capture la fenêtre au premier plan et lance l'OCR
   (`Windows.Media.Ocr`) pour en extraire des blocs de texte positionnés.
3. L'overlay affiche un *pin* par bloc :
   - clic sur un pin → copie le bloc entier ;
   - survol d'un bloc → points par mot, clic pour sélectionner mot à mot
     (un deuxième clic ferme l'intervalle et copie la sélection).
4. **Coller** dans la fenêtre cible : `double clic droit` ou `clic long droit`
   simule `Ctrl+V`.

Le collage est **armé** : le hook souris global n'injecte `Ctrl+V` que si un
texte a effectivement été copié via SnapClip pendant la session. Sans ce garde,
chaque double/long clic droit ailleurs sous Windows déclencherait un collage
parasite.

> **Limitation connue** : l'overlay est rendu dans la fenêtre de l'application
> aux coordonnées OCR de la fenêtre source. L'alignement suppose que la fenêtre
> SnapClip couvre la zone capturée (fenêtre transparente plein écran). Un
> overlay natif topmost transparent est la prochaine évolution.

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
