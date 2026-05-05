import fs from 'fs';
const file = fs.readFileSync('src/lib/translations.ts', 'utf8');
const lines = file.split('\n');
// We just want to drop lines 1512 to the end and replace it with closing brace for the function
const newLines = lines.slice(0, 1512); // keeps lines 0 to 1511 (which is line 1 to 1512)
newLines[1511] = "  return translations[lang]?.[upperName] || translations['en']?.[upperName] || translations[lang]?.[internalName.toUpperCase()] || translations['en']?.[internalName.toUpperCase()] || internalName;\n}";

fs.writeFileSync('src/lib/translations.ts', newLines.join('\n'), 'utf8');
