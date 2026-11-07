const fs = require('fs');

async function run() {
  try {
    // 1. Lire le fichier de configuration des devises pour extraire les codes à garder
    const configRaw = fs.readFileSync('devises_config.json', 'utf8');
    const configData = JSON.parse(configRaw);
    
    // Crée un tableau des codes (ex: ['EUR', 'USD', 'GBP', ...])
    const codesCibles = configData.devises.map(d => d.code);

    // 2. Récupérer l'intégralité des taux depuis Frankfurter (Base EUR)
    // L'endpoint /v2/rates renvoie la liste complète à plat
    const response = await fetch('https://frankfurter.dev');
    const rows = await response.json();

    // 3. Transformer la réponse brute en un objet clé-valeur de taux
    // (Frankfurter /v2/rates renvoie un tableau d'objets avec {quote, rate})
    const tousLesTaux = {};
    // L'euro par rapport à lui-même vaut toujours 1.0
    tousLesTaux['EUR'] = 1.0; 
    
    rows.forEach(row => {
      tousLesTaux[row.quote] = row.rate;
    });

    // 4. Filtrer pour ne garder QUE les devises du fichier de configuration
    const tauxFiltres = {};
    codesCibles.forEach(code => {
      if (tousLesTaux[code] !== undefined) {
        tauxFiltres[code] = tousLesTaux[code];
      } else {
        // Optionnel : si une devise de votre liste n'est momentanément pas renvoyée par l'API
        tauxFiltres[code] = null; 
      }
    });

    // 5. Construire le fichier final taux.json propre pour l'application
    const resultatFinal = {
      base: "EUR",
      date: new Date().toISOString().split('T')[0],
      rates: tauxFiltres
    };

    // 6. Écrire le fichier final sur le dépôt
    fs.writeFileSync('taux.json', JSON.stringify(resultatFinal, null, 2), 'utf8');
    console.log("Filtrage réussi ! Fichier taux.json généré avec succès.");

  } catch (error) {
    console.error("Erreur lors du scraping ou du filtrage :", error);
    process.exit(1);
  }
}

run();
