/**
 * Renderer logic for BrainRot App: YouTube search and infinite scroll.
 * Assumes window.electronAPI.youtubeSearch is exposed via preload.js.
 */

let isLoading = false;
let nextPageToken = null;
let lastQuery = '';
const videoList = document.getElementById('videoList');
const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('searchBtn');

// Search function
async function getVideos(query, isNewSearch = true) {
    if (isLoading) return;
    isLoading = true;

    if (isNewSearch) {
        videoList.innerHTML = "Loading...";
        nextPageToken = null;
        lastQuery = query;
    }

    try {
        const data = await window.electronAPI.youtubeSearch(query, nextPageToken);
        if (isNewSearch) videoList.innerHTML = "";

        if (!data || !data.items || data.items.length === 0) {
            if (isNewSearch) videoList.innerHTML = "No results.";
            return;
        }

        data.items.forEach(video => {
            const videoId = video.id && video.id.videoId;
            const snippet = video.snippet || {};
            const title = snippet.title || "No Title";
            const thumbnailUrl = snippet.thumbnails && snippet.thumbnails.default && snippet.thumbnails.default.url
                ? snippet.thumbnails.default.url
                : "";

            if (!videoId) return;

            const div = document.createElement('div');
            div.className = 'video-item';

            const strong = document.createElement('strong');
            strong.textContent = title;
            div.appendChild(strong);
            div.appendChild(document.createElement('br'));

            if (thumbnailUrl) {
                const img = document.createElement('img');
                img.src = thumbnailUrl;
                img.alt = "";
                div.appendChild(img);
                div.appendChild(document.createElement('br'));
            }

            const button = document.createElement('button');
            button.textContent = 'picture on picture';
            button.onclick = () => {
                window.electronAPI.openPiP(videoId);
            };
            div.appendChild(button);

            videoList.appendChild(div);
        });

        nextPageToken = data.nextPageToken || null;
    } catch (err) {
        if (isNewSearch) {
            videoList.innerHTML = "Error loading videos.<br>" + (err && err.message ? err.message : "");
        }
        console.error("YouTube API error:", err);
    } finally {
        isLoading = false;
    }
}

// Event listeners
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) getVideos(query, true);
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) getVideos(query, true);
    }
});

// Infinite scroll (already in your HTML, but moved here for clarity)
window.addEventListener('scroll', () => {
    if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
        !isLoading &&
        nextPageToken
    ) {
        getVideos(lastQuery, false);
    }
});