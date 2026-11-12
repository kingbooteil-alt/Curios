/* Curios v2 — moteur local
   Module indépendant : sauvegarde, progression, packs et sauvegardes exportables.
   Il ne remplace pas encore l'ancien app.js à lui seul.
*/
(() => {
  "use strict";
  const STORAGE_KEY = "curios-save-v2";

  const freshState = () => ({
    version: 2,
    nickname: "Explorateur",
    avatar: "🔭",
    completed: [],
    cards: [],
    currentCourseId: null,
    currentSection: 0,
    quiz: null,
    pack: null
  });

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return saved && typeof saved === "object"
        ? { ...freshState(), ...saved }
        : freshState();
    } catch {
      return freshState();
    }
  }

  let state = load();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function makePack(catalogue, random = Math.random) {
    const completed = new Set(state.completed);
    const current = state.currentCourseId;
    const pool = catalogue.filter(course =>
      !completed.has(course.id) && course.id !== current
    );

    const byDiscipline = new Map();
    for (const course of pool) {
      if (!byDiscipline.has(course.discipline)) byDiscipline.set(course.discipline, []);
      byDiscipline.get(course.discipline).push(course);
    }

    const groups = [...byDiscipline.values()];
    if (groups.length < 3) return null;

    for (let i = groups.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [groups[i], groups[j]] = [groups[j], groups[i]];
    }

    state.pack = groups.slice(0, 3).map(group =>
      group[Math.floor(random() * group.length)].id
    );
    save();
    return [...state.pack];
  }

  function chooseCourse(courseId) {
    if (!Array.isArray(state.pack) || !state.pack.includes(courseId)) {
      throw new Error("Ce cours ne fait pas partie du pack actuel.");
    }
    // Les deux cours non choisis ne sont pas supprimés du catalogue.
    state.currentCourseId = courseId;
    state.currentSection = 0;
    state.quiz = null;
    state.pack = null;
    save();
    return state;
  }

  function updateProgress(sectionIndex) {
    state.currentSection = Math.max(0, Number(sectionIndex) || 0);
    save();
  }

  function saveQuiz(quizState) {
    state.quiz = quizState ? structuredClone(quizState) : null;
    save();
  }

  function completeCourse(courseId) {
    if (!state.completed.includes(courseId)) state.completed.push(courseId);
    if (!state.cards.includes(courseId)) state.cards.push(courseId);
    state.currentCourseId = null;
    state.currentSection = 0;
    state.quiz = null;
    save();
  }

  function exportBackup() {
    return JSON.stringify({
      app: "Curios",
      version: 2,
      exportedAt: new Date().toISOString(),
      state
    }, null, 2);
  }

  function importBackup(jsonText) {
    const parsed = JSON.parse(jsonText);
    const imported = parsed?.state;
    if (parsed?.app !== "Curios" || !imported || !Array.isArray(imported.completed)) {
      throw new Error("Ce fichier n'est pas une sauvegarde Curios valide.");
    }
    state = { ...freshState(), ...imported, version: 2 };
    save();
    return state;
  }

  window.CURIOS_CORE = {
    getState: () => structuredClone(state),
    save,
    makePack,
    chooseCourse,
    updateProgress,
    saveQuiz,
    completeCourse,
    exportBackup,
    importBackup,
    reset: () => { state = freshState(); save(); return state; }
  };
})();
