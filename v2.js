
(() => {
"use strict";

const core = window.CURIOS_CORE;
const courses = window.CURIOS_COURSES || [];
if (!core) return;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[c]));

let page = "home";
let query = "";
let quiz = null;

const state = () => core.getState();
const findCourse = id => courses.find(c => c.id === id);

function saveProfile(name, avatar) {
  const backup = JSON.parse(core.exportBackup());
  backup.state.nickname = name;
  backup.state.avatar = avatar;
  core.importBackup(JSON.stringify(backup));
}

function header() {
  const s = state();
  $("#hello").textContent = "Bienvenue, " + (s.nickname || "Explorateur");
  $("#avatarBtn").textContent = s.avatar || "🔭";
  $("#completedCount").textContent = s.completed.length;
  $("#cardCount").textContent = s.cards.length;
  $("#progressCount").textContent =
    Math.round(s.cards.length / Math.max(1, courses.length) * 100) + " %";
}

function courseCard(c) {
  return `<article class="course">
    <small>${esc(c.discipline)} · ${c.minutes || 15} min</small>
    <h3>${esc(c.title)}</h3>
    <p class="muted">${esc(c.summary || "")}</p>
  </article>`;
}

function home() {
  const current = findCourse(state().currentCourseId);
  return `
    <div class="eyebrow">TON ESPACE</div>
    <h1>Prêt à explorer ?</h1>
    <p class="intro">Chaque découverte enrichit tes connaissances.</p>
    <section class="pack">
      <div class="eyebrow" style="color:#d9f5f6">TA PROCHAINE AVENTURE</div>
      <h2>${current ? esc(current.title) : "Trois sujets. Une découverte."}</h2>
      <p>${current ? "Reprends ton cours là où tu en étais." :
      "Trois disciplines différentes. À toi de choisir !"}</p>
      <button class="btn light" id="${current ? "resume" : "openPack"}">
        ${current ? "Continuer le cours →" : "Ouvrir un pack ✦"}
      </button>
    </section>
    <h2 style="margin:22px 0 12px">Explorer Curios</h2>
    <div class="grid">
      <button class="tile" data-page="collections">
        <span class="ico">🗂️</span><b>Mes collections</b>
        <small>Mes cartes obtenues</small>
      </button>
      <button class="tile" data-page="encyclopedia">
        <span class="ico">📚</span><b>Encyclopédie</b>
        <small>Mes connaissances débloquées</small>
      </button>
    </div>`;
}

function collections() {
  const list = courses.filter(c => state().cards.includes(c.id));
  return `<div class="eyebrow">TA BIBLIOTHÈQUE</div>
    <h1>Mes collections</h1>
    <p class="intro">Tes cartes gagnées après chaque cours réussi.</p>
    ${list.length ? list.map(courseCard).join("") :
    '<div class="empty">🃏<h2>Aucune carte pour le moment</h2>Réussis ton premier quiz pour commencer !</div>'}`;
}

function encyclopedia() {
  const list = courses.filter(c =>
    state().cards.includes(c.id) &&
    (!query || c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.discipline.toLowerCase().includes(query.toLowerCase()))
  );
  return `<div class="eyebrow">SAVOIRS DÉBLOQUÉS</div>
    <h1>Encyclopédie</h1>
    <p class="intro">Retrouve les cours que tu as terminés.</p>
    <input class="search" id="search" placeholder="Rechercher un sujet…" value="${esc(query)}">
    ${list.length ? list.map(courseCard).join("") :
    '<div class="empty">Tes articles débloqués apparaîtront ici.</div>'}`;
}

function profile() {
  const s = state();
  return `<div class="eyebrow">ESPACE PERSONNEL</div>
    <h1>Mon profil</h1>
    <p class="intro">Aucun compte nécessaire : tes données restent sur cet appareil.</p>
    <section class="panel">
      <label>Pseudonyme</label>
      <input class="field" id="nickname" maxlength="24" value="${esc(s.nickname)}">
      <label>Avatar (emoji)</label>
      <input class="field" id="avatar" maxlength="4" value="${esc(s.avatar)}">
      <button class="btn" id="saveProfile">Enregistrer</button>
    </section>
    <section class="panel" style="margin-top:12px">
      <h2>Sauvegarde locale</h2>
      <p class="muted">Garde une copie de ta progression.</p>
      <button class="btn soft" id="export">Exporter ma sauvegarde</button>
    </section>`;
}

