window.showNote = function (i) {
  try {
    if (!window.currentNotes || !window.currentNotes[i]) return;
    const n = window.currentNotes[i];
    window.currentViewingNote = n;

    document.getElementById("view-note-title").textContent = n.title;
    document.getElementById("view-note-author").textContent =
      n.author + " tərəfindən";
    document.getElementById("view-note-text").textContent = n.content;

    document.getElementById("view-note-date").innerHTML =
      `<i class="far fa-clock"></i> ${n.dateStr}`;

    const noteModal = document.getElementById("view-note-modal");
    if (noteModal) {
      noteModal.classList.remove("hidden");
      noteModal.style.display = "flex";
    }
  } catch (err) {
    console.error("Not açılarkən xəta baş verdi:", err);
    alert("Notu açmaq mümkün olmadı.");
  }
};

window.deleteNote = async function () {
  const n = window.currentViewingNote;
  if (!n || !n._fileName) return;
  const pass = prompt("Notu silmək üçün admin şifrəsini daxil edin:");
  if (!pass) return;
  if (!confirm(`"${n.title}" notunu silməyə əminsən?`)) return;

  const btn = document.getElementById("delete-note-btn");
  const origText = btn.innerHTML;
  btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Silinir...";
  btn.disabled = true;
  try {
    const res = await fetch("/.netlify/functions/admin-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "delete_note",
        password: pass,
        payload: { path: `notlar/${n._fileName}` },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      alert("Not silindi! 🤍");
      const viewModal = document.getElementById("view-note-modal");
      if (viewModal) {
        viewModal.classList.add("hidden");
        viewModal.style.display = "none";
      }
      try { await loadNotes(); } catch (_) {}
    } else {
      alert("Xəta: " + (data.error || "Şifrə yanlış ola bilər."));
    }
  } catch (e) {
    console.error("Not silmə xətası:", e);
    alert("Sistem xətası baş verdi.");
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
};

async function loadNotes() {
  const container = document.getElementById("notes-container");
  if (!container) return;

  try {
    const res = await fetch("/.netlify/functions/github-content?path=notlar");
    if (!res.ok) {
      container.innerHTML = "<p style='opacity:0.6;'>Hələ ki, not yoxdur.</p>";
      return;
    }

    const files = await res.json();
    let notesData = [];
    const jsonFiles = files.filter((x) => x.name.endsWith(".json"));

    for (let f of jsonFiles) {
      const dataRes = await fetch(f.download_url);
      const note = await dataRes.json();
      note._fileName = f.name;
      notesData.push(note);
    }

    notesData.sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso));
    window.currentNotes = notesData;

    container.innerHTML = notesData
      .map(
        (n, i) => `
            <div class="note-card" data-index="${i}">
                <span class="note-card-author">${n.author}</span>
                <h3 class="note-card-title">${n.title}</h3>
                <span class="note-card-date">${n.dateStr}</span>
            </div>
        `,
      )
      .join("");

    document.querySelectorAll(".note-card").forEach((card) => {
      card.addEventListener("click", function () {
        const index = this.getAttribute("data-index");
        window.showNote(parseInt(index));
      });
    });
  } catch (e) {
    console.error("Xəta:", e);
    container.innerHTML =
      "<p style='opacity:0.6; color:#ff4d6d;'>Notlar yüklənərkən xəta baş verdi.</p>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNotes();

  const addModal = document.getElementById("add-note-modal");
  const viewModal = document.getElementById("view-note-modal");

  document.getElementById("open-add-note-btn").onclick = () => {
    addModal.classList.remove("hidden");
    addModal.style.display = "flex";
  };
  document.getElementById("close-add-note-btn").onclick = () => {
    addModal.classList.add("hidden");
    addModal.style.display = "none";
  };
  document.getElementById("close-view-note-btn").onclick = () => {
    viewModal.classList.add("hidden");
    viewModal.style.display = "none";
  };
  document.getElementById("delete-note-btn").onclick = () => {
    window.deleteNote();
  };
  document.getElementById("view-note-modal")?.addEventListener("click", (e) => {
    if (e.target === viewModal) {
      viewModal.classList.add("hidden");
      viewModal.style.display = "none";
    }
  });

  document.getElementById("submit-note-btn").onclick = async () => {
    const author = document.getElementById("note-author").value;
    let title = document.getElementById("note-title").value.trim();
    const content = document.getElementById("note-content").value.trim();
    const pass = (typeof getAdminPassword === "function" ? getAdminPassword("upload_note") : null) || prompt("Admin şifrəsi:");

    if (!content || !pass) return alert("Məzmun və şifrə mütləqdir!");

    const now = new Date();
    const dateStr = now.toLocaleString("az-AZ").replace(",", "");
    if (!title) title = dateStr;

    const noteObj = {
      author,
      title,
      content,
      dateStr,
      dateIso: now.toISOString(),
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(noteObj))));

    const btn = document.getElementById("submit-note-btn");
    btn.textContent = "Yüklənir...";
    btn.disabled = true;

    try {
      const res = await fetch("/.netlify/functions/admin-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "upload_note",
          password: pass,
          payload: { path: `notlar/not_${Date.now()}.json`, content: b64 },
        }),
      });

      if (res.ok) {
        alert("Not uğurla əlavə edildi! 🤍");
        location.reload();
      } else {
        alert("Xəta: Şifrə yanlış ola bilər.");
        btn.textContent = "Təsdiqlə";
        btn.disabled = false;
      }
    } catch (e) {
      alert("Sistem xətası baş verdi.");
      btn.textContent = "Təsdiqlə";
      btn.disabled = false;
    }
  };
});
