// Importation des modules
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

// Emplacement du fichier JSON et du dossier d'images
const userDataPath = app.getPath("userData");
const dataPath = path.join(userDataPath, "anime.json");
const imagesDir = path.join(userDataPath, "images");

// Création de la fenêtre
function createWindow() {
	const win = new BrowserWindow({
		width: 1080,
		height: 700,
		minWidth: 900,
		minHeight: 700,
		icon: path.join(__dirname, 'assets', 'logo.png'),
		autoHideMenuBar: true,

		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			devTools: true
		}
	})

	win.loadFile(path.join(__dirname, 'src', 'index.html'))
}

function initDatabase() {

	if (!fs.existsSync(userDataPath)) {
		fs.mkdirSync(userDataPath, { recursive: true });
	}

	if (!fs.existsSync(imagesDir)) {
		fs.mkdirSync(imagesDir, { recursive: true });
	}

	if (!fs.existsSync(dataPath)) {

		const defaultFile = path.join(
			__dirname,
			"data",
			"anime.json"
		);

		fs.copyFileSync(defaultFile, dataPath);

	}

}

function initAnimeFile() {

    const userDataPath = app.getPath("userData");
    const userAnimeFile = path.join(userDataPath, "anime.json");

    if (!fs.existsSync(userAnimeFile)) {

        const defaultFile = path.join(
            __dirname,
            "data",
            "anime.json"
        );

        fs.copyFileSync(defaultFile, userAnimeFile);

    }

}

function readAnimes() {
	initDatabase()

	try {
		const data = fs.readFileSync(dataPath, 'utf8')
		return JSON.parse(data)
	} catch (error) {
		console.error('Impossible de lire anime.json :', error)
		return []
	}
}

function writeAnimes(animes) {
	initDatabase()
	fs.writeFileSync(dataPath, JSON.stringify(animes, null, 4), 'utf8')
}

ipcMain.handle('get-animes', () => readAnimes())

ipcMain.handle('add-anime', (_event, anime) => {
	const animes = readAnimes()
	const newAnime = {
		id: anime.id || Date.now(),
		title: anime.title || 'Sans titre',
		image: anime.image || '',
		description: anime.description || '',
		season: anime.season || '',
		episodes: anime.episodes || '',
		status: anime.status || 'À voir',
		scan: anime.scan || '',
		linkAnime: anime.linkAnime || '',
		linkScans: anime.linkScans || '',
	}

	animes.push(newAnime)
	writeAnimes(animes)
	return animes
})

ipcMain.handle('update-anime', (_event, anime) => {
	const animes = readAnimes()
	const index = animes.findIndex((item) => item.id === anime.id)

	if (index !== -1) {
		animes[index] = {
			...animes[index],
			...anime,
			title: anime.title || 'Sans titre',
			image: anime.image || '',
			description: anime.description || '',
			season: anime.season || '',
			episodes: anime.episodes || '',
			status: anime.status || 'À voir',
			scan: anime.scan || '',
			linkAnime: anime.linkAnime || '',
			linkScans: anime.linkScans || '',
		}
		writeAnimes(animes)
	}

	return animes
})

ipcMain.handle('delete-anime', (_event, animeId) => {
	const animes = readAnimes().filter((anime) => anime.id !== animeId)
	writeAnimes(animes)
	return animes
})

ipcMain.handle('select-image', async () => {
	const result = await dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }]
	})

	if (result.canceled || result.filePaths.length === 0) {
		return null
	}

	const sourcePath = result.filePaths[0]
	const fileName = path.basename(sourcePath)
	const destinationPath = path.join(imagesDir, fileName)

	if (sourcePath !== destinationPath) {
		fs.copyFileSync(sourcePath, destinationPath)
	}

	return destinationPath
})

app.whenReady().then(() => {
	initAnimeFile();
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})


ipcMain.handle("open-link", (event, url) => {
    shell.openExternal(url);
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})