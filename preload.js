const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('animeAPI', {
	getAnimes: () => ipcRenderer.invoke('get-animes'),
	addAnime: (anime) => ipcRenderer.invoke('add-anime', anime),
	updateAnime: (anime) => ipcRenderer.invoke('update-anime', anime),
	deleteAnime: (animeId) => ipcRenderer.invoke('delete-anime', animeId),
	selectImage: () => ipcRenderer.invoke('select-image'),
	openLink: (url) => ipcRenderer.invoke("open-link", url),
	versions: {
		node: () => process.versions.node,
		chrome: () => process.versions.chrome,
		electron: () => process.versions.electron
	}
})