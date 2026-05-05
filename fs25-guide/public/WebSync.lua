WebSync = {}
WebSync.dir = g_currentModDirectory
WebSync.exportTimer = 0
WebSync.exportInterval = 5000 -- Exporte les données toutes les 5 secondes

function WebSync:loadMap(name)
    print("[WebSync] Mod chargé avec succès sur la carte : " .. tostring(name))
end

function WebSync:deleteMap()
end

function WebSync:update(dt)
    if not g_currentMission then return end
    
    self.exportTimer = self.exportTimer + dt
    if self.exportTimer > self.exportInterval then
        self.exportTimer = 0
        self:exportData()
    end
end

function WebSync:exportData()
    print("[WebSync] Tentative d'exportation des donnees...")
    
    local data = {
        prices = {},
        storage = {},
        fields = {},
        currentMonth = 1
    }

    if g_currentMission.environment then
        local period = g_currentMission.environment.currentMonth or g_currentMission.environment.currentPeriod or 1
        -- Dans FS22/FS25, la période 1 correspond à Mars, 6 correspond à Août
        data.currentMonth = (period + 1) % 12 + 1
    end

    -- 1. Exporter les prix de la bourse (Economy) et les Stations
    data.market = {}
    
    if g_currentMission.economyManager and g_fillTypeManager then
        for fillTypeIndex, fillTypeDesc in pairs(g_fillTypeManager.fillTypes) do
            if type(fillTypeIndex) == "number" then
                -- Prix de base
                local success, price = pcall(function()
                    return g_currentMission.economyManager:getPricePerLiter(fillTypeIndex)
                end)
                
                if success and type(price) == "number" then
                    data.prices[fillTypeDesc.name] = price * 1000
                    
                    -- Initialiser la structure pour ce produit
                    data.market[fillTypeDesc.name] = {
                        name = fillTypeDesc.name,
                        basePrice = price * 1000,
                        stations = {}
                    }
                end
            end
        end
        
        -- Récupérer les stations de vente
        if g_currentMission.storageSystem and g_currentMission.storageSystem.unloadingStations then
            for _, station in pairs(g_currentMission.storageSystem.unloadingStations) do
                if station.isSellingPoint and station.acceptedFillTypes then
                    local stationName = station:getName()
                    
                    for fillTypeIndex, accepted in pairs(station.acceptedFillTypes) do
                        if accepted then
                            local fillTypeDesc = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                            if fillTypeDesc and data.market[fillTypeDesc.name] then
                                local effectivePrice = station:getEffectiveFillTypePrice(fillTypeIndex)
                                
                                -- Tendance et Variation (Simulation ou récupération si possible)
                                -- Dans FS, on n'a pas facilement l'historique 24h par station via API simple
                                -- On va utiliser le prix actuel. Le frontend calculera l'historique si le mod tourne.
                                
                                table.insert(data.market[fillTypeDesc.name].stations, {
                                    name = stationName,
                                    price = effectivePrice * 1000,
                                    trend = 0, -- Sera calculé par le frontend ou via historique
                                    variation = 0
                                })
                            end
                        end
                    end
                end
            end
        end
        
        print("[WebSync] Prix et Stations lus avec succes.")
    else
        print("[WebSync] Attention: economyManager ou g_fillTypeManager introuvable.")
    end

    -- 2. Exporter le stockage (Silos)
    local farmId = g_currentMission:getFarmId()
    if farmId == nil or farmId == 0 then farmId = 1 end

    -- Initialiser toutes les cultures à 0 pour qu'elles apparaissent dans le JSON
    if g_fillTypeManager and g_fillTypeManager.fillTypes then
        for fillTypeIndex, fillTypeDesc in pairs(g_fillTypeManager.fillTypes) do
            if type(fillTypeIndex) == "number" and fillTypeDesc.name then
                data.storage[fillTypeDesc.name] = 0
            end
        end
    end

    if g_currentMission.placeableSystem and g_currentMission.placeableSystem.placeables then
        for _, placeable in pairs(g_currentMission.placeableSystem.placeables) do
            if placeable.ownerFarmId == farmId or placeable.ownerFarmId == 0 then
                -- Silos
                if placeable.spec_silo and placeable.spec_silo.storages then
                    for _, storage in pairs(placeable.spec_silo.storages) do
                        -- FS22/FS25 compatibility for getting fill levels
                        if type(storage.getFillLevel) == "function" then
                            for fillTypeIndex, fillTypeDesc in pairs(g_fillTypeManager.fillTypes) do
                                if type(fillTypeIndex) == "number" then
                                    local level = storage:getFillLevel(fillTypeIndex)
                                    if level and level > 0 then
                                        data.storage[fillTypeDesc.name] = (data.storage[fillTypeDesc.name] or 0) + level
                                    end
                                end
                            end
                        elseif storage.fillLevels then
                            for fillTypeIndex, level in pairs(storage.fillLevels) do
                                if type(level) == "number" and level > 0 then
                                    local fillTypeDesc = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                    if fillTypeDesc and fillTypeDesc.name then
                                        data.storage[fillTypeDesc.name] = (data.storage[fillTypeDesc.name] or 0) + level
                                    end
                                end
                            end
                        end
                    end
                end
                
                -- Productions
                if placeable.spec_productionPoint and placeable.spec_productionPoint.productionPoint then
                    local prodPoint = placeable.spec_productionPoint.productionPoint
                    if prodPoint.storage and type(prodPoint.storage.getFillLevel) == "function" then
                        for fillTypeIndex, fillTypeDesc in pairs(g_fillTypeManager.fillTypes) do
                            if type(fillTypeIndex) == "number" then
                                local level = prodPoint.storage:getFillLevel(fillTypeIndex)
                                if level and level > 0 then
                                    data.storage[fillTypeDesc.name] = (data.storage[fillTypeDesc.name] or 0) + level
                                end
                            end
                        end
                    elseif prodPoint.storage and prodPoint.storage.fillLevels then
                        for fillTypeIndex, level in pairs(prodPoint.storage.fillLevels) do
                            if type(level) == "number" and level > 0 then
                                local fillTypeDesc = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                if fillTypeDesc and fillTypeDesc.name then
                                    data.storage[fillTypeDesc.name] = (data.storage[fillTypeDesc.name] or 0) + level
                                end
                            end
                        end
                    end
                end
            end
        end
    end

    -- 2.5 Exporter les bottes (Bales)
    data.bales = {}
    if g_currentMission.itemSystem and g_currentMission.itemSystem.items then
        for _, item in pairs(g_currentMission.itemSystem.items) do
            local isBale = false
            if item.typeName == "bale" or item.baleValueScale ~= nil or item.isBale then
                isBale = true
            elseif item.isa and Bale ~= nil and item:isa(Bale) then
                isBale = true
            end
            
            if isBale and (item.ownerFarmId == farmId or item.ownerFarmId == 0 or item.ownerFarmId == nil) then
                local fillTypeIndex = nil
                local fillLevel = 0
                
                if type(item.getFillType) == "function" then
                    fillTypeIndex = item:getFillType()
                elseif item.fillTypeIndex then
                    fillTypeIndex = item.fillTypeIndex
                end
                
                if type(item.getFillLevel) == "function" then
                    fillLevel = item:getFillLevel()
                elseif item.fillLevel then
                    fillLevel = item.fillLevel
                end

                if fillTypeIndex and fillLevel and fillLevel > 0 then
                    local fillTypeDesc = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                    if fillTypeDesc and fillTypeDesc.name then
                        data.bales[fillTypeDesc.name] = (data.bales[fillTypeDesc.name] or 0) + fillLevel
                    end
                end
            end
        end
    end

    -- 2.7 Exporter les Productions (Usines)
    data.productions = {}
    if g_currentMission.placeableSystem and g_currentMission.placeableSystem.placeables then
        for _, placeable in pairs(g_currentMission.placeableSystem.placeables) do
            if placeable.spec_productionPoint and placeable.spec_productionPoint.productionPoint then
                local prodPoint = placeable.spec_productionPoint.productionPoint
                -- Vérifier si l'usine appartient au joueur
                if placeable.ownerFarmId == farmId then
                    local name = "Usine"
                    if type(placeable.getName) == "function" then
                        name = placeable:getName()
                    elseif placeable.name then
                        name = placeable.name
                    end
                    
                    local status = "Arrêté"
                    if prodPoint.productions then
                        for _, prod in pairs(prodPoint.productions) do
                            if prod.isEnabled then
                                status = "Actif"
                                break
                            end
                        end
                    end

                    local prodData = {
                        name = name,
                        isOwned = true,
                        status = status,
                        inputs = {},
                        outputs = {}
                    }
                    
                    -- Récupérer les stocks
                    if prodPoint.storage and prodPoint.storage.fillLevels then
                        for fillTypeIndex, level in pairs(prodPoint.storage.fillLevels) do
                            local fillTypeDesc = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                            if fillTypeDesc and fillTypeDesc.name then
                                local capacity = 100000
                                if type(prodPoint.storage.getCapacity) == "function" then
                                    capacity = prodPoint.storage:getCapacity(fillTypeIndex) or 100000
                                end
                                
                                -- Déterminer si c'est une entrée ou une sortie
                                local isInput = false
                                if prodPoint.inputFillTypeIds then
                                    for _, id in pairs(prodPoint.inputFillTypeIds) do
                                        if id == fillTypeIndex then isInput = true break end
                                    end
                                end
                                
                                local isOutput = false
                                if prodPoint.outputFillTypeIds then
                                    for _, id in pairs(prodPoint.outputFillTypeIds) do
                                        if id == fillTypeIndex then isOutput = true break end
                                    end
                                end
                                
                                if isInput then
                                    prodData.inputs[fillTypeDesc.name] = {
                                        level = level,
                                        capacity = capacity
                                    }
                                end
                                if isOutput then
                                    prodData.outputs[fillTypeDesc.name] = {
                                        level = level,
                                        capacity = capacity
                                    }
                                end
                            end
                        end
                    end
                    
                    table.insert(data.productions, prodData)
                end
            end
        end
    end

    -- 3. Exporter les Terres (Farmlands + Fields)
    local fieldsMap = {}
    
    -- Etape 1: Charger tous les Farmlands (Terrains)
    if g_farmlandManager and g_farmlandManager.farmlands then
        for id, farmland in pairs(g_farmlandManager.farmlands) do
            local strId = tostring(id)
            local ownerId = 0
            if type(g_farmlandManager.getFarmlandOwner) == "function" then
                pcall(function() ownerId = g_farmlandManager:getFarmlandOwner(id) end)
            elseif type(g_farmlandManager.getOwnerId) == "function" then
                pcall(function() ownerId = g_farmlandManager:getOwnerId(id) end)
            end
            
            local isOwned = (ownerId ~= nil and ownerId > 0)
            
            local fx = farmland.x or farmland.indicatorX or farmland.centerWorldX or farmland.worldX or 0
            local fz = farmland.z or farmland.indicatorZ or farmland.centerWorldZ or farmland.worldZ or 0
            
            local cropName = "Inconnu"
            local growthState = "Inconnu"
            local needsFertilizer = false
            local needsPlowing = false
            local needsLime = false
            local needsWeeding = false
            
            if fx ~= 0 and fz ~= 0 then
                pcall(function()
                    if FSDensityMapUtil then
                        local fruitTypeIndex, fruitState, weedState, sprayState, plowState, limeState
                        if type(FSDensityMapUtil.getFieldData) == "function" then
                            fruitTypeIndex, fruitState, weedState, sprayState, plowState, limeState = FSDensityMapUtil.getFieldData(fx, fz)
                        elseif type(FSDensityMapUtil.getFieldDataAtWorldPosition) == "function" then
                            fruitTypeIndex, fruitState, weedState, sprayState, plowState, limeState = FSDensityMapUtil.getFieldDataAtWorldPosition(fx, fz)
                        end
                        
                        local fruitTypeManager = g_fruitTypeManager or (g_currentMission and g_currentMission.fruitTypeManager)
                        if fruitTypeIndex and fruitTypeManager then
                            local fruitType = fruitTypeManager:getFruitTypeByIndex(fruitTypeIndex)
                            if fruitType then cropName = fruitType.name end
                        end
                        if fruitState then growthState = tostring(fruitState) end
                        
                        if sprayState ~= nil and sprayState < 2 then needsFertilizer = true end
                        if plowState ~= nil and plowState > 0 then needsPlowing = true end
                        if limeState ~= nil and limeState > 0 then needsLime = true end
                        if weedState ~= nil and weedState > 0 then needsWeeding = true end
                    end
                end)
            end
            
            local area = farmland.areaInHa or farmland.area or farmland.ha or farmland.totalArea or 0
            if area == 0 and type(g_farmlandManager.getFarmlandArea) == "function" then
                pcall(function() area = g_farmlandManager:getFarmlandArea(id) end)
            end
            
            fieldsMap[strId] = {
                id = strId,
                x = fx,
                z = fz,
                size = area,
                farmlandSize = area,
                fieldSize = 0,
                crop = cropName,
                growthState = growthState,
                needsFertilizer = needsFertilizer,
                needsPlowing = needsPlowing,
                needsLime = needsLime,
                needsWeeding = needsWeeding,
                isOwned = isOwned,
                ownerId = ownerId,
                isFarmlandOnly = true
            }
        end
    end

    -- Etape 2: Charger les Champs (Fields) et les fusionner avec les Farmlands
    if g_fieldManager then
        local fieldsTable = g_fieldManager.fields
        if type(g_fieldManager.getFields) == "function" then
            fieldsTable = g_fieldManager:getFields() or fieldsTable
        end
        
        if fieldsTable then
            for k, field in pairs(fieldsTable) do
                if type(field) == "table" then
                    local px = field.posX or field.fieldMapIndicatorX or field.indicatorX or field.x or 0
                    local pz = field.posZ or field.fieldMapIndicatorZ or field.indicatorZ or field.z or 0
                    
                    local farmlandId = field.farmlandId
                    if farmlandId == nil and field.farmland ~= nil then farmlandId = field.farmland.id end
                    if farmlandId == nil and g_farmlandManager and g_farmlandManager.getFarmlandIdAtWorldPosition ~= nil and px ~= 0 then
                        pcall(function() farmlandId = g_farmlandManager:getFarmlandIdAtWorldPosition(px, pz) end)
                    end
                    
                    -- On utilise le fieldId en priorité pour correspondre aux numéros de la carte
                    local fieldId = field.fieldId
                    if not fieldId then
                        local hotspot = field.mapHotspot or field.nameIndicator
                        if type(hotspot) == "table" then
                            fieldId = hotspot.name or hotspot.text
                        end
                    end
                    if not fieldId then fieldId = field.name end
                    if not fieldId then fieldId = farmlandId end
                    if not fieldId then fieldId = k end
                    
                    local strId = tostring(fieldId)
                    local numStr = strId:match("%d+")
                    if numStr then strId = numStr end
                    
                    local area = field.fieldAreaInHa or field.areaInHa or field.fieldArea or field.area or field.ha or 0
                    if area == 0 and type(field.getArea) == "function" then
                        pcall(function() area = field:getArea() end)
                    end
                    local cropName = "Inconnu"
                    local growthState = "Inconnu"
                    local needsFertilizer = false
                    local needsPlowing = false
                    local needsLime = false
                    local needsWeeding = false
                    
                    local fruitTypeManager = g_fruitTypeManager or (g_currentMission and g_currentMission.fruitTypeManager)
                    if field.fruitTypeIndex and fruitTypeManager then
                        local fruitType = fruitTypeManager:getFruitTypeByIndex(field.fruitTypeIndex)
                        if fruitType then cropName = fruitType.name end
                    elseif field.fruitType and field.fruitType.name then
                        cropName = field.fruitType.name
                    end
                    if field.state then growthState = tostring(field.state) end
                    
                    if field.needsFertilizer ~= nil then needsFertilizer = field.needsFertilizer end
                    if field.needsPlowing ~= nil then needsPlowing = field.needsPlowing end
                    if field.needsLime ~= nil then needsLime = field.needsLime end
                    if field.needsWeeding ~= nil then needsWeeding = field.needsWeeding end
                    
                    if (cropName == "Inconnu" or growthState == "Inconnu") and px ~= 0 and pz ~= 0 then
                        pcall(function()
                            if FSDensityMapUtil then
                                local fruitTypeIndex, fruitState, weedState, sprayState, plowState, limeState
                                if type(FSDensityMapUtil.getFieldData) == "function" then
                                    fruitTypeIndex, fruitState, weedState, sprayState, plowState, limeState = FSDensityMapUtil.getFieldData(px, pz)
                                elseif type(FSDensityMapUtil.getFieldDataAtWorldPosition) == "function" then
                                    fruitTypeIndex, fruitState, weedState, sprayState, plowState, limeState = FSDensityMapUtil.getFieldDataAtWorldPosition(px, pz)
                                end
                                
                                local fruitTypeManager = g_fruitTypeManager or (g_currentMission and g_currentMission.fruitTypeManager)
                                if fruitTypeIndex and fruitTypeManager then
                                    local fruitType = fruitTypeManager:getFruitTypeByIndex(fruitTypeIndex)
                                    if fruitType then cropName = fruitType.name end
                                end
                                if fruitState then growthState = tostring(fruitState) end
                                
                                -- Fallback to density map if field object doesn't have the info
                                if sprayState ~= nil and sprayState < 2 then needsFertilizer = true end
                                if plowState ~= nil and plowState > 0 then needsPlowing = true end
                                if limeState ~= nil and limeState > 0 then needsLime = true end
                                if weedState ~= nil and weedState > 0 then needsWeeding = true end
                            end
                        end)
                    end
                    
                    if cropName == "Inconnu" then
                        if field.fruitTypeIndex and g_fruitTypeManager then
                            local fruitType = g_fruitTypeManager:getFruitTypeByIndex(field.fruitTypeIndex)
                            if fruitType then cropName = fruitType.name end
                        elseif field.fruitType and field.fruitType.name then
                            cropName = field.fruitType.name
                        end
                    end
                    
                    if growthState == "Inconnu" then
                        if field.state then growthState = tostring(field.state) end
                        if field.fruitState then growthState = tostring(field.fruitState) end
                    end
                    
                    if field.needsFertilizer ~= nil then needsFertilizer = field.needsFertilizer end
                    if field.needsPlowing ~= nil then needsPlowing = field.needsPlowing end
                    if field.needsLime ~= nil then needsLime = field.needsLime end
                    if field.needsWeeding ~= nil then needsWeeding = field.needsWeeding end
                    
                    local ownerId = 0
                    if farmlandId and g_farmlandManager then
                        if type(g_farmlandManager.getFarmlandOwner) == "function" then
                            pcall(function() ownerId = g_farmlandManager:getFarmlandOwner(farmlandId) end)
                        elseif type(g_farmlandManager.getOwnerId) == "function" then
                            pcall(function() ownerId = g_farmlandManager:getOwnerId(farmlandId) end)
                        end
                    end
                    local isOwned = (ownerId ~= nil and ownerId > 0)
                    
                    if not fieldsMap[strId] then
                        local fSize = 0
                        if farmlandId and fieldsMap[tostring(farmlandId)] then
                            fSize = fieldsMap[tostring(farmlandId)].farmlandSize or fieldsMap[tostring(farmlandId)].size
                            fieldsMap[tostring(farmlandId)].hasFields = true
                        end
                        fieldsMap[strId] = {
                            id = strId,
                            x = px,
                            z = pz,
                            size = area,
                            farmlandSize = fSize,
                            fieldSize = area,
                            crop = cropName,
                            growthState = growthState,
                            needsFertilizer = needsFertilizer,
                            needsPlowing = needsPlowing,
                            needsLime = needsLime,
                            needsWeeding = needsWeeding,
                            isOwned = isOwned,
                            ownerId = ownerId,
                            isFarmlandOnly = false
                        }
                    else
                        local entry = fieldsMap[strId]
                        if entry.isFarmlandOnly then
                            entry.x = px
                            entry.z = pz
                            entry.fieldSize = area
                            entry.size = area
                            entry.crop = cropName
                            entry.growthState = growthState
                            entry.needsFertilizer = needsFertilizer
                            entry.needsPlowing = needsPlowing
                            entry.needsLime = needsLime
                            entry.needsWeeding = needsWeeding
                            entry.isOwned = isOwned
                            entry.ownerId = ownerId
                            entry.isFarmlandOnly = false
                        else
                            entry.fieldSize = (entry.fieldSize or 0) + area
                            entry.size = (entry.size or 0) + area
                            if cropName ~= "Inconnu" then
                                entry.crop = cropName
                                entry.growthState = growthState
                            elseif entry.crop == "Inconnu" and growthState ~= "Inconnu" then
                                entry.growthState = growthState
                            end
                            
                            -- Always update needs from the actual field data as it is more accurate than farmland center
                            entry.needsFertilizer = needsFertilizer
                            entry.needsPlowing = needsPlowing
                            entry.needsLime = needsLime
                            entry.needsWeeding = needsWeeding
                        end
                    end
                end
            end
        end
    end
    
    for _, f in pairs(fieldsMap) do
        table.insert(data.fields, f)
    end
    print("[WebSync] Terres lues avec succes. Nombre: " .. tostring(#data.fields))

    -- 4. Écrire dans le fichier JSON
    local basePath = getUserProfileAppPath() .. "modSettings/"
    createFolder(basePath)
    
    local path = basePath .. "FS25_WebSync/"
    createFolder(path)
    
    local filePath = path .. "data.json"
    local file, err = io.open(filePath, "w")
    
    if file then
        file:write(self:encodeJSON(data))
        file:close()
        print("[WebSync] Fichier sauvegarde avec succes dans : " .. filePath)
    else
        print("[WebSync] ERREUR : Impossible de creer le fichier. Raison : " .. tostring(err))
    end
end

-- Fonction utilitaire pour convertir les données Lua en JSON
function WebSync:encodeJSON(t)
    local function encode(val)
        if type(val) == "table" then
            local res = {}
            local isArray = true
            local maxIndex = 0
            for k, v in pairs(val) do
                if type(k) ~= "number" then
                    isArray = false
                    break
                end
                if k > maxIndex then maxIndex = k end
            end
            
            if isArray then
                for i = 1, maxIndex do
                    table.insert(res, encode(val[i]))
                end
                return "[" .. table.concat(res, ",") .. "]"
            else
                for k, v in pairs(val) do
                    table.insert(res, '"' .. tostring(k) .. '":' .. encode(v))
                end
                return "{" .. table.concat(res, ",") .. "}"
            end
        elseif type(val) == "number" then
            return tostring(val)
        elseif type(val) == "string" then
            return '"' .. val .. '"'
        elseif type(val) == "boolean" then
            return tostring(val)
        else
            return "null"
        end
    end
    return encode(t)
end

addModEventListener(WebSync)
