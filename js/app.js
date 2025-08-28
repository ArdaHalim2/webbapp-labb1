/* FilmKollen – enkel klientsida med Fetch, rendering och formulärvalidering */
(function() {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear().toString();

    // Theme init and toggle
    initTheme();

    // Page detection
    if ($('#movie-list')) {
      loadAndRenderMovies();
      initMemberForm();
    }
    if ($('#movie-detail')) {
      loadAndRenderMovieDetail();
      initRatingForm();
    }
  });

  async function fetchMovies() {
    const res = await fetch('js/movies.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Kunde inte läsa in filmdata (HTTP ' + res.status + ').');
    return res.json();
  }

  function createMovieCard(movie) {
    const article = document.createElement('article');
    article.className = 'card movie-card';
    article.innerHTML = `
      <a class="card-link" href="movie.html?id=${encodeURIComponent(movie.id)}" aria-label="Läs mer om ${escapeHtml(movie.title)}">
        <div class="card-media">
          <img src="${escapeHtml(movie.poster)}" alt="Omslag: ${escapeHtml(movie.title)}" onerror="this.src='icon.png'" />
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(movie.title)}</h3>
          <p class="card-meta">${movie.year} • ⭐ ${movie.rating.toFixed(1)}</p>
          <p class="card-text">${escapeHtml(movie.description.substring(0, 100))}…</p>
        </div>
      </a>`;
    return article;
  }

  async function loadAndRenderMovies() {
    const list = $('#movie-list');
    const errorEl = $('#movie-error');
    try {
      list.innerHTML = '<div class="loader" role="status" aria-live="polite">Laddar filmer…</div>';
      const movies = await fetchMovies();
      list.innerHTML = '';
      movies.forEach(m => list.appendChild(createMovieCard(m)));
    } catch (err) {
      list.innerHTML = '';
      errorEl.classList.remove('hidden');
      errorEl.textContent = 'Något gick fel: ' + err.message;
    }
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(location.search);
    return params.get(name);
  }

  async function loadAndRenderMovieDetail() {
    const id = parseInt(getQueryParam('id') || '', 10);
    const wrap = $('#movie-detail');
    const title = $('#movie-title');
    const meta = $('#movie-meta');
    const desc = $('#movie-desc');
    const genres = $('#movie-genres');
    const poster = $('#movie-poster');

    if (!id) {
      wrap.innerHTML = '<p class="alert">Ingen film vald.</p>';
      return;
    }
    try {
      const movies = await fetchMovies();
      const movie = movies.find(m => m.id === id);
      if (!movie) {
        wrap.innerHTML = '<p class="alert">Kunde inte hitta filmen.</p>';
        return;
      }
      title.textContent = movie.title;
      document.title = 'FilmKollen – ' + movie.title;
      meta.textContent = `${movie.year} • ${movie.runtime} min • Regi: ${movie.director} • ⭐ ${movie.rating.toFixed(1)}`;
      desc.textContent = movie.description;
      genres.innerHTML = movie.genre.map(g => `<span class="chip">${escapeHtml(g)}</span>`).join(' ');
      poster.src = movie.poster;
      poster.alt = 'Omslag: ' + movie.title;
    } catch (err) {
      wrap.innerHTML = `<p class="alert">Fel vid inläsning: ${escapeHtml(err.message)}</p>`;
    }
  }

  function initMemberForm() {
    const form = $('#member-form');
    if (!form) return;
    const result = $('#member-result');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Inputs
      const name = $('#name');
      const email = $('#email');
      const password = $('#password');
      const terms = $('#terms');

      let valid = true;

      // Custom validations
      // Name
      if (!name.value || name.value.trim().length < 2) {
        setError('name', 'Ange minst 2 tecken.');
        valid = false;
      } else {
        clearError('name');
      }
      // Email
      if (!email.validity.valid) {
        setError('email', 'Ange en giltig e‑postadress.');
        valid = false;
      } else {
        clearError('email');
      }
      // Password
      if (!password.value || password.value.length < 6) {
        setError('password', 'Lösenord måste vara minst 6 tecken.');
        valid = false;
      } else {
        clearError('password');
      }
      // Terms
      if (!terms.checked) {
        setError('terms', 'Du måste godkänna villkoren.');
        valid = false;
      } else {
        clearError('terms');
      }

      if (!valid) return;

      result.innerHTML = `
        <div class="success">
          <p>Tack, <strong>${escapeHtml(name.value)}</strong>! Din medlemsansökan har registrerats.</p>
          <p>Vi skickar bekräftelse till <strong>${escapeHtml(email.value)}</strong>.</p>
        </div>`;
      form.reset();
    });
  }

  function initRatingForm() {
    const form = $('#rating-form');
    if (!form) return;
    const result = $('#rating-result');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rating = parseInt($('#rating').value, 10);
      const comment = $('#comment').value.trim();
      let valid = true;

      if (!(rating >= 1 && rating <= 5)) {
        setError('rating', 'Betyget måste vara mellan 1 och 5.');
        valid = false;
      } else {
        clearError('rating');
      }
      if (comment.length < 10) {
        setError('comment', 'Kommentaren måste vara minst 10 tecken.');
        valid = false;
      } else {
        clearError('comment');
      }

      if (!valid) return;

      result.innerHTML = `
        <div class="success">
          <p>Tack för ditt betyg: <strong>${rating}</strong>/5</p>
          <blockquote>${escapeHtml(comment)}</blockquote>
        </div>`;
      form.reset();
    });
  }

  function setError(fieldBase, message) {
    const input = document.getElementById(fieldBase);
    const error = document.getElementById(fieldBase + '-error');
    if (input) input.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = message;
      error.style.display = 'block';
    }
  }

  function clearError(fieldBase) {
    const input = document.getElementById(fieldBase);
    const error = document.getElementById(fieldBase + '-error');
    if (input) input.removeAttribute('aria-invalid');
    if (error) {
      error.textContent = '';
      error.style.display = 'none';
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // THEME HANDLING
  function initTheme() {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      // No stored preference: leave default (light) and respect system in CSS
      document.documentElement.removeAttribute('data-theme');
      updateMetaThemeColor();
      updateThemeToggleButtonLabel();
    }

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('theme', next);
      });
      updateThemeToggleButtonLabel();
    }
  }

  function setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    updateMetaThemeColor();
    updateThemeToggleButtonLabel();
  }

  function updateThemeToggleButtonLabel() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = isDark ? '🌞 Tema' : '🌙 Tema';
    btn.setAttribute('aria-label', isDark ? 'Byt till ljust tema' : 'Byt till mörkt tema');
  }

  function updateMetaThemeColor() {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    meta.setAttribute('content', isDark ? '#0b1220' : '#f6f8fb');
  }
})();
