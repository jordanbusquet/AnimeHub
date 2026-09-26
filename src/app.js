let animes = [];
let editMode = false;
let currentAnimeId = null;
let selectedAnimeId = null;
let searchQuery = '';
let sortMode = 'title-asc';
let currentStatus = 'À voir';

console.log("app.js chargé");

function getImageSrc(image) {
	if (!image) {
		return 'https://placehold.co/400x600?text=Anime';
	}

	if (/^https?:\/\//i.test(image) || image.startsWith('data:')) {
		return image;
	}

	if (image.startsWith('file://')) {
		return image;
	}

	const normalizedPath = image.replace(/\\/g, '/');
	return `file://${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
}

function getDisplayTitle(title) {
	const safeTitle = title ? String(title).trim() : 'Sans titre';
	return safeTitle.length > 30 ? `${safeTitle.slice(0, 27)}...` : safeTitle;
}

function getDisplayDescription(description) {
	return description ? String(description).trim() : 'Aucune description disponible.';
}

function getSafeSeasonValue(value) {
	const normalizedValue = String(value ?? '').trim();
	const numericValue = Number.parseInt(normalizedValue, 10);
	if (Number.isNaN(numericValue) || numericValue < 1) {
		return '1';
	}
	return String(Math.min(numericValue, 9999));
}

function getSafeEpisodesValue(value) {
	const normalizedValue = String(value ?? '').trim();
	const numericValue = Number.parseInt(normalizedValue, 10);
	if (Number.isNaN(numericValue) || numericValue < 1) {
		return '1';
	}
	return String(Math.min(numericValue, 9999));
}

function getSafeScanValue(value) {
	const normalizedValue = String(value ?? '').trim();
	const numericValue = Number.parseInt(normalizedValue, 10);
	if (Number.isNaN(numericValue) || numericValue < 1) {
		return '1';
	}
	return String(Math.min(numericValue, 9999));
}

function focusTitleField() {
	const titleInput = document.getElementById('title');
	if (titleInput) {
		setTimeout(() => titleInput.focus(), 50);
	}
}

function setupWheelControls() {
	const numericFields = ['season', 'episodes', 'scan'];

	numericFields.forEach((fieldId) => {
		const input = document.getElementById(fieldId);
		if (!input) {
			return;
		}

		input.addEventListener('wheel', (event) => {
			if (document.activeElement !== input) {
				return;
			}

			event.preventDefault();
			const currentValue = Number.parseInt(input.value, 10) || 1;
			const delta = event.deltaY < 0 ? 1 : -1;
			const nextValue = Math.max(1, currentValue + delta);
			input.value = String(nextValue);
		}, { passive: false });
	});
}

function getStatusClass(status) {
	const normalizedStatus = (status || '').toLowerCase();

	if (normalizedStatus.includes('cours')) {
		return 'status-orange';
	}

	if (normalizedStatus.includes('termin')) {
		return 'status-green';
	}

	return 'status-red';
}

async function loadAnime() {
	try {
		animes = await window.animeAPI.getAnimes();
		displayAnime();
	} catch (error) {
		console.error('Erreur lors du chargement des animes :', error);
	}
}

function showAnimeDetails(animeId) {
	selectedAnimeId = Number(animeId);
	const anime = animes.find((item) => item.id === selectedAnimeId);
	const container = document.getElementById('anime-list');
	if (!anime) {
		return;
	}

	const seasonValue = getSafeSeasonValue(anime.season);
	const episodesValue = getSafeEpisodesValue(anime.episodes);
	const scanValue = getSafeScanValue(anime.scan);
	const description = getDisplayDescription(anime.description);
	const statusText = anime.status || 'À voir';
	const statusClass = getStatusClass(anime.status);

	container.innerHTML = `
		<div class="anime-detail-card">
			<button class="back-btn" type="button">← Retour à la bibliothèque</button>
			<div class="anime-detail-content">
				<img src="${getImageSrc(anime.image)}" alt="${anime.title}">
				<div class="anime-detail-info">
					<div class="detail-title-row">
						<h3 title="${anime.title || 'Sans titre'}">${getDisplayTitle(anime.title)}</h3>
						<span class="status-pill ${statusClass}">${statusText}</span>
					</div>
					<p class="detail-description">${description}</p>
					<div class="detail-meta">
						<span class="detail-meta-item">Saison : ${seasonValue}</span>
						<span class="detail-meta-item">Épisode : ${episodesValue}</span>
						<span class="detail-meta-item">Scan : ${scanValue}</span>
					</div>
					<div class="detail-actions">
						<button class="action-btn edit" data-id="${anime.id}">Modifier</button>
						<button class="action-btn delete" data-id="${anime.id}">Supprimer</button>
					</div>
				</div>
			</div>
		</div>`;

	container.querySelector('.back-btn').addEventListener('click', () => {
		selectedAnimeId = null;
		displayAnime();
	});

	container.querySelector('.edit').addEventListener('click', () => startEdit(anime.id));
	container.querySelector('.delete').addEventListener('click', () => deleteAnime(anime.id));
}

function getFilteredAndSortedAnimes() {
	const normalizedQuery = searchQuery.trim().toLowerCase();
	let visibleAnimes = animes.filter((anime) => {
		const title = String(anime.title || '').toLowerCase();
		const description = String(anime.description || '').toLowerCase();
		const status = String(anime.status || '').toLowerCase();
		const matchesQuery = !normalizedQuery || title.includes(normalizedQuery) || description.includes(normalizedQuery) || status.includes(normalizedQuery);
		return matchesQuery;
	});

	visibleAnimes = [...visibleAnimes].sort((a, b) => {
		if (sortMode.startsWith('status:')) {
			const targetStatus = sortMode.split(':')[1];
			if (String(a.status || 'À voir') === targetStatus && String(b.status || 'À voir') !== targetStatus) {
				return -1;
			}
			if (String(b.status || 'À voir') === targetStatus && String(a.status || 'À voir') !== targetStatus) {
				return 1;
			}
		}

		if (sortMode === 'title-desc') {
			return String(b.title || '').localeCompare(String(a.title || ''), 'fr');
		}

		if (sortMode === 'status') {
			const statusOrder = { 'à voir': 0, 'en cours': 1, 'terminé': 2 };
			const statusA = String(a.status || 'À voir').toLowerCase();
			const statusB = String(b.status || 'À voir').toLowerCase();
			return (statusOrder[statusA] ?? 99) - (statusOrder[statusB] ?? 99);
		}

		return String(a.title || '').localeCompare(String(b.title || ''), 'fr');
	});

	return visibleAnimes;
}

function displayAnime() {
	const container = document.getElementById('anime-list');
	container.innerHTML = '';

	const visibleAnimes = getFilteredAndSortedAnimes();

	if (visibleAnimes.length === 0) {
		container.innerHTML = '<p class="empty">Aucun anime trouvé.</p>';
		return;
	}

	visibleAnimes.forEach((anime) => {
		const card = document.createElement('div');
		card.className = 'card';
		const displayTitle = getDisplayTitle(anime.title);
		const statusClass = getStatusClass(anime.status);
		const seasonValue = getSafeSeasonValue(anime.season);
		const episodesValue = getSafeEpisodesValue(anime.episodes);
		const scanValue = getSafeScanValue(anime.scan);
		const scanTag = scanValue && String(scanValue).trim() !== '' && String(scanValue).trim() !== '1' ? `<button class="open-link" data-type="scans" data-id="${anime.id}">Scan ${scanValue}</button>` : '';
		card.innerHTML = `
			<img src="${getImageSrc(anime.image)}" alt="${anime.title}">
			<div class="card-content">
				<div class="card-title-row">
					<h3 title="${anime.title}">${displayTitle}</h3>
					<span class="status-dot ${statusClass}" aria-label="Statut : ${anime.status || 'À voir'}"></span>
				</div>
				<button class="open-link" data-type="anime" data-id="${anime.id}">Saison ${seasonValue} - Episode ${episodesValue}</button>
				${scanTag}
				<div class="card-actions">
					<button class="action-btn edit" data-id="${anime.id}">Modifier</button>
					<button class="action-btn delete" data-id="${anime.id}">Supprimer</button>

				</div>
			</div>`;
		card.addEventListener('click', (event) => {
			if (event.target.closest('.action-btn')) {
				return;
			}
			showAnimeDetails(anime.id);
		});
		container.appendChild(card);
	});

	container.querySelectorAll('.edit').forEach((button) => {
		button.addEventListener('click', (event) => {
			event.stopPropagation();
			startEdit(button.dataset.id);
		});
	});

	container.querySelectorAll('.delete').forEach((button) => {
		button.addEventListener('click', (event) => {
			event.stopPropagation();
			deleteAnime(button.dataset.id);
		});
	});
}

function resetForm() {
	document.getElementById('title').value = '';
	document.getElementById('image').value = '';
	document.getElementById('description').value = '';
	document.getElementById('season').value = '';
	document.getElementById('episodes').value = '';
	document.getElementById('link-anime').value = '';
	document.getElementById('scan').value = '';
	document.getElementById('link-scans').value = '';
	currentStatus = 'À voir';
	document.getElementById('status-toggle').textContent = currentStatus;
	document.getElementById('form-title').textContent = 'Ajouter un anime';
	document.getElementById('add').textContent = 'Ajouter';
	editMode = false;
	currentAnimeId = null;
	focusTitleField();
}

function fillForm(anime) {
	document.getElementById('title').value = anime.title || '';
	document.getElementById('image').value = anime.image || '';
	document.getElementById('description').value = anime.description || '';
	document.getElementById('season').value = getSafeSeasonValue(anime.season);
	document.getElementById('episodes').value = getSafeEpisodesValue(anime.episodes);
	document.getElementById('link-anime').value = anime.linkAnime;
	document.getElementById('scan').value = getSafeScanValue(anime.scan);
	document.getElementById('link-scans').value = anime.linkScans;
	currentStatus = anime.status || 'À voir';
	document.getElementById('status-toggle').textContent = currentStatus;
	document.getElementById('form-title').textContent = 'Modifier un anime';
	document.getElementById('add').textContent = 'Enregistrer';
	editMode = true;
	currentAnimeId = anime.id;
	focusTitleField();
}

function startEdit(animeId) {
	const anime = animes.find((item) => item.id === Number(animeId));
	if (anime) {
		fillForm(anime);
	}
}

async function saveAnime() {
	const title = document.getElementById('title').value.trim();

	if (!title) {
		alert('Le titre est obligatoire.');
		return;
	}

	const anime = {
		id: editMode ? currentAnimeId : Date.now(),
		title,
		image: document.getElementById('image').value.trim(),
		description: document.getElementById('description').value.trim(),
		season: getSafeSeasonValue(document.getElementById('season').value),
		episodes: getSafeEpisodesValue(document.getElementById('episodes').value),
		scan: getSafeScanValue(document.getElementById('scan').value),
		linkAnime: document.getElementById('link-anime').value.trim(),
		linkScans: document.getElementById('link-scans').value.trim(),
		status: currentStatus
	};

	try {
		if (editMode) {
			animes = await window.animeAPI.updateAnime(anime);
			alert('Anime modifié avec succès.');
		} else {
			animes = await window.animeAPI.addAnime(anime);
			alert('Anime ajouté avec succès.');
		}

		displayAnime();
		resetForm();
	} catch (error) {
		console.error('Erreur lors de la sauvegarde :', error);
		alert('Impossible de sauvegarder l’anime.');
	}
}

async function deleteAnime(animeId) {
	const confirmed = confirm('Voulez-vous vraiment supprimer cet anime ?');
	if (!confirmed) {
		return;
	}

	try {
		animes = await window.animeAPI.deleteAnime(Number(animeId));
		selectedAnimeId = null;
		displayAnime();
		if (editMode && currentAnimeId === Number(animeId)) {
			resetForm();
		}
	} catch (error) {
		console.error('Erreur lors de la suppression :', error);
		alert('Impossible de supprimer l’anime.');
	}
}

setupWheelControls();

const searchInput = document.getElementById('search-input');
const statusToggle = document.getElementById('status-toggle');
const statusMenu = document.getElementById('status-menu');
const statusOptions = document.querySelectorAll('.status-option');
const sortToggle = document.getElementById('sort-toggle');
const sortMenu = document.getElementById('sort-menu');
const sortOptions = document.querySelectorAll('.sort-option');

searchInput.addEventListener('input', (event) => {
	searchQuery = event.target.value;
	displayAnime();
});

function applySort(value) {
	sortMode = value;
	displayAnime();
}

statusToggle.addEventListener('click', () => {
	statusMenu.classList.toggle('open');
});

statusOptions.forEach((option) => {
	option.addEventListener('click', () => {
		currentStatus = option.dataset.value;
		statusToggle.textContent = currentStatus;
		statusMenu.classList.remove('open');
	});
});

sortToggle.addEventListener('click', () => {
	sortMenu.classList.toggle('open');
});

sortOptions.forEach((option) => {
	option.addEventListener('click', () => {
		applySort(option.dataset.value);
		sortMenu.classList.remove('open');
	});
});

document.addEventListener('click', (event) => {
	if (!event.target.closest('.sort-wrapper') && !event.target.closest('.status-wrapper')) {
		sortMenu.classList.remove('open');
		statusMenu.classList.remove('open');
	}
});

document.getElementById('add').addEventListener('click', saveAnime);

document.getElementById('pick-image').addEventListener('click', async () => {
	try {
		const imagePath = await window.animeAPI.selectImage();
		if (imagePath) {
			document.getElementById('image').value = imagePath;
		}
	} catch (error) {
		console.error('Erreur lors de la sélection d’image :', error);
	}
});

document.addEventListener("click", (event) => {

    if (!event.target.classList.contains("open-link")) {
        return;
    }

    console.log("Bouton cliqué");

    const id = Number(event.target.dataset.id);
    const type = event.target.dataset.type;

    console.log("ID :", id);
    console.log("Type :", type);

    const anime = animes.find(anime => anime.id === id);

    console.log("Anime trouvé :", anime);

    if (!anime) {
        console.log("Anime introuvable");
        return;
    }

    let url;

    if (type === "anime") {
        url = anime.linkAnime;
    }

    if (type === "scans") {
        url = anime.linkScans;
    }

    console.log("URL finale :", url);

    if (!url || url === "Pas de lien") {
        console.log("Pas de lien disponible");
        return;
    }

    window.animeAPI.openLink(url);

});

loadAnime();