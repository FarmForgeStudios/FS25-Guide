const fs = require('fs');
const glob = require('glob'); // wait actually I can just use child_process or search sync

const files = [
  'src/components/AIAssistant.tsx',
  'src/components/AnimalProduction.tsx',
  'src/components/CropRotation.tsx',
  'src/components/FinanceGuide.tsx',
  'src/components/InteractiveMap.tsx',
  'src/components/ProductionGuide.tsx',
  'src/components/StorageGuide.tsx',
  'src/components/Vehicles.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/language === 'fr' \? 'fr-FR' : 'en-US'/g, 'language');
    // For specific AI Assistant prompts:
    content = content.replace(/language === 'fr' \? 'French' : 'English'/g, "(language === 'fr' ? 'French' : language === 'de' ? 'German' : language === 'es' ? 'Spanish' : language === 'it' ? 'Italian' : language === 'pt' ? 'Portuguese' : language === 'pl' ? 'Polish' : language === 'ro' ? 'Romanian' : 'English')");
    fs.writeFileSync(file, content, 'utf8');
  }
});
console.log('done replacing language strings');
