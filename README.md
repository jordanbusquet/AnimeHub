# AnimeHub

AnimeHub est une application de bureau Electron pour suivre les animes et les series regardes, en cours ou a voir.

## Developpement

Prerequis : Node.js et npm.

Depuis le dossier du projet, installe les dependances puis lance l'application :

```powershell
npm install
npm start
```

## Creer l'installateur Windows

Pour generer l'installateur :

```powershell
npm run build
```

Le fichier d'installation est genere dans `dist/` (par exemple `AnimeHub Setup 1.0.0.exe`). Lance cet installateur pour installer l'application. Le dossier `dist/` est ignore par Git : les installateurs ne sont pas inclus dans le depot.

## Donnees de l'application

AnimeHub cree automatiquement une liste vide (`anime.json`) et un dossier `images/` dans son dossier de donnees utilisateur au premier lancement. Les dossiers `data/` et `images/` a la racine du projet ne sont donc pas necessaires pour cloner, lancer ou compiler l'application. Les images choisies dans l'application sont copiees dans ce dossier utilisateur.

Sous Windows, les donnees de la version installee se trouvent dans `%APPDATA%\\AnimeHub`. En mode developpement, elles se trouvent generalement dans `%APPDATA%\\animehub`. Ces donnees sont locales a l'ordinateur et ne sont pas versionnees dans Git.