function render() {
  header();

  if (page === "lesson") {
    lesson();
  } else {
    $("#view").innerHTML =
      page === "home" ? home() :
      page === "collections" ? collections() :
      page === "encyclopedia" ? encyclopedia() :
      page === "profile" ? profile() : "";
  }

  document.querySelectorAll(".nav button").forEach(b =>
    b.classList.toggle("active", b.dataset.page === page)
  );
}

function openPack() {
  const pack = core.makePack(courses);
  if (!pack) {
    $("#view").innerHTML = '<div class="empty">Il ne reste pas assez de cours disponibles dans le catalogue.</div>';
    return;
  }

  const items = pack.map(findCourse).filter(Boolean);
  $("#view").innerHTML = `
    <div class="eyebrow">NOUVELLE DÉCOUVERTE</div>
    <h1>Choisis ton cours</h1>
    <p class="intro">Trois disciplines, trois univers. Les cours non choisis pourront revenir plus tard.</p>
    ${items.map(c => `
      <button class="tile" data-course="${esc(c.id)}" style="width:100%;margin:7px 0">
        <span class="ico">${esc(c.icon || "📘")}</span>
        <b>${esc(c.title)}</b>
        <small>${esc(c.discipline)} · ${c.minutes || 15} min</small>
        <p class="muted">${esc(c.summary || "")}</p>
        <strong>Découvrir →</strong>
      </button>`).join("")}
    <button class="btn soft" id="back">Retour</button>`;
}

function lesson() {
  const s = state();
  const c = findCourse(s.currentCourseId);
  if (!c) { page = "home"; render(); return; }

  const sections = c.sections || [];
  const index = s.currentSection || 0;

  if (index >= sections.length) {
    showQuiz(c);
    return;
  }

  const section = sections[index];
  $("#view").innerHTML = `
    <div class="eyebrow">${esc(c.discipline)} · PARTIE ${index + 1}/${sections.length}</div>
    <h1>${esc(c.title)}</h1>
    <p class="intro">${esc(c.lead || c.summary || "")}</p>
    <section class="panel">
      <h2>${esc(section[0])}</h2>
      <p style="line-height:1.75">${esc(section[1])}</p>
    </section>
    ${index === sections.length - 1 ? `
      <section class="panel" style="margin-top:12px">
        <h2>À retenir</h2><p>${esc(c.fact || c.card || "")}</p>
      </section>` : ""}
    <div style="display:flex;gap:9px;margin-top:16px">
      ${index > 0 ? '<button class="btn soft" id="previous">← Précédent</button>' : ""}
      <button class="btn" id="next" style="flex:1">
        ${index === sections.length - 1 ? "Passer au quiz →" : "Continuer →"}
      </button>
    </div>`;
}

function showQuiz(c) {
  const saved = state().quiz;

  if (!quiz || quiz.courseId !== c.id) {
    if (saved && saved.courseId === c.id && saved.questions) {
      quiz = saved;
    } else {
      const bank = [...(c.questions || [])];
      for (let i = bank.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bank[i], bank[j]] = [bank[j], bank[i]];
      }
      quiz = {
        courseId: c.id,
        questions: bank.slice(0, 5),
        answers: [],
        index: 0,
        score: 0
      };
      core.saveQuiz(quiz);
    }
  }

  if (quiz.index >= quiz.questions.length) {
    quizResult();
    return;
  }

  const q = quiz.questions[quiz.index];
  $("#view").innerHTML = `
    <div class="eyebrow">VÉRIFIE TES CONNAISSANCES</div>
    <h1>Quiz : ${esc(c.title)}</h1>
    <p class="intro">Question ${quiz.index + 1}/5 · 3 bonnes réponses minimum pour gagner la carte.</p>
    <section class="panel">
      <h2>${esc(q[0])}</h2>
      <div style="display:grid;gap:9px;margin-top:16px">
        ${q[1].map((a,i) => `<button class="tile answer" data-answer="${i}">${esc(a)}</button>`).join("")}
      </div>
      <p id="feedback" class="muted"></p>
      <button class="btn" id="nextQuestion" hidden>Continuer →</button>
    </section>`;
}

