const fs = require('fs');

const file = fs.readFileSync('src/lib/translations.ts', 'utf8');

// The file exports:
// export type Language = 'fr' | 'en';
// export const translations: Record<Language, Record<string, string>> = { ... }

// We need to change the Language type
let newFile = file.replace(
  "export type Language = 'fr' | 'en';",
  "export type Language = 'fr' | 'en' | 'de' | 'es' | 'it' | 'pt' | 'pl' | 'ro';"
);

const lastBrace = newFile.lastIndexOf('}');

const appendTranslations = `  de: {
    'tab.dashboard': 'Dashboard',
    'tab.guide': 'Leitfaden',
    'tab.map': 'Karte',
    'tab.vehicles': 'Fahrzeuge',
    'tab.rotation': 'Rotation',
    'tab.storage': 'Lager',
    'tab.finance': 'Finanzen',
    'tab.animals': 'Tiere',
    'tab.production': 'Produktion'
  },
  es: {
    'tab.dashboard': 'Panel',
    'tab.guide': 'Guía',
    'tab.map': 'Mapa',
    'tab.vehicles': 'Vehículos',
    'tab.rotation': 'Rotación',
    'tab.storage': 'Almacenamiento',
    'tab.finance': 'Finanzas',
    'tab.animals': 'Animales',
    'tab.production': 'Producción'
  },
  it: {
    'tab.dashboard': 'Pannello',
    'tab.guide': 'Guida',
    'tab.map': 'Mappa',
    'tab.vehicles': 'Veicoli',
    'tab.rotation': 'Rotazione',
    'tab.storage': 'Stoccaggio',
    'tab.finance': 'Finanza',
    'tab.animals': 'Animali',
    'tab.production': 'Produzione'
  },
  pt: {
    'tab.dashboard': 'Painel',
    'tab.guide': 'Guia',
    'tab.map': 'Mapa',
    'tab.vehicles': 'Veículos',
    'tab.rotation': 'Rotação',
    'tab.storage': 'Armazenamento',
    'tab.finance': 'Finanças',
    'tab.animals': 'Animais',
    'tab.production': 'Produção'
  },
  pl: {
    'tab.dashboard': 'Pulpit',
    'tab.guide': 'Przewodnik',
    'tab.map': 'Mapa',
    'tab.vehicles': 'Pojazdy',
    'tab.rotation': 'Rotacja',
    'tab.storage': 'Magazyn',
    'tab.finance': 'Finanse',
    'tab.animals': 'Zwierzęta',
    'tab.production': 'Produkcja'
  },
  ro: {
    'tab.dashboard': 'Panou',
    'tab.guide': 'Ghid',
    'tab.map': 'Hartă',
    'tab.vehicles': 'Vehicule',
    'tab.rotation': 'Rotație',
    'tab.storage': 'Depozitare',
    'tab.finance': 'Finanțe',
    'tab.animals': 'Animale',
    'tab.production': 'Producție'
  }
};
`;

newFile = newFile.substring(0, lastBrace) + ",\n" + appendTranslations;

fs.writeFileSync('src/lib/translations.ts', newFile, 'utf8');
console.log('done');
