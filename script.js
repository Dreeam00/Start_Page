document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const body = document.body;
    const clockElement = document.getElementById('clock');
    const greetingElement = document.getElementById('greeting');
    const weatherTemp = document.getElementById('weather-temp');
    const weatherDesc = document.getElementById('weather-desc');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const linksGrid = document.getElementById('links-grid');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const themeSwitcher = document.querySelector('.theme-switcher');
    const searchEngineSelect = document.getElementById('search-engine-select');
    const bgUrlInput = document.getElementById('bg-url-input');
    const blurInput = document.getElementById('blur-input');
    const opacityInput = document.getElementById('opacity-input');
    const addLinkForm = document.getElementById('add-link-form');
    const linkNameInput = document.getElementById('link-name-input');
    const linkUrlInput = document.getElementById('link-url-input');
    const linkIconInput = document.getElementById('link-icon-input');
    const manageLinksList = document.getElementById('manage-links-list');
    const dialogOverlay = document.getElementById('custom-dialog-overlay');
    const dialogMessage = document.getElementById('dialog-message');
    const dialogConfirmBtn = document.getElementById('dialog-confirm');
    const dialogCancelBtn = document.getElementById('dialog-cancel');

    // --- State & Constants ---
    let links = [];
    const settings = {
        theme: 'dark',
        searchEngine: 'google',
        backgroundUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2400&auto=format&fit=crop',
        blur: 10,
        opacity: 0.1,
    };
    let sortable = null;

    const SEARCH_ENGINES = {
        google: { name: 'Google', url: 'https://www.google.com/search?q=' },
        duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
        bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
    };

    const defaultLinks = [
        { name: 'Gmail', url: 'https://mail.google.com', icon: '' },
        { name: 'GitHub', url: 'https://github.com', icon: '' },
        { name: 'YouTube', url: 'https://youtube.com', icon: '' },
    ];

    // --- Core Functions ---
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        const encodedValue = encodeURIComponent(value || "");
        document.cookie = name + "=" + encodedValue + expires + "; path=/; SameSite=Strict";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                const encodedValue = c.substring(nameEQ.length, c.length);
                const decodedValue = decodeURIComponent(encodedValue);
                return decodedValue;
            }
        }
        return null;
    }

    function saveSettings() {
        setCookie('startPageSettings', JSON.stringify(settings), 365);
    }

    function applySettings() {
        body.dataset.theme = settings.theme;
        document.querySelectorAll('.theme-switcher button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === settings.theme);
        });
        searchEngineSelect.value = settings.searchEngine;
        searchInput.placeholder = `Search with ${SEARCH_ENGINES[settings.searchEngine].name}`;
        document.documentElement.style.setProperty('--bg-image', `url('${settings.backgroundUrl}')`);
        bgUrlInput.value = settings.backgroundUrl;
        document.documentElement.style.setProperty('--blur', `${settings.blur}px`);
        blurInput.value = settings.blur;
        document.documentElement.style.setProperty('--opacity', settings.opacity);
        opacityInput.value = settings.opacity;
    }

    function saveLinks() {
        setCookie('startPageLinks', JSON.stringify(links), 365);
    }

    function loadData() {
        const storedSettings = getCookie('startPageSettings');
        if (storedSettings) {
            Object.assign(settings, JSON.parse(storedSettings));
        }
        const storedLinks = getCookie('startPageLinks');
        links = storedLinks ? JSON.parse(storedLinks) : [...defaultLinks];
        // Ensure old data structure is compatible
        links.forEach(link => {
            if (link.icon === undefined) {
                link.icon = '';
            }
        });
        applySettings();
        renderLinks();
        renderManageLinks();
        initDragAndDrop();
        initAnimations();
    }

    // --- Animations & Interactions ---
    function initAnimations() {
        gsap.from('.glass-card', {
            duration: 1,
            y: 30,
            opacity: 0,
            stagger: 0.15,
            ease: 'power3.out'
        });
    }

    function initDragAndDrop() {
        if (sortable) {
            sortable.destroy();
        }
        sortable = new Sortable(manageLinksList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                const movedItem = links.splice(evt.oldIndex, 1)[0];
                links.splice(evt.newIndex, 0, movedItem);
                saveLinks();
                renderLinks(); // Re-render main grid to reflect new order
            },
        });
    }

    const settingsTimeline = gsap.timeline({ paused: true });
    settingsTimeline.to('#settings-panel', { right: 0, duration: 0.6, ease: 'power3.inOut' });

    // --- Custom Dialog ---
    let resolveConfirm;
    function showConfirm(message) {
        dialogMessage.textContent = message;
        dialogOverlay.classList.remove('hidden');
        gsap.set('#custom-dialog-overlay', { pointerEvents: 'auto' });
        gsap.to('#custom-dialog-overlay', { opacity: 1, duration: 0.3 });
        gsap.from('#custom-dialog', { scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.out' });
        return new Promise((resolve) => {
            resolveConfirm = resolve;
        });
    }

    function hideConfirm(result) {
        gsap.set('#custom-dialog-overlay', { pointerEvents: 'none' });
        gsap.to('#custom-dialog-overlay', { 
            opacity: 0, 
            duration: 0.3, 
            onComplete: () => {
                dialogOverlay.classList.add('hidden');
                if (resolveConfirm) resolveConfirm(result);
            }
        });
    }

    dialogConfirmBtn.addEventListener('click', () => hideConfirm(true));
    dialogCancelBtn.addEventListener('click', () => hideConfirm(false));
    dialogOverlay.addEventListener('click', (e) => {
        if (e.target === dialogOverlay) hideConfirm(false);
    });

    // --- Rendering ---
    function getIconUrl(link) {
        if (link.icon) {
            return link.icon;
        }
        try {
            const domain = new URL(link.url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch (e) {
            return 'https://raw.githubusercontent.com/icons8/liquid-glass-icons/main/flat-windows-11/SVG/link.svg';
        }
    }

    function renderLinks() {
        linksGrid.innerHTML = '';
        links.forEach(link => {
            const linkItem = document.createElement('a');
            linkItem.href = link.url;
            linkItem.className = 'link-item';
            linkItem.target = '_blank';
            linkItem.rel = 'noopener noreferrer';
            linkItem.innerHTML = `
                <img src="${getIconUrl(link)}" alt="${link.name} Favicon" class="link-favicon">
                <span class="link-name">${link.name}</span>
            `;
            linksGrid.appendChild(linkItem);
        });
    }

    function renderManageLinks() {
        manageLinksList.innerHTML = '';
        links.forEach((link, index) => {
            const item = document.createElement('div');
            item.className = 'manage-link-item';
            item.dataset.id = index;
            item.innerHTML = `
                <img src="${getIconUrl(link)}" alt="">
                <span>${link.name}</span>
                <button class="icon-btn delete-link-btn" data-index="${index}">
                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 15L33 33m0-18L15 33"/></svg>
                </button>
            `;
            manageLinksList.appendChild(item);
        });
    }

    // --- Widgets ---
    function updateClock() {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good evening';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        greetingElement.textContent = greeting;
    }

    function getWeatherDescription(code) {
        const descriptions = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow fall',
            73: 'Moderate snow fall',
            75: 'Heavy snow fall',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail',
        };
        return descriptions[code] || 'Unknown';
    }

    async function fetchWeather() {
        if (!navigator.geolocation) {
            weatherDesc.textContent = 'Geolocation not supported';
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Weather data not available');
                const data = await response.json();
                const current = data.current_weather;
                weatherTemp.textContent = `${current.temperature}°C`;
                weatherDesc.textContent = getWeatherDescription(current.weathercode);
            } catch (error) {
                console.error('Failed to fetch weather:', error);
                weatherDesc.textContent = 'Unavailable';
            }
        }, (error) => {
            console.error('Geolocation error:', error);
            weatherDesc.textContent = 'Location access denied';
        });
    }

    // --- Event Listeners ---
    settingsBtn.addEventListener('click', () => {
        if (settingsTimeline.reversed() || !settingsTimeline.isActive()) {
            settingsTimeline.play();
        } else {
            settingsTimeline.reverse();
        }
    });

    themeSwitcher.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            settings.theme = e.target.dataset.theme;
            saveSettings();
            applySettings();
        }
    });

    searchEngineSelect.addEventListener('change', () => {
        settings.searchEngine = searchEngineSelect.value;
        saveSettings();
        applySettings();
    });

    bgUrlInput.addEventListener('change', () => {
        settings.backgroundUrl = bgUrlInput.value;
        saveSettings();
        applySettings();
    });

    blurInput.addEventListener('input', () => {
        settings.blur = blurInput.value;
        document.documentElement.style.setProperty('--blur', `${settings.blur}px`);
    });
    blurInput.addEventListener('change', saveSettings);

    opacityInput.addEventListener('input', () => {
        settings.opacity = opacityInput.value;
        document.documentElement.style.setProperty('--opacity', `${settings.opacity}px`);
    });
    opacityInput.addEventListener('change', saveSettings);

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            const url = SEARCH_ENGINES[settings.searchEngine].url + encodeURIComponent(query);
            window.location.href = url;
        }
    });

    addLinkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = linkNameInput.value.trim();
        let url = linkUrlInput.value.trim();
        const icon = linkIconInput.value.trim();
        if (name && url) {
            if (!url.startsWith('http')) url = 'https://' + url;
            links.push({ name, url, icon });
            saveLinks();
            renderLinks();
            renderManageLinks();
            addLinkForm.reset();
        }
    });

    manageLinksList.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-link-btn');
        if (deleteBtn) {
            const index = parseInt(deleteBtn.dataset.index, 10);
            const link = links[index];
            const confirmed = await showConfirm(`Delete "${link.name}"?`);
            if (confirmed) {
                links.splice(index, 1);
                saveLinks();
                renderLinks();
                renderManageLinks();
            }
        }
    });

    // --- Initialization ---
    loadData();
    setInterval(updateClock, 1000 * 60);
    updateClock();
    updateGreeting();
    fetchWeather();
});