function quizResult() {
  const passed = quiz.score >= 3;
  $("#view").innerHTML = `
    <section class="panel" style="text-align:center">
      <div style="font-size:44px">${passed ? "🏆" : "📖"}</div>
      <h1>${passed ? "Bravo, cours réussi !" : "Encore un petit effort !"}</h1>
      <p>Résultat : <strong>${quiz.score}/5</strong></p>
      <p class="muted">${passed ? "Ta carte t'attend !" : "Il faut au moins 3 bonnes réponses. Tu peux recommencer."}</p>
      <button class="btn" id="finish">${passed ? "Récupérer ma carte" : "Recommencer le quiz"}</button>
    </section>`;
}

$("#view").addEventListener("input", e => {
  if (e.target.id === "search") {
    query = e.target.value;
    const pos = e.target.selectionStart;
    render();
    $("#search").focus();
    $("#search").setSelectionRange(pos, pos);
  }
});

document.querySelectorAll(".nav button").forEach(b =>
  b.addEventListener("click", () => {
    page = b.dataset.page;
    render();
  })
);

$("#avatarBtn").addEventListener("click", () => {
  page = "profile";
  render();
});

$("#view").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;

  if (b.dataset.page) { page = b.dataset.page; render(); return; }
  if (b.id === "openPack") { openPack(); return; }
  if (b.id === "resume") { page = "lesson"; render(); return; }
  if (b.id === "back") { page = "home"; render(); return; }

  if (b.dataset.course) {
    core.chooseCourse(b.dataset.course);
    quiz = null;
    page = "lesson";
    render();
    return;
  }

  if (b.id === "next") {
    const s = state();
    core.updateProgress((s.currentSection || 0) + 1);
    render();
    return;
  }

  if (b.id === "previous") {
    core.updateProgress(Math.max(0, (state().currentSection || 0) - 1));
    render();
    return;
  }

  if (b.classList.contains("answer")) {
    if (b.disabled) return;
    const q = quiz.questions[quiz.index];
    const answer = Number(b.dataset.answer);
    const correct = answer === q[2];
    if (correct) quiz.score++;
    quiz.answers.push(answer);

    b.parentElement.querySelectorAll("button").forEach((button,i) => {
      button.disabled = true;
      if (i === q[2]) button.style.borderColor = "#20aab5";
      else if (i === answer) button.style.borderColor = "#d66";
    });

    $("#feedback").textContent =
      (correct ? "Bonne réponse ! " : "Pas tout à fait. ") + (q[3] || "");
    $("#nextQuestion").hidden = false;
    core.saveQuiz(quiz);
    return;
  }

  if (b.id === "nextQuestion") {
    quiz.index++;
    core.saveQuiz(quiz);
    showQuiz(findCourse(quiz.courseId));
    return;
  }

  if (b.id === "finish") {
    if (quiz.score >= 3) {
      core.completeCourse(quiz.courseId);
      quiz = null;
      page = "collections";
      render();
    } else {
      quiz = null;
      core.saveQuiz(null);
      showQuiz(findCourse(state().currentCourseId));
    }
    return;
  }

  if (b.id === "saveProfile") {
    saveProfile($("#nickname").value.trim() || "Explorateur",
                $("#avatar").value.trim() || "🔭");
    render();
    return;
  }

  if (b.id === "export") {
    const blob = new Blob([core.exportBackup()], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "curios-sauvegarde.json";
    a.click();
    URL.revokeObjectURL(url);
  }
});

render();
})();
