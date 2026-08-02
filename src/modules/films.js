window.currentFilms = [];
let filmSortMode = "date";

function showFilmToast(message, type = "success") {
  let toast = document.getElementById("film-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "film-toast";
    toast.style.cssText = [
      "position:fixed", "bottom:90px", "left:50%", "transform:translateX(-50%)",
      "background:" + (type === "error" ? "#c0392b" : "#27ae60"),
      "color:#fff", "padding:12px 22px", "border-radius:12px",
      "font-size:15px", "font-weight:600", "z-index:99999",
      "box-shadow:0 4px 20px rgba(0,0,0,0.35)", "opacity:0",
      "transition:opacity .3s ease", "pointer-events:none",
      "max-width:90vw", "text-align:center"
    ].join(";");
    document.body.appendChild(toast);
  }
  toast.style.background = type === "error" ? "#c0392b" : "#27ae60";
  toast.textContent = message;
  toast.style.opacity = "1";
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => { toast.style.opacity = "0"; }, 3000);
}

function buildStarsHtml(rating, size = "small") {
  const full = Math.floor(rating / 2);
  const half = rating % 2 >= 1 ? 1 : 0;
  const empty = 5 - full - half;
  let html = `<span class="film-stars">`;
  for (let i = 0; i < full; i++)
    html += `<span class="star-filled">&#9733;</span>`;
  if (half) html += `<span class="star-half">&#9733;</span>`;
  for (let i = 0; i < empty; i++)
    html += `<span class="star-empty">&#9733;</span>`;
  html += `</span>`;
  return html;
}

function formatFilmDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const months = [
    "Yan", "Fev", "Mar", "Apr", "May", "İyn",
    "İyl", "Avq", "Sen", "Okt", "Noy", "Dek",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function updateFilmStats(films) {
  const totalEl = document.getElementById("film-total-count");
  const avgEl = document.getElementById("film-avg-rating");
  const topEl = document.getElementById("film-top-title");
  if (!totalEl) return;
  const rated = films.filter((f) => f.rating > 0);
  totalEl.textContent = films.length;
  if (rated.length) {
    const avg = rated.reduce((s, f) => s + Number(f.rating), 0) / rated.length;
    avgEl.textContent = avg.toFixed(1) + "/10";
    const top = rated.reduce(
      (best, f) => (Number(f.rating) > Number(best.rating) ? f : best),
      rated[0],
    );
    topEl.textContent = top.title;
  } else {
    avgEl.textContent = "-";
    topEl.textContent = "-";
  }
}

function renderFilms(films) {
  const container = document.getElementById("films-container");
  if (!container) return;
  const sorted = [...films].sort((a, b) => {
    if (filmSortMode === "rating") return Number(b.rating) - Number(a.rating);
    return (
      new Date(b.watchDate || b.dateIso || 0) -
      new Date(a.watchDate || a.dateIso || 0)
    );
  });
  if (!sorted.length) {
    container.innerHTML = `
            <div class="films-empty" style="grid-column:1/-1;">
                <i class="fas fa-clapperboard"></i>
                <p>Hələ ki, izlənilmiş film yoxdur.</p>
            </div>`;
    return;
  }
  container.innerHTML = sorted
    .map((f, i) => {
      const rating = Number(f.rating) || 0;
      const stars = buildStarsHtml(rating);
      const dateStr = formatFilmDate(f.watchDate || f.dateIso);
      const genresArray = f.genre ? f.genre.split(',').map(g => g.trim()).filter(Boolean) : [];
      const genre = genresArray.length > 0
        ? `<div class="film-card-genres">${genresArray.map(g => `<span class="film-card-badge"><i class="fas fa-tag"></i>${g}</span>`).join('')}</div>`
        : `<div class="film-card-genres"></div>`;
      const director = f.director
        ? `<p class="film-card-director"><i class="fas fa-video" style="font-size:.68rem;opacity:.5;margin-right:4px;"></i>${f.director}</p>`
        : "";
      const review = f.review
        ? `<p class="film-card-review">${f.review}</p>`
        : "";
      const addedBy = f.addedBy
        ? `<span class="film-card-addedby">${f.addedBy === "Birlikdə" ? "Birlikdə izlənib" : f.addedBy + " izlədi"}</span>`
        : "";
      return `
            <div class="film-card" data-film-index="${i}" style="animation-delay:${i * 0.06}s">
                <div class="film-card-top">
                    ${genre}
                    <div class="film-card-rating">
                        ${stars}
                        ${rating ? `<span class="film-card-score">${rating}<span>/10</span></span>` : ""}
                    </div>
                </div>
                <h3 class="film-card-title">${f.title}</h3>
                ${director}
                ${review}
                <div class="film-card-footer">
                    <span class="film-card-date"><i class="far fa-calendar"></i>${dateStr}</span>
                    ${addedBy}
                </div>
            </div>`;
    })
    .join("");
  container.querySelectorAll(".film-card").forEach((card) => {
    card.addEventListener("click", function () {
      const idx = parseInt(this.getAttribute("data-film-index"));
      window.showFilm(sorted[idx]);
    });
  });
}

window.showFilm = function (f) {
  const modal = document.getElementById("view-film-modal");
  if (!modal) return;
  window.currentViewingFilm = f;
  const rating = Number(f.rating) || 0;
  document.getElementById("view-film-title").textContent = f.title || "";
  document.getElementById("view-film-genre").textContent = f.genre || "Film";
  document.getElementById("view-film-director").textContent = f.director
    ? `Rejissor: ${f.director}`
    : "";
  document.getElementById("view-film-addedby").textContent = f.addedBy
    ? (f.addedBy === "Birlikdə" ? "Birlikdə izlənib" : `${f.addedBy} izlədi`)
    : "";
  document.getElementById("view-film-review").textContent = f.review || "";
  document.getElementById("view-film-date").innerHTML =
    `<i class="far fa-clock"></i> ${formatFilmDate(f.watchDate || f.dateIso)}`;
  document.getElementById("view-film-score").innerHTML = rating
    ? `<i class="fas fa-star" style="color: #ffd700;"></i> ${rating}/10`
    : "";
  document.getElementById("view-film-rating-stars").innerHTML = buildStarsHtml(rating, "big");
  modal.classList.remove("hidden");
  modal.style.display = "flex";
};

window.deleteFilm = async function () {
  const f = window.currentViewingFilm;
  if (!f || !f._fileName) return;
  const pass = prompt("Filmi silmək üçün admin şifrəsini daxil edin:");
  if (!pass) return;
  if (!confirm(`"${f.title}" filmini silməyə əminsən?`)) return;

  const btn = document.getElementById("delete-film-btn");
  const origText = btn.innerHTML;
  btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Silinir...";
  btn.disabled = true;
  try {
    const res = await fetch("/.netlify/functions/admin-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "delete_film",
        password: pass,
        payload: { path: `filmler/${f._fileName}` },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      showFilmToast("🎬 Film silindi!");
      const viewModal = document.getElementById("view-film-modal");
      if (viewModal) {
        viewModal.classList.add("hidden");
        viewModal.style.display = "none";
      }
      try { await loadFilms(); } catch (_) {}
    } else {
      alert("Xəta: " + (data.error || "Şifrə yanlış ola bilər."));
    }
  } catch (e) {
    console.error("Film silmə xətası:", e);
    alert("Sistem xətası baş verdi. İnternet bağlantınızı yoxlayın.");
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
};

async function loadFilms() {
  const container = document.getElementById("films-container");
  if (!container) return;
  try {
    const res = await fetch("/.netlify/functions/github-content?path=filmler");
    if (!res.ok) {
      container.innerHTML = `<div class="films-empty" style="grid-column:1/-1;"><i class="fas fa-clapperboard"></i><p>Hələ ki, film yoxdur.</p></div>`;
      return;
    }
    const files = await res.json();
    const jsonFiles = files.filter((x) => x.name.endsWith(".json"));
    let filmsData = [];
    for (const f of jsonFiles) {
      try {
        const dataRes = await fetch(f.download_url);
        const film = await dataRes.json();
        film._fileName = f.name;
        filmsData.push(film);
      } catch (e) {}
    }
    filmsData.sort(
      (a, b) =>
        new Date(b.watchDate || b.dateIso || 0) -
        new Date(a.watchDate || a.dateIso || 0),
    );
    window.currentFilms = filmsData;
    updateFilmStats(filmsData);
    renderFilms(filmsData);
  } catch (e) {
    console.error("Film yüklənmə xətası:", e);
    container.innerHTML = `<div class="films-empty" style="grid-column:1/-1;"><i class="fas fa-clapperboard"></i><p>Filmlər yüklənərkən xəta baş verdi.</p></div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadFilms();

  let selectedGenres = [];
  function renderSelectedGenres() {
    const container = document.getElementById("selected-genres-container");
    if(!container) return;
    container.innerHTML = selectedGenres.map(g => `<span class="film-card-badge" style="cursor:pointer;" onclick="removeGenre('${g.replace(/'/g, "\\'")}')">${g} &times;</span>`).join("");
  }
  window.removeGenre = function(g) {
    selectedGenres = selectedGenres.filter(x => x !== g);
    renderSelectedGenres();
  }
  document.getElementById("add-genre-btn")?.addEventListener("click", () => {
    const input = document.getElementById("film-genre-input");
    const val = input.value.trim();
    if(val && !selectedGenres.includes(val)) {
      selectedGenres.push(val);
      input.value = "";
      renderSelectedGenres();
    }
  });

  document.querySelectorAll(".film-sort-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".film-sort-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      filmSortMode = this.getAttribute("data-sort");
      renderFilms(window.currentFilms);
    });
  });

  const addModal = document.getElementById("add-film-modal");
  const viewModal = document.getElementById("view-film-modal");

  document.getElementById("admin-open-film-modal-secondary")?.addEventListener("click", () => {
    const dateInput = document.getElementById("film-date-input");
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }
    addModal.classList.remove("hidden");
    addModal.style.display = "flex";
  });

  document.getElementById("open-add-film-btn")?.addEventListener("click", () => {
    const dateInput = document.getElementById("film-date-input");
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }
    addModal.classList.remove("hidden");
    addModal.style.display = "flex";
  });

  document.getElementById("close-add-film-btn")?.addEventListener("click", () => {
    addModal.classList.add("hidden");
    addModal.style.display = "none";
  });

  document.getElementById("close-view-film-btn")?.addEventListener("click", () => {
    viewModal.classList.add("hidden");
    viewModal.style.display = "none";
  });

  document.getElementById("delete-film-btn")?.addEventListener("click", () => {
    window.deleteFilm();
  });

  const starSelector = document.getElementById("film-star-selector");
  const ratingInput = document.getElementById("film-rating-input");
  if (starSelector && ratingInput) {
    starSelector.querySelectorAll("span").forEach((star) => {
      star.addEventListener("click", function () {
        const val = parseInt(this.getAttribute("data-star"));
        ratingInput.value = val;
        starSelector.querySelectorAll("span").forEach((s) => {
          s.classList.toggle("active", parseInt(s.getAttribute("data-star")) <= val);
        });
      });
    });
    ratingInput.addEventListener("input", () => {
      const val = Math.round(parseFloat(ratingInput.value) || 0);
      starSelector.querySelectorAll("span").forEach((s) => {
        s.classList.toggle("active", parseInt(s.getAttribute("data-star")) <= val);
      });
    });
  }

  document.getElementById("submit-film-btn")?.addEventListener("click", async () => {
    const title = document.getElementById("film-title-input").value.trim();
    const director = document.getElementById("film-director-input").value.trim();
    const genreInputVal = document.getElementById("film-genre-input").value.trim();
    let finalGenres = [...selectedGenres];
    if (genreInputVal && !finalGenres.includes(genreInputVal)) {
      finalGenres.push(genreInputVal);
    }
    const genre = finalGenres.join(", ");
    const watchDate = document.getElementById("film-date-input").value;
    const rating = parseFloat(document.getElementById("film-rating-input").value) || 0;
    const addedBy = document.getElementById("film-added-by").value;
    const review = document.getElementById("film-review-input").value.trim();

    const modalPassEl = document.getElementById("film-admin-password");
    const pass = (modalPassEl && modalPassEl.value.trim()) || (typeof getAdminPassword === "function" ? getAdminPassword("upload_note") : null);

    if (!title) { alert("Film adı mütləqdir!"); return; }
    if (!pass) { alert("Admin şifrəsini daxil edin!"); if (modalPassEl) modalPassEl.focus(); return; }

    const filmObj = {
      title, director, genre, watchDate, rating, addedBy, review,
      dateIso: new Date().toISOString(),
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(filmObj))));

    const btn = document.getElementById("submit-film-btn");
    const origText = btn.innerHTML;
    btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Yüklənir...";
    btn.disabled = true;

    try {
      const res = await fetch("/.netlify/functions/admin-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "upload_film",
          password: pass,
          payload: { path: `filmler/film_${Date.now()}.json`, content: b64 },
        }),
      });

      if (res.ok) {
        ["film-title-input","film-director-input","film-genre-input","film-rating-input","film-review-input","film-admin-password"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.value = "";
        });
        document.querySelectorAll("#film-star-selector span").forEach((s) => s.classList.remove("active"));
        selectedGenres = [];
        if (typeof renderSelectedGenres === "function") renderSelectedGenres();
        addModal.style.display = "none";
        addModal.classList.add("hidden");
        btn.innerHTML = "Təsdiqlə və Göndər <i class='fas fa-clapperboard'></i>";
        btn.disabled = false;
        showFilmToast("🎬 Film uğurla əlavə edildi!");
        try { await loadFilms(); } catch (_) {}
      } else {
        alert("Xəta: Şifrə yanlış ola bilər.");
        btn.innerHTML = origText;
        btn.disabled = false;
      }
    } catch (e) {
      console.error("Film submit xətası:", e);
      alert("Sistem xətası baş verdi. İnternet bağlantınızı yoxlayın.");
      btn.innerHTML = origText;
      btn.disabled = false;
    }
  });
});
