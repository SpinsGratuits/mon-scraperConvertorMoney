const fs = require('fs');

async function run() {
  try {
    // 1. Lire le fichier de configuration des devises pour extraire les codes à garder
    const configRaw = fs.readFileSync('devises_config.json', 'utf8');
    const configData = JSON.parse(configRaw);
    
    // Extrait les codes cibles (ex: ['EUR', 'USD', 'GBP', ...])
    const codesCibles = configData.devises.map(d => d.code);

    // 2. Appel à la bonne adresse d'API Frankfurter v2
    const response = await fetch('https://api.frankfurter.dev/v2/rates');
    
    if (!response.ok) {
      throw new Error(`Erreur API Frankfurter: ${response.status}`);
    }
    
    // L'API v2 renvoie directement un tableau d'objets JSON
    const tableauBrut = await response.json();

    // 3. Convertir le tableau d'objets en un dictionnaire clé-valeur propre
    const tousLesTaux = {};
    
    // L'euro par rapport à lui-même vaut toujours 1.0
    tousLesTaux['EUR'] = 1.0; 
    
    // On parcourt chaque élément du tableau pour l'ajouter au dictionnaire
    tableauBrut.forEach(item => {
      if (item.quote && item.rate) {
        tousLesTaux[item.quote] = item.rate;
      }
    });

    // 4. Filtrer pour ne garder QUE les devises de devises_config.json
    const tauxFiltres = {};
    codesCibles.forEach(code => {
      if (tousLesTaux[code] !== undefined) {
        tauxFiltres[code] = tousLesTaux[code];
      } else {
        tauxFiltres[code] = null; 
      }
    });

    // 5. Construire l'objet final taux.json
    const resultatFinal = {
      base: "EUR",
      date: tableauBrut[0]?.date || new Date().toISOString().split('T')[0],
      rates: tauxFiltres
    };

    // 6. Écrire le fichier final sur le dépôt GitHub
    fs.writeFileSync('taux.json', JSON.stringify(resultatFinal, null, 2), 'utf8');
    console.log("Filtrage réussi ! Le fichier taux.json a été mis à jour.");

  } catch (error) {
    console.error("Erreur lors du scraping ou du filtrage :", error);
    process.exit(1);
  }
}

run();
