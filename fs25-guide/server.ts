import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import os from "os";
import AdmZip from "adm-zip";
import { convertDdsToPng } from "@marcuth/dds-to-png";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
    console.log(`\n===================================================`);
    console.log(` ATTENTION: Clé d'API Gemini manquante !`);
    console.log(` L'assistant IA ne fonctionnera pas.`);
    console.log(` Veuillez créer un fichier .env à la racine du projet`);
    console.log(` et y ajouter: GEMINI_API_KEY=votre_cle_api`);
    console.log(`===================================================\n`);
  } else {
    console.log("SERVER STARTING. GEMINI_API_KEY exists: true");
  }

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasApiKey: !!process.env.API_KEY,
      geminiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 4) : null
    });
  });

  app.get("/api/env", (req, res) => {
    res.json({
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY || ''
    });
  });

  app.use(express.json({ limit: '50mb' }));

  // In-memory store for field data synced from the game
  let latestMapData: any = { fields: [], prices: {}, storage: {} };
  let lastFileMtime = 0;
  let manualData: any = null;

  app.post("/api/manual-data", (req, res) => {
    manualData = req.body;
    res.json({ status: "ok" });
  });

  app.get("/api/manual-data", (req, res) => {
    res.json(manualData || {});
  });

  const pdaImages = new Map<string, { image: string, timestamp: number }>();
  
  function getPdaImagePath(mapName: string) {
    const cleanName = mapName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(os.homedir(), 'Documents', 'My Games', 'FarmingSimulator2025', 'modSettings', 'FS25_WebSync', `pdaImage_${cleanName}.txt`);
  }

  app.post("/api/pda-image", (req, res) => {
    try {
      if (req.body && req.body.image !== undefined) {
        const mapName = req.body.mapName || 'global';
        const image = req.body.image;
        const timestamp = Date.now();
        
        pdaImages.set(mapName, { image, timestamp });
        
        // Save to disk
        try {
          const imgPath = getPdaImagePath(mapName);
          const dir = path.dirname(imgPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          
          if (image) {
            fs.writeFileSync(imgPath, image, 'utf-8');
          } else if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        } catch (e) {
          console.error("Could not save pdaImage to disk", e);
        }
      }
      res.json({ status: "ok" });
    } catch (err) {
      res.status(400).json({ status: "error" });
    }
  });

  app.get("/api/pda-image", (req, res) => {
    const mapName = (req.query.mapName as string) || 'global';
    const clientTimestamp = parseInt(req.query.t as string) || 0;
    
    // Lazy load from disk if not in memory
    if (!pdaImages.has(mapName)) {
      try {
        const imgPath = getPdaImagePath(mapName);
        if (fs.existsSync(imgPath)) {
          pdaImages.set(mapName, {
            image: fs.readFileSync(imgPath, 'utf-8'),
            timestamp: fs.statSync(imgPath).mtimeMs
          });
        }
      } catch (e) {
        console.error("Could not load pdaImage from disk", e);
      }
    }

    const mapData = pdaImages.get(mapName);
    
    if (mapData) {
      if (mapData.timestamp > 0 && clientTimestamp === mapData.timestamp) {
        return res.json({ unchanged: true, timestamp: mapData.timestamp });
      }
      return res.json({ image: mapData.image, timestamp: mapData.timestamp });
    }
    
    res.json({ image: null, timestamp: 0 });
  });

  app.post("/api/convert-dds", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }
      
      const base64Data = image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const tempDds = path.join(os.tmpdir(), `temp_${Date.now()}.dds`);
      const tempPng = path.join(os.tmpdir(), `temp_${Date.now()}.png`);
      
      fs.writeFileSync(tempDds, buffer);
      await convertDdsToPng(tempDds, tempPng);
      
      const pngBuffer = fs.readFileSync(tempPng);
      const pngBase64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;
      
      // Cleanup
      try { fs.unlinkSync(tempDds); } catch (e) {}
      try { fs.unlinkSync(tempPng); } catch (e) {}
      
      res.json({ image: pngBase64 });
    } catch (e) {
      console.error("Error converting DDS", e);
      res.status(500).json({ error: "Failed to convert DDS" });
    }
  });

  app.get("/api/auto-map-image", async (req, res) => {
    try {
      const fs25Path = path.join(os.homedir(), 'Documents', 'My Games', 'FarmingSimulator2025');
      if (!fs.existsSync(fs25Path)) {
        return res.status(404).json({ error: "FS25 folder not found" });
      }

      // Find most recent savegame
      let latestSavegame = null;
      
      if (latestMapData && latestMapData.savegameIndex && latestMapData.savegameIndex > 0) {
        const savePath = path.join(fs25Path, `savegame${latestMapData.savegameIndex}`, 'careerSavegame.xml');
        if (fs.existsSync(savePath)) {
          latestSavegame = savePath;
        }
      }

      if (!latestSavegame) {
        let latestMtime = 0;
        for (let i = 1; i <= 20; i++) {
          const savePath = path.join(fs25Path, `savegame${i}`, 'careerSavegame.xml');
          if (fs.existsSync(savePath)) {
            const stats = fs.statSync(savePath);
            if (stats.mtimeMs > latestMtime) {
              latestMtime = stats.mtimeMs;
              latestSavegame = savePath;
            }
          }
        }
      }

      if (!latestSavegame) {
        return res.status(404).json({ error: "No savegame found" });
      }

      const xmlContent = fs.readFileSync(latestSavegame, 'utf-8');
      
      const mapIdMatch = xmlContent.match(/<mapId>(.*?)<\/mapId>/);
      const mapTitleMatch = xmlContent.match(/<mapTitle>(.*?)<\/mapTitle>/);
      
      const mapId = mapIdMatch ? mapIdMatch[1] : null;
      const mapTitle = mapTitleMatch ? mapTitleMatch[1] : null;

      if (!mapId && !mapTitle) {
        return res.status(404).json({ error: "Could not determine map name" });
      }

      const modsPath = path.join(fs25Path, 'mods');
      if (!fs.existsSync(modsPath)) {
        return res.status(404).json({ error: "Mods folder not found" });
      }

      const mods = fs.readdirSync(modsPath).filter(f => f.endsWith('.zip'));
      
      const searchTerms: string[] = [];
      if (mapTitle) searchTerms.push(mapTitle.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (mapId) {
        let cleanMapId = mapId.toLowerCase();
        if (cleanMapId.endsWith('.map')) cleanMapId = cleanMapId.replace('.map', '');
        if (cleanMapId.startsWith('mod_')) cleanMapId = cleanMapId.replace('mod_', '');
        searchTerms.push(cleanMapId);
      }
      
      const candidateMods = mods.filter(mod => {
        const modClean = mod.toLowerCase().replace('.zip', '').replace(/[^a-z0-9]/g, '');
        return searchTerms.some(term => modClean.includes(term) || term.includes(modClean));
      });

      // Sort by modified date descending
      candidateMods.sort((a, b) => {
        return fs.statSync(path.join(modsPath, b)).mtimeMs - fs.statSync(path.join(modsPath, a)).mtimeMs;
      });

      let foundDdsBuffer: Buffer | null = null;

      for (const mod of candidateMods) {
        try {
          const zip = new AdmZip(path.join(modsPath, mod));
          const zipEntries = zip.getEntries();
          
          const overviewEntry = zipEntries.find(entry => {
            const name = entry.entryName.toLowerCase();
            return name.includes('overview') && name.endsWith('.dds');
          });
          
          if (overviewEntry) {
            foundDdsBuffer = overviewEntry.getData();
            break;
          }
        } catch (e) {
          // Ignore zip read errors
        }
      }

      if (foundDdsBuffer) {
        try {
          const tempDds = path.join(os.tmpdir(), `temp_${Date.now()}.dds`);
          const tempPng = path.join(os.tmpdir(), `temp_${Date.now()}.png`);
          
          fs.writeFileSync(tempDds, foundDdsBuffer);
          await convertDdsToPng(tempDds, tempPng);
          
          const pngBuffer = fs.readFileSync(tempPng);
          const base64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;
          
          // Cleanup
          try { fs.unlinkSync(tempDds); } catch (e) {}
          try { fs.unlinkSync(tempPng); } catch (e) {}
          
          // Also save it to the current store
          const resolvedMapName = mapTitle || mapId || 'global';
          const timestamp = Date.now();
          pdaImages.set(resolvedMapName, { image: base64, timestamp });
          
          try {
            const imgPath = getPdaImagePath(resolvedMapName);
            const dir = path.dirname(imgPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(imgPath, base64, 'utf-8');
          } catch (e) {}
          
          return res.json({ image: base64, source: 'auto' });
        } catch (e) {
          console.error("Error converting DDS to PNG", e);
          return res.status(500).json({ error: "Failed to convert DDS to PNG" });
        }
      }

      return res.status(404).json({ error: "Map overview image not found in mods" });
    } catch (err) {
      console.error("Error in auto-map-image", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/auto-fields", async (req, res) => {
    try {
      const fs25Path = path.join(os.homedir(), 'Documents', 'My Games', 'FarmingSimulator2025');
      if (!fs.existsSync(fs25Path)) {
        return res.status(404).json({ error: "FS25 folder not found" });
      }

      // Find most recent savegame to get mapId
      let latestSavegame = null;
      
      if (latestMapData && latestMapData.savegameIndex && latestMapData.savegameIndex > 0) {
        const savePath = path.join(fs25Path, `savegame${latestMapData.savegameIndex}`, 'careerSavegame.xml');
        if (fs.existsSync(savePath)) {
          latestSavegame = savePath;
        }
      }

      if (!latestSavegame) {
        let latestMtime = 0;
        for (let i = 1; i <= 20; i++) {
          const savePath = path.join(fs25Path, `savegame${i}`, 'careerSavegame.xml');
          if (fs.existsSync(savePath)) {
            const stats = fs.statSync(savePath);
            if (stats.mtimeMs > latestMtime) {
              latestMtime = stats.mtimeMs;
              latestSavegame = savePath;
            }
          }
        }
      }

      if (!latestSavegame) return res.status(404).json({ error: "No savegame found" });

      const xmlContent = fs.readFileSync(latestSavegame, 'utf-8');
      const mapId = (xmlContent.match(/<mapId>(.*?)<\/mapId>/) || [])[1];
      const mapTitle = (xmlContent.match(/<mapTitle>(.*?)<\/mapTitle>/) || [])[1];

      if (!mapId && !mapTitle) return res.status(404).json({ error: "Could not determine map name" });

      const modsPath = path.join(fs25Path, 'mods');
      if (!fs.existsSync(modsPath)) return res.status(404).json({ error: "Mods folder not found" });

      const mods = fs.readdirSync(modsPath).filter(f => f.endsWith('.zip'));
      const searchTerms = [];
      if (mapTitle) searchTerms.push(mapTitle.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (mapId) {
        let cleanMapId = mapId.toLowerCase();
        if (cleanMapId.endsWith('.map')) cleanMapId = cleanMapId.replace('.map', '');
        if (cleanMapId.startsWith('mod_')) cleanMapId = cleanMapId.replace('mod_', '');
        searchTerms.push(cleanMapId);
      }

      const candidateMods = mods.filter(mod => {
        const modClean = mod.toLowerCase().replace('.zip', '').replace(/[^a-z0-9]/g, '');
        return searchTerms.some(term => modClean.includes(term) || term.includes(modClean));
      });

      candidateMods.sort((a, b) => fs.statSync(path.join(modsPath, b)).mtimeMs - fs.statSync(path.join(modsPath, a)).mtimeMs);

      let foundFields: any[] = [];

      for (const mod of candidateMods) {
        try {
          const zip = new AdmZip(path.join(modsPath, mod));
          const zipEntries = zip.getEntries();
          
          // Look for map.xml or fields.xml
          const fieldsEntry = zipEntries.find(e => e.entryName.toLowerCase().endsWith('fields.xml'));
          const mapEntry = zipEntries.find(e => e.entryName.toLowerCase().endsWith('map.xml'));
          
          let fieldsXml = "";
          if (fieldsEntry) {
            fieldsXml = fieldsEntry.getData().toString('utf-8');
          } else if (mapEntry) {
            // Check if map.xml contains field definitions or a reference
            const mapXml = mapEntry.getData().toString('utf-8');
            const fieldsFileMatch = mapXml.match(/<fields\s+filename="(.*?)"/);
            if (fieldsFileMatch) {
              const fieldsFileName = fieldsFileMatch[1].replace(/\\/g, '/');
              const relativeEntry = zipEntries.find(e => e.entryName.toLowerCase().endsWith(fieldsFileName.toLowerCase()));
              if (relativeEntry) {
                fieldsXml = relativeEntry.getData().toString('utf-8');
              }
            }
          }

          if (fieldsXml) {
            // Basic regex parsing of fields.xml
            const fieldMatches = fieldsXml.matchAll(/<field\s+id="(\d+)"(?:(?!<field)[\s\S])*?position="([-0-9.]+)\s+([-0-9.]+)(?:\s+([-0-9.]+))?"/g);
            for (const match of fieldMatches) {
              foundFields.push({
                id: match[1],
                x: parseFloat(match[2]),
                z: match[4] ? parseFloat(match[4]) : parseFloat(match[3])
              });
            }
            
            // If no position attribute, try searching for fieldArea center
            if (foundFields.length === 0) {
                const fieldBlocks = fieldsXml.matchAll(/<field\s+id="(\d+)"(?:(?!<field)[\s\S])*?<fieldArea(?:(?!<field)[\s\S])*?center="([-0-9.]+)\s+([-0-9.]+)(?:\s+([-0-9.]+))?"/g);
                for (const match of fieldBlocks) {
                    foundFields.push({
                        id: match[1],
                        x: parseFloat(match[2]),
                        z: match[4] ? parseFloat(match[4]) : parseFloat(match[3])
                    });
                }
            }

            if (foundFields.length > 0) break;
          }
        } catch (e) {
          // Ignore zip read errors
        }
      }

      res.json({ fields: foundFields });
    } catch (err) {
      console.error("Error in auto-fields", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/scan-savegame", async (req, res) => {
    try {
      const fs25Path = path.join(os.homedir(), 'Documents', 'My Games', 'FarmingSimulator2025');
      if (!fs.existsSync(fs25Path)) {
        return res.status(404).json({ error: "FS25 folder not found" });
      }

      // Find most recent savegame
      let latestSavegameDir = null;
      
      if (latestMapData && latestMapData.savegameIndex && latestMapData.savegameIndex > 0) {
        const saveDir = path.join(fs25Path, `savegame${latestMapData.savegameIndex}`);
        const careerPath = path.join(saveDir, 'careerSavegame.xml');
        if (fs.existsSync(careerPath)) {
          latestSavegameDir = saveDir;
        }
      }

      if (!latestSavegameDir) {
        let latestMtime = 0;
        for (let i = 1; i <= 20; i++) {
          const saveDir = path.join(fs25Path, `savegame${i}`);
          const careerPath = path.join(saveDir, 'careerSavegame.xml');
          if (fs.existsSync(careerPath)) {
            const stats = fs.statSync(careerPath);
            if (stats.mtimeMs > latestMtime) {
              latestMtime = stats.mtimeMs;
              latestSavegameDir = saveDir;
            }
          }
        }
      }

      if (!latestSavegameDir) {
        return res.status(404).json({ error: "No savegame found" });
      }

      const results: any = {
        fields: [],
        farmlands: [],
        ownedProductions: [],
        fieldStates: []
      };

      // Read fields.xml for crop and growth state
      const fieldsXmlPath = path.join(latestSavegameDir, 'fields.xml');
      if (fs.existsSync(fieldsXmlPath)) {
        const content = fs.readFileSync(fieldsXmlPath, 'utf-8');
        
        // FS25 fields.xml structure: <field id="1" ... fruitType="WHEAT" growthState="5" ... />
        // We'll extract each field block first to be more robust
        const fieldBlocks = content.match(/<field\s+id="\d+"(?:(?!<field)[\s\S])*?(?:\/>|<\/field>)/g) || [];
        
        for (const block of fieldBlocks) {
          const idMatch = block.match(/id="(\d+)"/);
          const fruitMatch = block.match(/(?:fruitType|fillType)="([^"]*)"/) || block.match(/<fruitType>([^<]*)<\/fruitType>/);
          const growthMatch = block.match(/growthState="([^"]*)"/) || block.match(/<growthState>([^<]*)<\/growthState>/);
          const fertMatch = block.match(/fertilizerLevel="([^"]*)"/) || block.match(/<fertilizerLevel>([^<]*)<\/fertilizerLevel>/);
          const limeMatch = block.match(/limeLevel="([^"]*)"/) || block.match(/<limeLevel>([^<]*)<\/limeLevel>/);
          const plowMatch = block.match(/plowLevel="([^"]*)"/) || block.match(/<plowLevel>([^<]*)<\/plowLevel>/);
          const weedMatch = block.match(/weedLevel="([^"]*)"/) || block.match(/<weedLevel>([^<]*)<\/weedLevel>/);

          if (idMatch) {
            results.fieldStates.push({
              id: idMatch[1],
              fruitType: fruitMatch ? fruitMatch[1] : 'Inconnu',
              growthState: growthMatch ? growthMatch[1] : 'Inconnu',
              fertilizer: fertMatch ? fertMatch[1] : '0',
              lime: limeMatch ? limeMatch[1] : '0',
              plow: plowMatch ? plowMatch[1] : '0',
              weed: weedMatch ? weedMatch[1] : '0'
            });
          }
        }
        
        // If no matches with attributes, try nested tags (older FS style or specific mods)
        if (results.fieldStates.length === 0) {
          const nestedMatches = content.matchAll(/<field\s+id="(\d+)">[\s\S]*?<fruitType>([^<]*)<\/fruitType>[\s\S]*?<growthState>([^<]*)<\/growthState>/g);
          for (const match of nestedMatches) {
            results.fieldStates.push({
              id: match[1],
              fruitType: match[2],
              growthState: match[3],
              fertilizer: '0',
              lime: '0',
              plow: '0',
              weed: '0'
            });
          }
        }
      }

      // Read placeables.xml for owned productions
      const placeablesPath = path.join(latestSavegameDir, 'placeables.xml');
      if (fs.existsSync(placeablesPath)) {
        const content = fs.readFileSync(placeablesPath, 'utf-8');
        // Match placeables with a farmId that isn't 0
        const matches = content.matchAll(/<placeable[\s\S]*?farmId="([1-9]\d*)"[\s\S]*?templateName="(.*?)"/g);
        for (const match of matches) {
          results.ownedProductions.push({
            templateName: match[2],
            farmId: match[1]
          });
        }
      }

      // Read farmland.xml for ownership
      const farmlandPath = path.join(latestSavegameDir, 'farmland.xml');
      if (fs.existsSync(farmlandPath)) {
        const content = fs.readFileSync(farmlandPath, 'utf-8');
        const matches = content.matchAll(/<farmland id="(\d+)" farmId="(\d+)"/g);
        for (const match of matches) {
          results.farmlands.push({
            id: match[1],
            farmId: match[2],
            isOwned: match[2] !== "0"
          });
        }
      }

      // Read careerSavegame.xml for general info
      const careerPath = path.join(latestSavegameDir, 'careerSavegame.xml');
      if (fs.existsSync(careerPath)) {
        const content = fs.readFileSync(careerPath, 'utf-8');
        results.mapTitle = (content.match(/<mapTitle>(.*?)<\/mapTitle>/) || [])[1];
        results.mapId = (content.match(/<mapId>(.*?)<\/mapId>/) || [])[1];
        results.money = (content.match(/<money>(.*?)<\/money>/) || [])[1];
      }

      res.json(results);
    } catch (err) {
      console.error("Error scanning savegame", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/map-productions", async (req, res) => {
    try {
      const fs25Path = path.join(os.homedir(), 'Documents', 'My Games', 'FarmingSimulator2025');
      if (!fs.existsSync(fs25Path)) {
        return res.status(404).json({ error: "FS25 folder not found" });
      }

      // Find most recent savegame to get mapId
      let latestSavegame = null;
      
      if (latestMapData && latestMapData.savegameIndex && latestMapData.savegameIndex > 0) {
        const savePath = path.join(fs25Path, `savegame${latestMapData.savegameIndex}`, 'careerSavegame.xml');
        if (fs.existsSync(savePath)) {
          latestSavegame = savePath;
        }
      }

      if (!latestSavegame) {
        let latestMtime = 0;
        for (let i = 1; i <= 20; i++) {
          const savePath = path.join(fs25Path, `savegame${i}`, 'careerSavegame.xml');
          if (fs.existsSync(savePath)) {
            const stats = fs.statSync(savePath);
            if (stats.mtimeMs > latestMtime) {
              latestMtime = stats.mtimeMs;
              latestSavegame = savePath;
            }
          }
        }
      }

      if (!latestSavegame) return res.status(404).json({ error: "No savegame found" });

      const xmlContent = fs.readFileSync(latestSavegame, 'utf-8');
      const mapId = (xmlContent.match(/<mapId>(.*?)<\/mapId>/) || [])[1];
      const mapTitle = (xmlContent.match(/<mapTitle>(.*?)<\/mapTitle>/) || [])[1];

      if (!mapId && !mapTitle) return res.status(404).json({ error: "Could not determine map name" });

      const modsPath = path.join(fs25Path, 'mods');
      if (!fs.existsSync(modsPath)) return res.status(404).json({ error: "Mods folder not found" });

      const mods = fs.readdirSync(modsPath);
      const searchTerms = [];
      if (mapTitle) searchTerms.push(mapTitle.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (mapId) {
        let cleanMapId = mapId.toLowerCase();
        if (cleanMapId.endsWith('.map')) cleanMapId = cleanMapId.replace('.map', '');
        if (cleanMapId.startsWith('mod_')) cleanMapId = cleanMapId.replace('mod_', '');
        searchTerms.push(cleanMapId);
      }

      const candidateMods = mods.filter(mod => {
        const modClean = mod.toLowerCase().replace('.zip', '').replace(/[^a-z0-9]/g, '');
        return searchTerms.some(term => modClean.includes(term) || term.includes(modClean));
      });

      candidateMods.sort((a, b) => fs.statSync(path.join(modsPath, b)).mtimeMs - fs.statSync(path.join(modsPath, a)).mtimeMs);

      let mapProductions: any[] = [];

      for (const mod of candidateMods) {
        try {
          const modPath = path.join(modsPath, mod);
          const isDir = fs.statSync(modPath).isDirectory();
          
          if (isDir) {
            // It's an extracted folder
            let placeablesDir = path.join(modPath, 'maps', 'placeables');
            if (!fs.existsSync(placeablesDir)) {
              placeablesDir = path.join(modPath, 'placeables');
            }
            if (fs.existsSync(placeablesDir)) {
              const scanDir = (dir: string) => {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                  const fullPath = path.join(dir, file);
                  if (fs.statSync(fullPath).isDirectory()) {
                    scanDir(fullPath);
                  } else if (file.toLowerCase().endsWith('.xml')) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    processPlaceableXml(content, file, mapProductions);
                  }
                }
              };
              scanDir(placeablesDir);
            }
          } else if (mod.endsWith('.zip')) {
            // It's a zip file
            const zip = new AdmZip(modPath);
            const zipEntries = zip.getEntries();
            
            const placeableEntries = zipEntries.filter(e => 
              e.entryName.toLowerCase().includes('placeables/') && 
              e.entryName.toLowerCase().endsWith('.xml')
            );
            
            for (const entry of placeableEntries) {
              const content = entry.getData().toString('utf-8');
              processPlaceableXml(content, entry.entryName, mapProductions);
            }
          }
          
          if (mapProductions.length > 0) break; // Found productions in this mod, stop searching
        } catch (e) {
          // Ignore errors for individual mods
        }
      }

      res.json({ productions: mapProductions });
    } catch (err) {
      console.error("Error in map-productions", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  function processPlaceableXml(content: string, filename: string, mapProductions: any[]) {
    if (content.includes('<category>productionPoints</category>') || content.includes('<productionPoint>')) {
      // Extract name
      let name = "Unknown Production";
      const nameMatch = content.match(/<name>(.*?)<\/name>/);
      if (nameMatch) {
        name = nameMatch[1];
        if (name.startsWith('$l10n_')) {
          name = name.replace('$l10n_', '');
        }
      } else {
        // Try to get name from filename
        name = path.basename(filename, '.xml');
      }

      // Extract inputs and outputs
      const inputs: string[] = [];
      const outputs: string[] = [];
      
      const inputMatches = content.matchAll(/<input\s+[^>]*fillType="([^"]+)"/g);
      for (const match of inputMatches) {
        if (!inputs.includes(match[1])) inputs.push(match[1]);
      }
      
      const outputMatches = content.matchAll(/<output\s+[^>]*fillType="([^"]+)"/g);
      for (const match of outputMatches) {
        if (!outputs.includes(match[1])) outputs.push(match[1]);
      }

      if (inputs.length > 0 || outputs.length > 0) {
        mapProductions.push({
          name: name,
          inputs: inputs,
          outputs: outputs,
          isMapMod: true
        });
      }
    }
  }

  // API endpoint for the FS25 mod to POST data (if using a bridge)
  app.post("/api/sync", (req, res) => {
    try {
      if (req.body) {
        latestMapData = req.body;
        lastFileMtime = Date.now(); // Prevent local file from immediately overwriting this
      }
      res.json({ status: "ok" });
    } catch (err) {
      console.error("[Sync] Error parsing incoming data", err);
      res.status(400).json({ status: "error", message: "Invalid data" });
    }
  });

  // API endpoint for the frontend to GET data
  app.get("/api/sync", (req, res) => {
    try {
      // Automatically read the file generated by the FS25 Lua mod
      const docsPath = path.join(os.homedir(), 'Documents', 'My Games', 'FarmingSimulator2025', 'modSettings', 'FS25_WebSync', 'data.json');
      const now = Date.now();
      let isGameRunning = false;

      if (fs.existsSync(docsPath)) {
        const stats = fs.statSync(docsPath);
        // Only read the file if it's newer than the last POST or last read
        if (stats.mtimeMs > lastFileMtime) {
          const fileData = fs.readFileSync(docsPath, 'utf-8');
          const parsedData = JSON.parse(fileData);
          latestMapData = parsedData;
          lastFileMtime = stats.mtimeMs;
        }
      }

      // Check if data was updated in the last 30 seconds
      if (now - lastFileMtime < 30000) {
        isGameRunning = true;
      }

      if (!isGameRunning) {
        latestMapData = {};
        return res.json({ isGameRunning: false });
      }
      
      // If map name is missing or unknown, try to get it from the latest savegame
      if (!latestMapData.mapName || latestMapData.mapName === 'UnknownMap') {
        const fs25Path = path.join(os.homedir(), 'Documents', 'My Games', 'FarmingSimulator2025');
        if (fs.existsSync(fs25Path)) {
          let latestCareerPath = null;
          
          if (latestMapData.savegameIndex && latestMapData.savegameIndex > 0) {
            const savePath = path.join(fs25Path, `savegame${latestMapData.savegameIndex}`, 'careerSavegame.xml');
            if (fs.existsSync(savePath)) {
              latestCareerPath = savePath;
            }
          }

          if (!latestCareerPath) {
            let latestMtime = 0;
            for (let i = 1; i <= 20; i++) {
              const careerPath = path.join(fs25Path, `savegame${i}`, 'careerSavegame.xml');
              if (fs.existsSync(careerPath)) {
                const stats = fs.statSync(careerPath);
                if (stats.mtimeMs > latestMtime) {
                  latestMtime = stats.mtimeMs;
                  latestCareerPath = careerPath;
                }
              }
            }
          }
          
          if (latestCareerPath) {
            const content = fs.readFileSync(latestCareerPath, 'utf-8');
            const mapTitle = (content.match(/<mapTitle>(.*?)<\/mapTitle>/) || [])[1];
            const mapId = (content.match(/<mapId>(.*?)<\/mapId>/) || [])[1];
            if (mapTitle || mapId) {
              latestMapData.mapName = mapTitle || mapId;
            }
          }
        }
      }

      // Append savegameIndex to mapName to ensure uniqueness across savegames
      if (latestMapData.savegameIndex && latestMapData.savegameIndex > 0) {
        const baseName = latestMapData.mapName || latestMapData.mapTitle || latestMapData.mapId || 'UnknownMap';
        if (baseName !== 'UnknownMap' && !baseName.includes(` - Save ${latestMapData.savegameIndex}`)) {
            latestMapData.mapName = `${baseName} - Save ${latestMapData.savegameIndex}`;
        }
      }
    } catch (e) {
      // Silently ignore if file is locked by the game or doesn't exist yet
    }
    res.json({ ...latestMapData, _manualData: manualData });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  function startListening(port: number) {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`\n===================================================`);
      console.log(` Serveur FS25 WebSync en cours d'execution !`);
      console.log(`===================================================`);
      console.log(` URL d'acces local  : http://localhost:${port}`);
      
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
          if (iface.family === 'IPv4' && !iface.internal) {
            console.log(` URL d'acces reseau : http://${iface.address}:${port}`);
          }
        }
      }
      console.log(`===================================================\n`);
    });

    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE' || e.code === 'EACCES') {
        console.log(`Port ${port} indisponible (${e.code}), essai du port ${port + 1}...`);
        startListening(port + 1);
      } else {
        console.error("Erreur serveur:", e);
      }
    });
  }

  startListening(PORT);
}

startServer();
