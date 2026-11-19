const fs = require('fs');

async function run() {
  try {
    // 1. Lire le fichier de configuration des devises pour extraire les codes à garder
    const configRaw = fs.readFileSync('devises_config.json', 'utf8');
    const configData = JSON.parse(configRaw);
    
    // Extrait les codes cibles (ex: ['EUR', 'USD', 'GBP', ...])
    const codesCibles = configData.devises.map(d => d.code);

    // 2. Appel direct à Currency-API (mise à jour 7j/7 avec la date du jour)
    const response = await fetch('https://latest.currency-api.pages.dev/v1/currencies/eur.json');
    
    if (!response.ok) {
      throw new Error(`Erreur Currency-API: ${response.status}`);
    }
    
    const dataBrute = await response.json();

    if (!dataBrute || !dataBrute.eur) {
      throw new Error('Format JSON Currency-API invalide');
    }

    // 3. Convertir les clés en majuscules ("usd" -> "USD")
    const tousLesTaux = { EUR: 1.0 };
    for (const [codeMin, taux] of Object.entries(dataBrute.eur)) {
      tousLesTaux[codeMin.toUpperCase()] = taux;
    }

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
      date: dataBrute.date || new Date().toISOString().split('T')[0],
      rates: tauxFiltres
    };

    // 6. Écrire le fichier final sur le dépôt GitHub
    fs.writeFileSync('taux.json', JSON.stringify(resultatFinal, null, 2), 'utf8');
    console.log(`Filtrage réussi (${resultatFinal.date}) ! Le fichier taux.json a été mis à jour.`);

  } catch (error) {
    console.error("Erreur lors du scraping ou du filtrage :", error);
    process.exit(1);
  }
}

run();
