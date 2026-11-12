/* Curios v2 — couche de démarrage
   Ce fichier vérifie le moteur et expose les actions de sauvegarde.
   Il est fourni séparément pour préparer l'intégration avec l'interface HTML.
*/
(() => {
  "use strict";

  function startCuriosV2() {
    if (!window.CURIOS_CORE) {
      console.error("Curios : core.js doit être chargé avant app-v2.js.");
      return false;
    }

    window.CURIOS_V2 = {
      getProgress: () => window.CURIOS_CORE.getState(),
      exportBackup() {
        const blob = new Blob(
          [window.CURIOS_CORE.exportBackup()],
          { type: "application/json" }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "curios-sauvegarde.json";
        link.click();
        URL.revokeObjectURL(url);
      },
      importBackup(file) {
        return new Promise((resolve, reject) => {
          if (!(file instanceof File)) {
            reject(new Error("Sélectionne un fichier de sauvegarde."));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            try {
              resolve(window.CURIOS_CORE.importBackup(String(reader.result)));
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
          reader.readAsText(file);
        });
      }
    };

    console.info("Curios v2 : moteur local initialisé.");
    return true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCuriosV2, { once: true });
  } else {
    startCuriosV2();
  }
})();
