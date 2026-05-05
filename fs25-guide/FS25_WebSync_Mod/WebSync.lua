print("[WebSync] Chargement du script WebSync.lua...")

WebSync = {}
WebSync.dir = g_currentModDirectory
WebSync.exportTimer = 6000 -- Force l'export immédiat au lancement
WebSync.exportInterval = 5000 -- Exporte les données toutes les 5 secondes

function WebSync:loadMap(name)
    print("[WebSync] Mod chargé avec succès sur la carte : " .. tostring(name))
end

function WebSync:deleteMap()
end

function WebSync:update(dt)
    if not g_currentMission then return end
    
    if not self.firstUpdateDone then
        print("[WebSync] Premiere mise a jour detectee")
        self.firstUpdateDone = true
    end
    
    self.exportTimer = self.exportTimer + dt
    if self.exportTimer > self.exportInterval then
        self.exportTimer = 0
        self:exportData()
    end
end

function WebSync:exportData()
    -- Utiliser pcall pour éviter de faire planter le script entier en cas d'erreur
    local status, err = pcall(function()
        if not g_currentMission or not g_currentMission.isMissionStarted then return end
        -- print("[WebSync] Debut export donnees...")
        
        local farmId = 1
        if g_currentMission.getFarmId then
            farmId = g_currentMission:getFarmId()
        elseif g_currentMission.playerFarmId then
            farmId = g_currentMission.playerFarmId
        end
        
        local data = {
            mapTitle = g_currentMission.missionInfo and g_currentMission.missionInfo.mapTitle or "UnknownMap",
            mapId = g_currentMission.missionInfo and g_currentMission.missionInfo.mapId or "UnknownMap",
            savegameIndex = g_currentMission.missionInfo and g_currentMission.missionInfo.savegameIndex or 0,
            farmId = farmId,
            prices = {},
            storage = {},
            fields = {},
            currentMonth = g_currentMission.environment and g_currentMission.environment.currentMonth or 1,
            market = {},
            bales = {},
            animals = {},
            productions = {}
        }

        if g_currentMission.environment then
            local period = g_currentMission.environment.currentMonth or g_currentMission.environment.currentPeriod or 1
            data.currentMonth = (period + 1) % 12 + 1
        end

        -- 1. Exporter les prix et le marché
        if g_currentMission.economyManager and g_fillTypeManager then
            for fillTypeIndex, fillTypeDesc in pairs(g_fillTypeManager.fillTypes) do
                if type(fillTypeIndex) == "number" then
                    local success, price = pcall(function()
                        return g_currentMission.economyManager:getPricePerLiter(fillTypeIndex)
                    end)
                    
                    if success and type(price) == "number" then
                        data.prices[fillTypeDesc.name] = price * 1000
                        data.market[fillTypeDesc.name] = {
                            name = fillTypeDesc.name,
                            basePrice = price * 1000,
                            stations = {}
                        }
                    end
                end
            end
            
            -- Stations de vente
            if g_currentMission.storageSystem and g_currentMission.storageSystem.unloadingStations then
                for _, station in pairs(g_currentMission.storageSystem.unloadingStations) do
                    if station.isSellingPoint and station.acceptedFillTypes then
                        local stationName = station:getName()
                        for fillTypeIndex, accepted in pairs(station.acceptedFillTypes) do
                            if accepted then
                                local fillTypeDesc = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                if fillTypeDesc and data.market[fillTypeDesc.name] then
                                    local effectivePrice = station:getEffectiveFillTypePrice(fillTypeIndex)
                                    table.insert(data.market[fillTypeDesc.name].stations, {
                                        name = stationName,
                                        price = effectivePrice * 1000,
                                        trend = 0,
                                        variation = 0
                                    })
                                end
                            end
                        end
                    end
                end
            end

            -- Stations d'achat (Code Robuste)
            local potentialBuyingStations = {}
            local seenStations = {}
            local function addStation(station)
                if station and not seenStations[station] then
                    table.insert(potentialBuyingStations, station)
                    seenStations[station] = true
                end
            end

            if g_currentMission.storageSystem then
                if g_currentMission.storageSystem.buyingStations then
                    for _, s in pairs(g_currentMission.storageSystem.buyingStations) do addStation(s) end
                end
                if g_currentMission.storageSystem.loadingStations then
                    for _, s in pairs(g_currentMission.storageSystem.loadingStations) do addStation(s) end
                end
            end
            
            if g_currentMission.placeableSystem and g_currentMission.placeableSystem.placeables then
                for _, placeable in pairs(g_currentMission.placeableSystem.placeables) do
                    if placeable.spec_buyingStation and placeable.spec_buyingStation.buyingStation then
                        addStation(placeable.spec_buyingStation.buyingStation)
                    end
                end
            end

            for _, station in pairs(potentialBuyingStations) do
                local stationName = station:getName()
                if not stationName or stationName == "" then 
                    if station.owningPlaceable then stationName = station.owningPlaceable:getName() end
                end
                if not stationName or stationName == "" then stationName = "Point d'achat" end
                
                -- Optimisation: Ne vérifier que les fillTypes supportés si la liste existe
                local typesToCheck = {}
                if station.supportedFillTypes then
                    for k, v in pairs(station.supportedFillTypes) do
                        if type(v) == "boolean" and v then
                            table.insert(typesToCheck, k)
                        elseif type(v) == "number" then
                            table.insert(typesToCheck, v)
                        end
                    end
                elseif g_fillTypeManager and g_fillTypeManager.fillTypes then
                    -- Fallback: tout vérifier (plus lent, mais nécessaire pour certains mods)
                    for fillTypeIndex, _ in pairs(g_fillTypeManager.fillTypes) do
                        if type(fillTypeIndex) == "number" then
                            table.insert(typesToCheck, fillTypeIndex)
                        end
                    end
                end

                for _, fillTypeIndex in pairs(typesToCheck) do
                    local fillTypeDesc = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                    
                    if fillTypeDesc then
                        local price = 0
                        
                        -- Méthode 1: getEffectiveFillTypePrice
                        if station.getEffectiveFillTypePrice then
                            local status, result = pcall(function() 
                                return station:getEffectiveFillTypePrice(fillTypeIndex) 
                            end)
                            if status and type(result) == "number" then price = result end
                        end
                        
                        -- Méthode 2: getFillTypePrice (Fallback)
                        if (not price or price == 0) and station.getFillTypePrice then
                            local status, result = pcall(function() 
                                return station:getFillTypePrice(fillTypeIndex) 
                            end)
                            if status and type(result) == "number" then price = result end
                        end
                        
                        if price and price > 0 then
                            -- Debug pour voir si on trouve quelque chose
                            -- print("[WebSync] Achat trouve: " .. stationName .. " - " .. fillTypeDesc.name .. " = " .. tostring(price))
                            
                            if not data.market[fillTypeDesc.name] then
                                local basePrice = 0
                                if g_currentMission.economyManager then
                                    basePrice = (g_currentMission.economyManager:getPricePerLiter(fillTypeIndex) or 0) * 1000
                                end
                                data.market[fillTypeDesc.name] = {
                                    name = fillTypeDesc.name,
                                    basePrice = basePrice,
                                    stations = {}
                                }
                            end
                            
                            local alreadyExists = false
                            for _, s in pairs(data.market[fillTypeDesc.name].stations) do
                                if s.name == stationName and s.buyPrice and s.buyPrice > 0 then
                                    alreadyExists = true
                                    break
                                end
                            end

                            if not alreadyExists then
                                table.insert(data.market[fillTypeDesc.name].stations, {
                                    name = stationName,
                                    price = 0,
                                    buyPrice = price * 1000,
                                    trend = 0,
                                    variation = 0
                                })
                            end
                        end
                    end
                end
            end
        end

    -- Fonction pour normaliser les noms de fill types
    local function normalizeFillTypeName(name)
        if not name then return nil end
        local n = name:upper()
        if n == "LIQUID_MANURE" or n == "SLURRY" or n == "LIQUIDMANURE" then return "LIQUIDMANURE" end
        if n == "GOAT_MILK" or n == "GOATMILK" then return "GOAT_MILK" end
        if n == "BUFFALO_MILK" or n == "BUFFALOMILK" then return "BUFFALO_MILK" end
        if n == "COW_MILK" or n == "MILK" then return "MILK" end
        if n == "MANURE" or n == "LITTER" then return "MANURE" end
        if n == "STRAW" then return "STRAW" end
        if n == "WATER" then return "WATER" end
        return n
    end

    -- 2. Stockage (Silos)
    if g_fillTypeManager and g_fillTypeManager.fillTypes then
        for fillTypeIndex, fillTypeDesc in pairs(g_fillTypeManager.fillTypes) do
            if type(fillTypeIndex) == "number" and fillTypeDesc.name then
                local name = normalizeFillTypeName(fillTypeDesc.name)
                data.storage[name] = { level = 0, capacity = 0 }
            end
        end
    end

        if g_currentMission.placeableSystem and g_currentMission.placeableSystem.placeables then
            for _, placeable in pairs(g_currentMission.placeableSystem.placeables) do
                if placeable.ownerFarmId and (placeable.ownerFarmId == farmId or placeable.ownerFarmId == 0) then
                    -- Silos
                    if placeable.spec_silo and placeable.spec_silo.storages then
                        for _, storage in pairs(placeable.spec_silo.storages) do
                            if type(storage.getFillLevel) == "function" then
                                for fillTypeIndex, fillTypeDesc in pairs(g_fillTypeManager.fillTypes) do
                                    if type(fillTypeIndex) == "number" then
                                        local level = storage:getFillLevel(fillTypeIndex)
                                        if level and level > 0 then
                                            local name = normalizeFillTypeName(fillTypeDesc.name)
                                            if name then
                                                local capacity = 0
                                                if storage.getCapacity then capacity = storage:getCapacity(fillTypeIndex) end
                                                if capacity == 0 and storage.capacity then capacity = storage.capacity end
                                                
                                                data.storage[name] = data.storage[name] or { level = 0, capacity = 0 }
                                                data.storage[name].level = data.storage[name].level + level
                                                data.storage[name].capacity = data.storage[name].capacity + capacity
                                            end
                                        end
                                    end
                                end
                            elseif storage.fillLevels then
                                for fillTypeIndex, level in pairs(storage.fillLevels) do
                                    if type(level) == "number" and level > 0 then
                                        local fillTypeDesc = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                        if fillTypeDesc and fillTypeDesc.name then
                                            local name = normalizeFillTypeName(fillTypeDesc.name)
                                            if name then
                                                local capacity = 0
                                                if storage.capacities then capacity = storage.capacities[fillTypeIndex] or 0 end
                                                if capacity == 0 and storage.capacity then capacity = storage.capacity end

                                                data.storage[name] = data.storage[name] or { level = 0, capacity = 0 }
                                                data.storage[name].level = data.storage[name].level + level
                                                data.storage[name].capacity = data.storage[name].capacity + capacity
                                            end
                                        end
                                    end
                                end
                            end
                        end
                    end
                    
                    -- Productions
                    if placeable.spec_productionPoint and placeable.spec_productionPoint.productionPoint then
                        local prodPoint = placeable.spec_productionPoint.productionPoint
                        
                        -- Export as owned production
                        if placeable.ownerFarmId == farmId then
                            local prodName = ""
                            if prodPoint.getName ~= nil then
                                prodName = prodPoint:getName()
                            end
                            if not prodName or prodName == "" then prodName = placeable:getName() end
                            
                            local isActive = false
                            if prodPoint.getIsActive ~= nil then
                                isActive = prodPoint:getIsActive()
                            elseif prodPoint.isActive ~= nil then
                                isActive = prodPoint.isActive
                            end

                            local prodData = {
                                name = prodName,
                                status = isActive and "Active" or "Stopped",
                                inputs = {},
                                outputs = {},
                                storage = {},
                                recipes = {}
                            }
                            
                            -- Inputs/Outputs with levels and capacities
                            if prodPoint.productions then
                                for _, production in pairs(prodPoint.productions) do
                                    local recipeName = production.name or production.id or "Unknown"
                                    local costPerHour = production.costsPerActiveHour or 0
                                    local costPerMonth = production.costsPerActiveMonth or 0
                                    
                                    local recipeStatus = "Inactive"
                                    if prodPoint.getIsProductionActive ~= nil and prodPoint:getIsProductionActive(production.id) then
                                        recipeStatus = "Active"
                                    elseif production.status == 1 then
                                        recipeStatus = "Active"
                                    end

                                    table.insert(prodData.recipes, {
                                        name = recipeName,
                                        costPerHour = costPerHour,
                                        costPerMonth = costPerMonth,
                                        status = recipeStatus
                                    })

                                    if production.inputs then
                                        for _, input in pairs(production.inputs) do
                                            local ft = g_fillTypeManager:getFillTypeByIndex(input.type)
                                            if ft and ft.name then
                                                local level = 0
                                                if prodPoint.getFillLevel ~= nil then
                                                    level = prodPoint:getFillLevel(input.type)
                                                elseif prodPoint.storage and prodPoint.storage.fillLevels then
                                                    level = prodPoint.storage.fillLevels[input.type] or 0
                                                end

                                                local capacity = 0
                                                if prodPoint.getCapacity ~= nil then
                                                    capacity = prodPoint:getCapacity(input.type)
                                                elseif prodPoint.storage and prodPoint.storage.capacities then
                                                    capacity = prodPoint.storage.capacities[input.type] or 0
                                                end

                                                local name = ft.name:upper()
                                                prodData.inputs[name] = {
                                                    current = level,
                                                    max = capacity
                                                }
                                            end
                                        end
                                    end
                                    if production.outputs then
                                        for _, output in pairs(production.outputs) do
                                            local ft = g_fillTypeManager:getFillTypeByIndex(output.type)
                                            if ft and ft.name then
                                                local level = 0
                                                if prodPoint.getFillLevel ~= nil then
                                                    level = prodPoint:getFillLevel(output.type)
                                                elseif prodPoint.storage and prodPoint.storage.fillLevels then
                                                    level = prodPoint.storage.fillLevels[output.type] or 0
                                                end

                                                local capacity = 0
                                                if prodPoint.getCapacity ~= nil then
                                                    capacity = prodPoint:getCapacity(output.type)
                                                elseif prodPoint.storage and prodPoint.storage.capacities then
                                                    capacity = prodPoint.storage.capacities[output.type] or 0
                                                end

                                                local name = ft.name:upper()
                                                prodData.outputs[name] = {
                                                    current = level,
                                                    max = capacity
                                                }
                                            end
                                        end
                                    end
                                end
                            end
                            
                            local activeCostPerMonth = 0
                            for _, recipe in pairs(prodData.recipes) do
                                if recipe.status == "Active" then
                                    activeCostPerMonth = activeCostPerMonth + recipe.costPerMonth
                                end
                            end
                            prodData.activeCostPerMonth = activeCostPerMonth
                            
                            -- Storage levels (Fallback/Additional)
                            if prodPoint.storage and prodPoint.storage.fillLevels then
                                for fillTypeIndex, level in pairs(prodPoint.storage.fillLevels) do
                                    if level > 0 then
                                        local ft = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                        if ft and ft.name then
                                            local name = ft.name:upper()
                                            local capacity = prodPoint.storage.capacities[fillTypeIndex] or 0
                                            
                                            -- If not already in inputs/outputs, add to storage
                                            if not prodData.inputs[name] and not prodData.outputs[name] then
                                                prodData.storage[name] = {
                                                    level = level,
                                                    capacity = capacity
                                                }
                                            end
                                            
                                            -- Update levels if they were 0 in inputs/outputs
                                            if prodData.inputs[name] and prodData.inputs[name].current == 0 then
                                                prodData.inputs[name].current = level
                                                prodData.inputs[name].max = capacity
                                            end
                                            if prodData.outputs[name] and prodData.outputs[name].current == 0 then
                                                prodData.outputs[name].current = level
                                                prodData.outputs[name].max = capacity
                                            end
                                        end
                                    end
                                end
                            end
                            
                            table.insert(data.productions, prodData)
                        end

                        -- Also add to global storage
                        if prodPoint.storage and type(prodPoint.storage.getFillLevel) == "function" then
                            for fillTypeIndex, fillTypeDesc in pairs(g_fillTypeManager.fillTypes) do
                                if type(fillTypeIndex) == "number" then
                                    local level = prodPoint.storage:getFillLevel(fillTypeIndex)
                                    if level and level > 0 then
                                        local capacity = 0
                                        if prodPoint.storage.getCapacity then capacity = prodPoint.storage:getCapacity(fillTypeIndex) end
                                        if capacity == 0 and prodPoint.storage.capacities then capacity = prodPoint.storage.capacities[fillTypeIndex] or 0 end

                                        data.storage[fillTypeDesc.name] = data.storage[fillTypeDesc.name] or { level = 0, capacity = 0 }
                                        data.storage[fillTypeDesc.name].level = data.storage[fillTypeDesc.name].level + level
                                        data.storage[fillTypeDesc.name].capacity = data.storage[fillTypeDesc.name].capacity + capacity
                                    end
                                end
                            end
                        elseif prodPoint.storage and prodPoint.storage.fillLevels then
                            for fillTypeIndex, level in pairs(prodPoint.storage.fillLevels) do
                                if type(level) == "number" and level > 0 then
                                    local fillTypeDesc = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                    if fillTypeDesc and fillTypeDesc.name then
                                        local capacity = 0
                                        if prodPoint.storage.capacities then capacity = prodPoint.storage.capacities[fillTypeIndex] or 0 end

                                        data.storage[fillTypeDesc.name] = data.storage[fillTypeDesc.name] or { level = 0, capacity = 0 }
                                        data.storage[fillTypeDesc.name].level = data.storage[fillTypeDesc.name].level + level
                                        data.storage[fillTypeDesc.name].capacity = data.storage[fillTypeDesc.name].capacity + capacity
                                    end
                                end
                            end
                        end
                    end
                end
            end
        end

        -- 2.5 Exporter les bottes (Bales)
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

        -- 2.6 Exporter les véhicules
        data.vehicles = {}
        if g_currentMission.vehicleSystem and g_currentMission.vehicleSystem.vehicles then
            for _, vehicle in pairs(g_currentMission.vehicleSystem.vehicles) do
                if vehicle.ownerFarmId == farmId and vehicle.getName then
                    local brandName = "Unknown"
                    local brandIndex = vehicle.brandIndex
                    if not brandIndex and vehicle.getBrandIndex then 
                        pcall(function() brandIndex = vehicle:getBrandIndex() end)
                    end
                    
                    if (not brandIndex or brandIndex == 0) and vehicle.configFileName then
                        local storeItem = g_storeManager:getItemByXMLFilename(vehicle.configFileName)
                        if storeItem then
                            brandIndex = storeItem.brandIndex
                        end
                    end
                    
                    if brandIndex and brandIndex ~= 0 and g_brandManager and g_brandManager.getBrandByIndex then
                        local brand = g_brandManager:getBrandByIndex(brandIndex)
                        if brand then
                            brandName = brand.title or brand.name or "Unknown"
                        end
                    end

                    local price = 0
                    if vehicle.price then price = vehicle.price end
                    if price == 0 and vehicle.getPrice then pcall(function() price = vehicle:getPrice() end) end
                    if price == 0 and vehicle.configFileName then
                        local storeItem = g_storeManager:getItemByXMLFilename(vehicle.configFileName)
                        if storeItem and storeItem.price then price = storeItem.price end
                    end
                    
                    local sellPrice = 0
                    if vehicle.getSellPrice then
                        pcall(function() sellPrice = vehicle:getSellPrice() end)
                    end
                    if sellPrice == 0 then sellPrice = price end

                    local vData = {
                        name = vehicle:getName(),
                        brand = brandName,
                        category = vehicle.typeName or "unknown",
                        operatingTime = vehicle.operatingTime or 0,
                        price = price,
                        sellPrice = sellPrice,
                        damage = 0,
                        wear = 0,
                        dirt = 0,
                        fuel = 0,
                        fuelMax = 0,
                        fuelType = "DIESEL"
                    }
                    
                    if vehicle.getDamageAmount then pcall(function() vData.damage = vehicle:getDamageAmount() end) end
                    if vehicle.getWearTotalAmount then pcall(function() vData.wear = vehicle:getWearTotalAmount() end) end
                    if vehicle.getDirtAmount then pcall(function() vData.dirt = vehicle:getDirtAmount() end) end

                    if vehicle.getFillUnits then
                        pcall(function()
                            for i = 1, #vehicle:getFillUnits() do
                                local fillType = vehicle:getFillUnitFillType(i)
                                local ftDesc = g_fillTypeManager:getFillTypeByIndex(fillType)
                                if ftDesc and (ftDesc.name == "DIESEL" or ftDesc.name == "ELECTRICCHARGE" or ftDesc.name == "METHANE") then
                                    vData.fuel = vehicle:getFillUnitFillLevel(i)
                                    vData.fuelMax = vehicle:getFillUnitCapacity(i)
                                    vData.fuelType = ftDesc.name
                                    break
                                end
                            end
                        end)
                    end

                    table.insert(data.vehicles, vData)
                end
            end
        end

        -- 3. Exporter les Terres (Farmlands + Fields)
        local fieldsMap = {}
        
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
                
                local fx = tonumber(farmland.x or farmland.indicatorX or farmland.centerWorldX or farmland.worldX) or 0
                local fz = tonumber(farmland.z or farmland.indicatorZ or farmland.centerWorldZ or farmland.worldZ) or 0
                
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
                                -- FS25 semble demander (x, y, z)
                                fruitTypeIndex, fruitState, weedState, sprayState, plowState, limeState = FSDensityMapUtil.getFieldData(fx, 0, fz)
                            elseif type(FSDensityMapUtil.getFieldDataAtWorldPosition) == "function" then
                                fruitTypeIndex, fruitState, weedState, sprayState, plowState, limeState = FSDensityMapUtil.getFieldDataAtWorldPosition(fx, 0, fz)
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

        if g_fieldManager then
            local fieldsTable = g_fieldManager.fields
            if type(g_fieldManager.getFields) == "function" then
                fieldsTable = g_fieldManager:getFields() or fieldsTable
            end
            
            if fieldsTable then
                for k, field in pairs(fieldsTable) do
                    if type(field) == "table" then
                        local px = tonumber(field.posX or field.fieldMapIndicatorX or field.indicatorX or field.x) or 0
                        local pz = tonumber(field.posZ or field.fieldMapIndicatorZ or field.indicatorZ or field.z) or 0
                        
                        local farmlandId = field.farmlandId
                        if farmlandId == nil and field.farmland ~= nil then farmlandId = field.farmland.id end
                        if farmlandId == nil and g_farmlandManager and g_farmlandManager.getFarmlandIdAtWorldPosition ~= nil and px ~= 0 then
                            -- FS25: (x, y, z)
                            pcall(function() farmlandId = g_farmlandManager:getFarmlandIdAtWorldPosition(px, 0, pz) end)
                        end
                        
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
                                        -- FS25: (x, y, z)
                                        fruitTypeIndex, fruitState, weedState, sprayState, plowState, limeState = FSDensityMapUtil.getFieldData(px, 0, pz)
                                    elseif type(FSDensityMapUtil.getFieldDataAtWorldPosition) == "function" then
                                        fruitTypeIndex, fruitState, weedState, sprayState, plowState, limeState = FSDensityMapUtil.getFieldDataAtWorldPosition(px, 0, pz)
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
                        
                        local plannedFruitName = "NONE"
                        if type(field.plannedFruit) == "number" and g_fruitTypeManager then
                            local pt = g_fruitTypeManager:getFruitTypeByIndex(field.plannedFruit)
                            if pt and pt.name then plannedFruitName = pt.name end
                        elseif type(field.plannedFruit) == "string" then
                            plannedFruitName = field.plannedFruit
                        end

                        local lastGrowthState = field.lastGrowthState or 0
                        local weedStateVal = field.weedState or 0
                        local stoneLevel = field.stoneLevel or 0
                        local groundType = field.groundType or "UNKNOWN"
                        local sprayType = field.sprayType or "NONE"
                        local sprayLevel = field.sprayLevel or 0
                        local limeLevelVal = field.limeLevel or 0
                        local rollerLevel = field.rollerLevel or 0
                        local plowLevelVal = field.plowLevel or 0
                        local stubbleShredLevel = field.stubbleShredLevel or 0
                        local waterLevel = field.waterLevel or 0
                        
                        if type(groundType) == "number" and FieldManager and FieldManager.groundTypeIntToName then
                            groundType = FieldManager.groundTypeIntToName[groundType] or groundType
                        end
                        
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
                                plannedFruit = plannedFruitName,
                                growthState = growthState,
                                lastGrowthState = lastGrowthState,
                                weedState = weedStateVal,
                                stoneLevel = stoneLevel,
                                groundType = tostring(groundType),
                                sprayType = tostring(sprayType),
                                sprayLevel = sprayLevel,
                                limeLevel = limeLevelVal,
                                rollerLevel = rollerLevel,
                                plowLevel = plowLevelVal,
                                stubbleShredLevel = stubbleShredLevel,
                                waterLevel = waterLevel,
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
                                entry.plannedFruit = plannedFruitName
                                entry.growthState = growthState
                                entry.lastGrowthState = lastGrowthState
                                entry.weedState = weedStateVal
                                entry.stoneLevel = stoneLevel
                                entry.groundType = tostring(groundType)
                                entry.sprayType = tostring(sprayType)
                                entry.sprayLevel = sprayLevel
                                entry.limeLevel = limeLevelVal
                                entry.rollerLevel = rollerLevel
                                entry.plowLevel = plowLevelVal
                                entry.stubbleShredLevel = stubbleShredLevel
                                entry.waterLevel = waterLevel
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

        -- 3.5 Exporter les Animaux
        data.animals = {}
        
        local animalCount = 0
        if g_currentMission.placeableSystem and g_currentMission.placeableSystem.placeables then
            for i, placeable in pairs(g_currentMission.placeableSystem.placeables) do
                local placeableFarmId = 0
                if placeable.getOwnerFarmId then placeableFarmId = placeable:getOwnerFarmId() end
                if placeableFarmId == 0 and placeable.ownerFarmId then placeableFarmId = placeable.ownerFarmId end

                if placeableFarmId == farmId or placeableFarmId == 0 then
                    if placeable.spec_husbandryAnimals then
                        local barnName = placeable:getName()
                        local animalId = "barn_" .. tostring(placeable.id or i)
                        
                        local totalAnimals = 0
                        local speciesName = "Unknown"
                        local breeds = {}
                        
                        local clusters = nil
                        if placeable.getClusters then clusters = placeable:getClusters() end
                        
                        if clusters then
                            for _, cluster in pairs(clusters) do
                                totalAnimals = totalAnimals + cluster.numAnimals
                                
                                local breedName = "Unknown"
                                if g_currentMission.animalSystem and g_currentMission.animalSystem.getSubTypeByIndex then
                                    local subType = g_currentMission.animalSystem:getSubTypeByIndex(cluster.subTypeIndex)
                                    if subType then
                                        if subType.name then
                                            breedName = subType.name
                                        end
                                        if speciesName == "Unknown" then
                                            if subType.speciesIndex and g_currentMission.animalSystem.getSpeciesByIndex then
                                                local species = g_currentMission.animalSystem:getSpeciesByIndex(subType.speciesIndex)
                                                if species and species.name then
                                                    speciesName = species.name
                                                end
                                            end
                                            if speciesName == "Unknown" and subType.name then
                                                speciesName = subType.name
                                            end
                                        end
                                    end
                                end
                                
                                breeds[breedName] = (breeds[breedName] or 0) + cluster.numAnimals
                            end
                        end
                        
                        if speciesName == "Unknown" then
                            local nameLower = barnName:lower()
                            if nameLower:find("cow") or nameLower:find("vache") then speciesName = "COW"
                            elseif nameLower:find("sheep") or nameLower:find("mouton") then speciesName = "SHEEP"
                            elseif nameLower:find("pig") or nameLower:find("cochon") then speciesName = "PIG"
                            elseif nameLower:find("chicken") or nameLower:find("poule") then speciesName = "CHICKEN"
                            elseif nameLower:find("horse") or nameLower:find("cheval") then speciesName = "HORSE"
                            end
                        end

                        local entry = {
                            id = animalId,
                            name = barnName,
                            type = speciesName,
                            species = speciesName,
                            count = totalAnimals,
                            breeds = breeds,
                            water = { current = 0, max = 0 },
                            straw = { current = 0, max = 0 },
                            food = { TOTAL = { current = 0, max = 0 } },
                            products = {}
                        }
                        
                        animalCount = animalCount + totalAnimals

                        local barnWater = { current = 0, max = 0 }
                        
                        if placeable.spec_husbandryWater then
                            local spec = placeable.spec_husbandryWater
                            local capacity = spec.capacity or 0
                            local level = spec.fillLevel or 0
                            if spec.getCapacity then pcall(function() capacity = spec:getCapacity() end) end
                            if spec.getFillLevel then pcall(function() level = spec:getFillLevel() end) end
                            barnWater.current = level
                            barnWater.max = capacity
                        end
                        
                        -- Universal FillUnit Scanner for Husbandries
                        local barnProducts = {}
                        barnProducts["WATER"] = { current = barnWater.current, max = barnWater.max }
                        
                        local function processFillUnit(p, i, level, capacity)
                                if not p or not i then return end
                                local fillTypeIndex = nil
                                if p.getFillUnitFillType then
                                    fillTypeIndex = p:getFillUnitFillType(i)
                                end
                                
                                -- Si p est un objet husbandry, il n'a peut-être pas getFillUnitFillType
                                if (not fillTypeIndex or fillTypeIndex == 0) and placeable.getFillUnitFillType then
                                    pcall(function() fillTypeIndex = placeable:getFillUnitFillType(i) end)
                                end
                                
                                -- Fallback direct sur la table fillUnits de l'objet
                                if (not fillTypeIndex or fillTypeIndex == 0) and p.fillUnits and p.fillUnits[i] then
                                    fillTypeIndex = p.fillUnits[i].fillType
                                end
                                
                                -- Si l'unité est vide, on essaie de deviner son type par les types supportés
                                if (not fillTypeIndex or fillTypeIndex == 0) and p.getFillUnitSupportedFillTypes then
                                    local supported = nil
                                    pcall(function() supported = p:getFillUnitSupportedFillTypes(i) end)
                                    if supported then
                                        for k, v in pairs(supported) do
                                            if type(v) == "boolean" and v then
                                                fillTypeIndex = k
                                                break
                                            elseif type(v) == "number" then
                                                fillTypeIndex = v
                                                break
                                            end
                                        end
                                    end
                                end
                                
                                if (not fillTypeIndex or fillTypeIndex == 0) and placeable.getFillUnitSupportedFillTypes then
                                    local supported = nil
                                    pcall(function() supported = placeable:getFillUnitSupportedFillTypes(i) end)
                                    if supported then
                                        for k, v in pairs(supported) do
                                            if type(v) == "boolean" and v then
                                                fillTypeIndex = k
                                                break
                                            elseif type(v) == "number" then
                                                fillTypeIndex = v
                                                break
                                            end
                                        end
                                    end
                                end
                                
                                -- Fallback direct sur spec_fillUnit
                                if (not fillTypeIndex or fillTypeIndex == 0) and placeable.spec_fillUnit and placeable.spec_fillUnit.fillUnits and placeable.spec_fillUnit.fillUnits[i] then
                                    local fu = placeable.spec_fillUnit.fillUnits[i]
                                    if fu.fillType then
                                        fillTypeIndex = fu.fillType
                                    elseif fu.supportedFillTypes then
                                        for k, v in pairs(fu.supportedFillTypes) do
                                            if type(v) == "boolean" and v then
                                                fillTypeIndex = k
                                                break
                                            elseif type(v) == "number" then
                                                fillTypeIndex = v
                                                break
                                            end
                                        end
                                    end
                                end

                                if fillTypeIndex and fillTypeIndex ~= 0 then
                                    local ft = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                    if ft and ft.name then
                                        local name = normalizeFillTypeName(ft.name)
                                        if name then
                                            barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                            barnProducts[name].current = math.max(barnProducts[name].current, level or 0)
                                            barnProducts[name].max = math.max(barnProducts[name].max, capacity or 0)
                                        end
                                    end
                                end
                            end

                            -- 1. Direct getFillUnits()
                            if placeable.getFillUnits ~= nil then
                                local fillUnits = nil
                                local ok, res = pcall(function() return placeable:getFillUnits() end)
                                if ok then fillUnits = res end
                                
                                if type(fillUnits) == "table" then
                                    for i, _ in pairs(fillUnits) do
                                        local level = 0
                                        local capacity = 0
                                        pcall(function()
                                            level = placeable:getFillUnitFillLevel(i)
                                            capacity = placeable:getFillUnitCapacity(i)
                                        end)
                                        processFillUnit(placeable, i, level, capacity)
                                    end
                                elseif type(fillUnits) == "number" then
                                    for i = 1, fillUnits do
                                        local level = 0
                                        local capacity = 0
                                        pcall(function()
                                            level = placeable:getFillUnitFillLevel(i)
                                            capacity = placeable:getFillUnitCapacity(i)
                                        end)
                                        processFillUnit(placeable, i, level, capacity)
                                    end
                                end
                            end
                            
                            -- 2. spec_fillUnit.fillUnits
                            if placeable.spec_fillUnit and placeable.spec_fillUnit.fillUnits then
                                for i, fillUnit in pairs(placeable.spec_fillUnit.fillUnits) do
                                    processFillUnit(placeable, i, fillUnit.fillLevel or 0, fillUnit.capacity or 0)
                                end
                            end

                            -- 3. Husbandry internal fill units (FS22/25 standard)
                            if placeable.spec_husbandryAnimals and placeable.spec_husbandryAnimals.husbandry then
                                local h = placeable.spec_husbandryAnimals.husbandry
                                if h.getFillUnits then
                                    local hFillUnits = nil
                                    local ok, res = pcall(function() return h:getFillUnits() end)
                                    if ok then hFillUnits = res end

                                    if type(hFillUnits) == "table" then
                                        for i, _ in pairs(hFillUnits) do
                                            local level = 0
                                            local capacity = 0
                                            pcall(function()
                                                level = h:getFillUnitFillLevel(i)
                                                capacity = h:getFillUnitCapacity(i)
                                            end)
                                            processFillUnit(h, i, level, capacity)
                                        end
                                    elseif type(hFillUnits) == "number" then
                                        for i = 1, hFillUnits do
                                            local level = 0
                                            local capacity = 0
                                            pcall(function()
                                                level = h:getFillUnitFillLevel(i)
                                                capacity = h:getFillUnitCapacity(i)
                                            end)
                                            processFillUnit(h, i, level, capacity)
                                        end
                                    end
                                end
                                -- Fallback direct access to fillUnits table in husbandry
                                if h.fillUnits then
                                    for i, fillUnit in ipairs(h.fillUnits) do
                                        processFillUnit(h, i, fillUnit.fillLevel or 0, fillUnit.capacity or 0)
                                    end
                                end
                            end

                            -- Fallback for specific specs if FillUnits didn't catch it
                            if placeable.spec_husbandryFood then
                                local spec = placeable.spec_husbandryFood
                                local totalLevel = spec.totalFoodLevel or 0
                                local totalCapacity = spec.totalFoodCapacity or 0
                                
                                barnProducts["TOTAL_FOOD"] = barnProducts["TOTAL_FOOD"] or { current = 0, max = 0 }
                                if barnProducts["TOTAL_FOOD"].current == 0 and barnProducts["TOTAL_FOOD"].max == 0 then
                                    barnProducts["TOTAL_FOOD"].current = totalLevel
                                    barnProducts["TOTAL_FOOD"].max = totalCapacity
                                end
                                
                                if type(spec.fillLevels) == "table" then
                                    for fillTypeIndex, fillLevel in pairs(spec.fillLevels) do
                                        if type(fillLevel) == "number" and fillLevel >= 0 then
                                            local ft = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                            if ft and ft.name then
                                                local name = ft.name:upper()
                                                local capacity = spec.capacity or 0
                                                barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                                barnProducts[name].current = math.max(barnProducts[name].current, fillLevel)
                                                barnProducts[name].max = math.max(barnProducts[name].max, capacity)
                                            end
                                        end
                                    end
                                elseif spec.getFillLevel then
                                    for fillTypeIndex, ft in pairs(g_fillTypeManager.fillTypes) do
                                        if type(fillTypeIndex) == "number" then
                                            local fillLevel = 0
                                            pcall(function() fillLevel = spec:getFillLevel(fillTypeIndex) end)
                                            if fillLevel and fillLevel >= 0 then
                                                local name = ft.name:upper()
                                                local capacity = spec.capacity or 0
                                                barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                                barnProducts[name].current = math.max(barnProducts[name].current, fillLevel)
                                                barnProducts[name].max = math.max(barnProducts[name].max, capacity)
                                            end
                                        end
                                    end
                                end
                            end
                            
                            local function processFillLevelsTable(fillLevelsTable, defaultCapacity)
                                if type(fillLevelsTable) == "table" then
                                    for ftIndex, lvl in pairs(fillLevelsTable) do
                                        local cap = defaultCapacity or 0
                                        if type(lvl) == "number" then
                                            local ft = g_fillTypeManager:getFillTypeByIndex(ftIndex)
                                            if ft and ft.name then
                                                local n = normalizeFillTypeName(ft.name)
                                                
                                                -- If cap is 0, try to find a capacity if it's a known product
                                                if cap == 0 then
                                                    if n == "MILK" or n == "GOAT_MILK" or n == "BUFFALO_MILK" then cap = 10000
                                                    elseif n == "LIQUIDMANURE" then cap = 50000
                                                    elseif n == "MANURE" then cap = 50000
                                                    elseif n == "STRAW" then cap = 20000
                                                    else cap = math.max(lvl, 1000) end
                                                end

                                                barnProducts[n] = barnProducts[n] or { current = 0, max = 0 }
                                                barnProducts[n].current = math.max(barnProducts[n].current, lvl)
                                                barnProducts[n].max = math.max(barnProducts[n].max, cap)
                                            end
                                        end
                                    end
                                end
                            end

                            if placeable.spec_husbandryStraw then
                                local spec = placeable.spec_husbandryStraw
                                local capacity = spec.capacity or 0
                                local level = spec.fillLevel or 0
                                if spec.getCapacity then pcall(function() capacity = spec:getCapacity() end) end
                                if spec.getFillLevel then pcall(function() level = spec:getFillLevel() end) end
                                
                                local fillUnitIndex = spec.fillUnitIndex
                                if (capacity == 0 or level == 0) and fillUnitIndex then
                                    if placeable.getFillUnitCapacity then pcall(function() capacity = placeable:getFillUnitCapacity(fillUnitIndex) end) end
                                    if placeable.getFillUnitFillLevel then pcall(function() level = placeable:getFillUnitFillLevel(fillUnitIndex) end) end
                                end
                                
                                -- Fallback for storage (FS25)
                                if (capacity == 0 or level == 0) and spec.storage then
                                    local fillTypeIndex = spec.fillType or g_fillTypeManager:getFillTypeIndexByName("STRAW")
                                    if fillTypeIndex then
                                        if spec.storage.getCapacity then pcall(function() capacity = spec.storage:getCapacity(fillTypeIndex) end) end
                                        if spec.storage.getFillLevel then pcall(function() level = spec.storage:getFillLevel(fillTypeIndex) end) end
                                    end
                                    if spec.storage.fillLevels then
                                        processFillLevelsTable(spec.storage.fillLevels, capacity)
                                    end
                                end

                                if (capacity == 0 or level == 0) and placeable.spec_husbandryAnimals and placeable.spec_husbandryAnimals.husbandry then
                                    local h = placeable.spec_husbandryAnimals.husbandry
                                    local hFillUnitIndex = fillUnitIndex
                                    if hFillUnitIndex then
                                        if h.getFillUnitCapacity then pcall(function() capacity = h:getFillUnitCapacity(hFillUnitIndex) end) end
                                        if h.getFillUnitFillLevel then pcall(function() level = h:getFillUnitFillLevel(hFillUnitIndex) end) end
                                    end
                                end
                                
                                processFillLevelsTable(spec.fillLevels, capacity)
                                
                                local name = "STRAW"
                                if spec.fillType then
                                    local ft = g_fillTypeManager:getFillTypeByIndex(spec.fillType)
                                    if ft and ft.name then name = ft.name:upper() end
                                end
                                barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                barnProducts[name].current = math.max(barnProducts[name].current, level)
                                barnProducts[name].max = math.max(barnProducts[name].max, capacity)
                            end
                            
                            if placeable.spec_husbandryMilk then
                                local spec = placeable.spec_husbandryMilk
                                local capacity = spec.capacity or 0
                                local level = spec.fillLevel or 0
                                if spec.getCapacity then pcall(function() capacity = spec:getCapacity() end) end
                                if spec.getFillLevel then pcall(function() level = spec:getFillLevel() end) end
                                
                                local fillUnitIndex = spec.fillUnitIndex
                                if (capacity == 0 or level == 0) and fillUnitIndex then
                                    if placeable.getFillUnitCapacity then pcall(function() capacity = placeable:getFillUnitCapacity(fillUnitIndex) end) end
                                    if placeable.getFillUnitFillLevel then pcall(function() level = placeable:getFillUnitFillLevel(fillUnitIndex) end) end
                                end
                                
                                -- Fallback for storage (FS25)
                                if (capacity == 0 or level == 0) and spec.storage then
                                    local fillTypeIndex = spec.fillType or g_fillTypeManager:getFillTypeIndexByName("MILK")
                                    if fillTypeIndex then
                                        if spec.storage.getCapacity then pcall(function() capacity = spec.storage:getCapacity(fillTypeIndex) end) end
                                        if spec.storage.getFillLevel then pcall(function() level = spec.storage:getFillLevel(fillTypeIndex) end) end
                                    end
                                    if spec.storage.fillLevels then
                                        processFillLevelsTable(spec.storage.fillLevels, capacity)
                                    end
                                end
                                
                                -- Si toujours 0, on cherche dans l'objet husbandry interne
                                if (capacity == 0 or level == 0) and placeable.spec_husbandryAnimals and placeable.spec_husbandryAnimals.husbandry then
                                    local h = placeable.spec_husbandryAnimals.husbandry
                                    local hFillUnitIndex = fillUnitIndex
                                    if hFillUnitIndex then
                                        if h.getFillUnitCapacity then pcall(function() capacity = h:getFillUnitCapacity(hFillUnitIndex) end) end
                                        if h.getFillUnitFillLevel then pcall(function() level = h:getFillUnitFillLevel(hFillUnitIndex) end) end
                                    end
                                end

                                processFillLevelsTable(spec.fillLevels, capacity)

                                local name = "MILK"
                                if spec.fillType then
                                    local ft = g_fillTypeManager:getFillTypeByIndex(spec.fillType)
                                    if ft and ft.name then name = ft.name:upper() end
                                end
                                -- Normalisation
                                if name == "GOAT_MILK" then name = "GOATMILK" end
                                if name == "BUFFALO_MILK" then name = "BUFFALOMILK" end
                                
                                barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                barnProducts[name].current = math.max(barnProducts[name].current, level)
                                barnProducts[name].max = math.max(barnProducts[name].max, capacity)
                            end
                            
                            if placeable.spec_husbandryLiquidManure then
                                local spec = placeable.spec_husbandryLiquidManure
                                local capacity = spec.capacity or 0
                                local level = spec.fillLevel or 0
                                if spec.getCapacity then pcall(function() capacity = spec:getCapacity() end) end
                                if spec.getFillLevel then pcall(function() level = spec:getFillLevel() end) end
                                
                                local fillUnitIndex = spec.fillUnitIndex
                                if (capacity == 0 or level == 0) and fillUnitIndex then
                                    if placeable.getFillUnitCapacity then pcall(function() capacity = placeable:getFillUnitCapacity(fillUnitIndex) end) end
                                    if placeable.getFillUnitFillLevel then pcall(function() level = placeable:getFillUnitFillLevel(fillUnitIndex) end) end
                                end
                                
                                -- Fallback for storage (FS25)
                                if (capacity == 0 or level == 0) and spec.storage then
                                    local fillTypeIndex = spec.fillType or g_fillTypeManager:getFillTypeIndexByName("LIQUIDMANURE")
                                    if fillTypeIndex then
                                        if spec.storage.getCapacity then pcall(function() capacity = spec.storage:getCapacity(fillTypeIndex) end) end
                                        if spec.storage.getFillLevel then pcall(function() level = spec.storage:getFillLevel(fillTypeIndex) end) end
                                    end
                                    if spec.storage.fillLevels then
                                        processFillLevelsTable(spec.storage.fillLevels, capacity)
                                    end
                                end

                                if (capacity == 0 or level == 0) and placeable.spec_husbandryAnimals and placeable.spec_husbandryAnimals.husbandry then
                                    local h = placeable.spec_husbandryAnimals.husbandry
                                    local hFillUnitIndex = fillUnitIndex
                                    if hFillUnitIndex then
                                        if h.getFillUnitCapacity then pcall(function() capacity = h:getFillUnitCapacity(hFillUnitIndex) end) end
                                        if h.getFillUnitFillLevel then pcall(function() level = h:getFillUnitFillLevel(hFillUnitIndex) end) end
                                    end
                                end

                                processFillLevelsTable(spec.fillLevels, capacity)

                                local name = "LIQUIDMANURE"
                                if spec.fillType then
                                    local ft = g_fillTypeManager:getFillTypeByIndex(spec.fillType)
                                    if ft and ft.name then name = ft.name:upper() end
                                end
                                if name == "LIQUID_MANURE" then name = "LIQUIDMANURE" end
                                
                                barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                barnProducts[name].current = math.max(barnProducts[name].current, level)
                                barnProducts[name].max = math.max(barnProducts[name].max, capacity)
                            end
                            if placeable.spec_husbandryManure then
                                local spec = placeable.spec_husbandryManure
                                local capacity = spec.capacity or 0
                                local level = spec.fillLevel or 0
                                if spec.getCapacity then pcall(function() capacity = spec:getCapacity() end) end
                                if spec.getFillLevel then pcall(function() level = spec:getFillLevel() end) end
                                
                                local fillUnitIndex = spec.fillUnitIndex
                                if (capacity == 0 or level == 0) and fillUnitIndex then
                                    if placeable.getFillUnitCapacity then pcall(function() capacity = placeable:getFillUnitCapacity(fillUnitIndex) end) end
                                    if placeable.getFillUnitFillLevel then pcall(function() level = placeable:getFillUnitFillLevel(fillUnitIndex) end) end
                                end
                                
                                -- Fallback for storage (FS25)
                                if (capacity == 0 or level == 0) and spec.storage then
                                    local fillTypeIndex = spec.fillType or g_fillTypeManager:getFillTypeIndexByName("MANURE")
                                    if fillTypeIndex then
                                        if spec.storage.getCapacity then pcall(function() capacity = spec.storage:getCapacity(fillTypeIndex) end) end
                                        if spec.storage.getFillLevel then pcall(function() level = spec.storage:getFillLevel(fillTypeIndex) end) end
                                    end
                                    if spec.storage.fillLevels then
                                        processFillLevelsTable(spec.storage.fillLevels, capacity)
                                    end
                                end

                                if (capacity == 0 or level == 0) and placeable.spec_husbandryAnimals and placeable.spec_husbandryAnimals.husbandry then
                                    local h = placeable.spec_husbandryAnimals.husbandry
                                    local hFillUnitIndex = fillUnitIndex
                                    if hFillUnitIndex then
                                        if h.getFillUnitCapacity then pcall(function() capacity = h:getFillUnitCapacity(hFillUnitIndex) end) end
                                        if h.getFillUnitFillLevel then pcall(function() level = h:getFillUnitFillLevel(hFillUnitIndex) end) end
                                    end
                                end

                                processFillLevelsTable(spec.fillLevels, capacity)

                                local name = "MANURE"
                                if spec.fillType then
                                    local ft = g_fillTypeManager:getFillTypeByIndex(spec.fillType)
                                    if ft and ft.name then name = ft.name:upper() end
                                end
                                barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                barnProducts[name].current = math.max(barnProducts[name].current, level)
                                barnProducts[name].max = math.max(barnProducts[name].max, capacity)
                            end
                                
                                -- FS25 / FS22 Module Fallback
                                if placeable.spec_husbandryAnimals and placeable.spec_husbandryAnimals.husbandry then
                                    local h = placeable.spec_husbandryAnimals.husbandry
                                    local function processHusbandryModule(mod, defaultFillTypeName)
                                        if not mod then return end
                                        
                                        -- 1. Try to process fillLevels if they exist
                                        if mod.fillLevels then
                                            processFillLevelsTable(mod.fillLevels, mod.capacity or 0)
                                        end
                                        
                                        -- 2. Process storages
                                        local storagesToCheck = {}
                                        if mod.storage then table.insert(storagesToCheck, mod.storage) end
                                        if mod.storages then
                                            for _, s in pairs(mod.storages) do table.insert(storagesToCheck, s) end
                                        end
                                        
                                        for _, storage in ipairs(storagesToCheck) do
                                            local fillLevels = storage.fillLevels
                                            if not fillLevels and storage.getFillLevels then 
                                                pcall(function() fillLevels = storage:getFillLevels() end) 
                                            end
                                            if fillLevels then
                                                processFillLevelsTable(fillLevels, storage.capacity or 0)
                                            else
                                                -- Single fill type storage?
                                                local level = 0
                                                local capacity = 0
                                                if storage.getFillLevel then pcall(function() level = storage:getFillLevel() or 0 end) end
                                                if storage.getCapacity then pcall(function() capacity = storage:getCapacity() or 0 end) end
                                                
                                                local fillTypeIndex = mod.fillType or (storage.getFillType and storage:getFillType())
                                                local name = defaultFillTypeName
                                                if fillTypeIndex then
                                                    local ft = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                                    if ft and ft.name then name = normalizeFillTypeName(ft.name) end
                                                end
                                                
                                                if name and (level > 0 or capacity > 0) then
                                                    barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                                    barnProducts[name].current = math.max(barnProducts[name].current, level)
                                                    barnProducts[name].max = math.max(barnProducts[name].max, capacity)
                                                end
                                            end
                                        end
                                        
                                        -- 3. Fallback to module's own level/capacity if still 0
                                        local level = 0
                                        local capacity = 0
                                        if mod.getFillLevel then pcall(function() level = mod:getFillLevel() or 0 end) end
                                        if mod.getCapacity then pcall(function() capacity = mod:getCapacity() or 0 end) end
                                        if level == 0 and mod.fillLevel then level = mod.fillLevel end
                                        if capacity == 0 and mod.capacity then capacity = mod.capacity end
                                        
                                        local name = defaultFillTypeName
                                        local fillTypeIndex = mod.fillType
                                        if fillTypeIndex then
                                            local ft = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                            if ft and ft.name then name = normalizeFillTypeName(ft.name) end
                                        end
                                        
                                        if name and (level > 0 or capacity > 0) then
                                            barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                            barnProducts[name].current = math.max(barnProducts[name].current, level)
                                            barnProducts[name].max = math.max(barnProducts[name].max, capacity)
                                        end
                                    end
                                    
                                    local function getMod(modName)
                                        local mod = nil
                                        if h.getModuleByName then pcall(function() mod = h:getModuleByName(modName) end) end
                                        if not mod and h.modulesByName then mod = h.modulesByName[modName] end
                                        if not mod and h.modules then
                                            for _, m in pairs(h.modules) do
                                                if m.name == modName or m.moduleName == modName then
                                                    mod = m
                                                    break
                                                end
                                            end
                                        end
                                        return mod
                                    end
                                    
                                    processHusbandryModule(getMod("milk"), "MILK")
                                    processHusbandryModule(getMod("liquidManure"), "LIQUIDMANURE")
                                    processHusbandryModule(getMod("manure"), "MANURE")
                                    processHusbandryModule(getMod("straw"), "STRAW")
                                    processHusbandryModule(getMod("water"), "WATER")
                                    processHusbandryModule(getMod("food"), "TOTAL_FOOD")
                                end

                                -- Eggs and other products (Pallets)
                                if placeable.spec_husbandryPallets then
                                    local spec = placeable.spec_husbandryPallets
                                    if spec.fillLevels then
                                        for fillTypeIndex, fillLevel in pairs(spec.fillLevels) do
                                            if fillLevel > 0 then
                                                local ft = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                                if ft and ft.name then
                                                    local name = ft.name:upper()
                                                    local capacity = spec.capacity or 2000
                                                    barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                                    barnProducts[name].current = math.max(barnProducts[name].current, fillLevel)
                                                    barnProducts[name].max = math.max(barnProducts[name].max, capacity)
                                                end
                                            end
                                        end
                                    end
                                end

                                -- Generic Storage Scanner (FS25)
                                if placeable.getStorages then
                                    local storages = nil
                                    pcall(function() storages = placeable:getStorages() end)
                                    if storages then
                                        for _, storage in pairs(storages) do
                                            local supportedFillTypes = nil
                                            if storage.getSupportedFillTypes then pcall(function() supportedFillTypes = storage:getSupportedFillTypes() end) end
                                            if not supportedFillTypes and storage.supportedFillTypes then supportedFillTypes = storage.supportedFillTypes end
                                            
                                            local fillLevels = nil
                                            if storage.getFillLevels then pcall(function() fillLevels = storage:getFillLevels() end) end
                                            if not fillLevels and storage.fillLevels then fillLevels = storage.fillLevels end
                                            
                                            if supportedFillTypes then
                                                for fillTypeIndex, isSupported in pairs(supportedFillTypes) do
                                                    if isSupported then
                                                        local level = 0
                                                        if storage.getFillLevel then pcall(function() level = storage:getFillLevel(fillTypeIndex) end) end
                                                        if level == 0 and fillLevels and fillLevels[fillTypeIndex] then level = fillLevels[fillTypeIndex] end
                                                        
                                                        local capacity = 0
                                                        if storage.getCapacity then pcall(function() capacity = storage:getCapacity(fillTypeIndex) end) end
                                                        if capacity == 0 and storage.capacity then capacity = storage.capacity end
                                                        
                                                        if level >= 0 or capacity > 0 then
                                                            local ft = g_fillTypeManager:getFillTypeByIndex(fillTypeIndex)
                                                            if ft and ft.name then
                                                                local name = normalizeFillTypeName(ft.name:upper())
                                                                if name then
                                                                    barnProducts[name] = barnProducts[name] or { current = 0, max = 0 }
                                                                    barnProducts[name].current = math.max(barnProducts[name].current, level)
                                                                    barnProducts[name].max = math.max(barnProducts[name].max, capacity)
                                                                end
                                                            end
                                                        end
                                                    end
                                                end
                                            elseif fillLevels then
                                                processFillLevelsTable(fillLevels, storage.capacity or 0)
                                            end
                                        end
                                    end
                                end

                                    -- Add to global storage once per barn
                                    for name, prodData in pairs(barnProducts) do
                                        local normName = normalizeFillTypeName(name)
                                        if normName then
                                            data.storage[normName] = data.storage[normName] or { level = 0, capacity = 0 }
                                            data.storage[normName].level = data.storage[normName].level + prodData.current
                                            data.storage[normName].capacity = data.storage[normName].capacity + (prodData.max or 0)
                                        end
                                    end

                                -- Merge barn products into the current barn entry
                                local barnFoodTotal = { current = 0, max = 0 }
                                for name, prodData in pairs(barnProducts) do
                                    local normName = normalizeFillTypeName(name)
                                    if normName then
                                        if normName == "WATER" then
                                            entry.water.current = entry.water.current + prodData.current
                                            entry.water.max = entry.water.max + prodData.max
                                        elseif normName == "STRAW" then
                                            entry.straw = entry.straw or { current = 0, max = 0 }
                                            entry.straw.current = entry.straw.current + prodData.current
                                            entry.straw.max = entry.straw.max + prodData.max
                                        elseif normName == "MANURE" or normName == "LIQUIDMANURE" or normName == "MILK" or normName == "EGG" or normName == "WOOL" or normName == "HONEY" or normName == "GOATMILK" or normName == "BUFFALOMILK" or normName == "HORSE_TRAINING" then
                                            entry.products[normName] = entry.products[normName] or { current = 0, max = 0 }
                                            entry.products[normName].current = entry.products[normName].current + prodData.current
                                            entry.products[normName].max = entry.products[normName].max + prodData.max
                                        elseif normName == "TOTAL_FOOD" then
                                            -- Handled after the loop
                                        else
                                            entry.food[normName] = entry.food[normName] or { current = 0, max = 0 }
                                            entry.food[normName].current = entry.food[normName].current + prodData.current
                                            entry.food[normName].max = entry.food[normName].max + prodData.max
                                            
                                            barnFoodTotal.current = barnFoodTotal.current + prodData.current
                                            barnFoodTotal.max = barnFoodTotal.max + prodData.max
                                        end
                                    end
                                end
                                
                                if barnFoodTotal.current == 0 and barnFoodTotal.max == 0 and barnProducts["TOTAL_FOOD"] then
                                    barnFoodTotal.current = barnProducts["TOTAL_FOOD"].current
                                    barnFoodTotal.max = barnProducts["TOTAL_FOOD"].max
                                end
                                
                                entry.food.TOTAL.current = entry.food.TOTAL.current + barnFoodTotal.current
                                entry.food.TOTAL.max = entry.food.TOTAL.max + barnFoodTotal.max
                                
                                table.insert(data.animals, entry)
                            end
                        end
                    end
                end

        -- 4. Écriture Fichier (Partie Critique)
        local webSyncPath = nil
        
        -- Tentative 1: g_currentModSettingsDirectory (Le plus fiable en général)
        if g_currentModSettingsDirectory and g_currentModSettingsDirectory ~= "" then
            local path = string.gsub(g_currentModSettingsDirectory, "\\", "/")
            if string.sub(path, -1) == "/" then path = string.sub(path, 1, -2) end
            
            -- On cherche à remonter jusqu'à modSettings pour créer notre dossier FS25_WebSync à côté
            local parent = string.match(path, "(.*)/")
            if parent then
                webSyncPath = parent .. "/FS25_WebSync"
            end
        end
        
        -- Tentative 2: getUserProfileAppPath() (Fallback classique)
        if not webSyncPath then
            local userProfile = nil
            if type(getUserProfileAppPath) == "function" then
                userProfile = getUserProfileAppPath()
            end
            
            if userProfile and userProfile ~= "" then
                userProfile = string.gsub(userProfile, "\\", "/")
                if string.sub(userProfile, -1) ~= "/" then userProfile = userProfile .. "/" end
                webSyncPath = userProfile .. "modSettings/FS25_WebSync"
            end
        end
        
        -- Tentative 3: Fallback ultime sur le dossier par défaut du mod
        if not webSyncPath then
            if g_currentModSettingsDirectory and g_currentModSettingsDirectory ~= "" then
                webSyncPath = string.gsub(g_currentModSettingsDirectory, "\\", "/")
            else
                print("[WebSync] ERREUR CRITIQUE: Impossible de determiner un chemin d'exportation.")
                return
            end
        end

        if string.sub(webSyncPath, -1) == "/" then webSyncPath = string.sub(webSyncPath, 1, -2) end
        print("[WebSync] Chemin d'exportation retenu: " .. tostring(webSyncPath))
        
        -- Tentative de creation des dossiers
        local function safeCreateFolder(path)
            if Files and Files.createFolder then
                Files.createFolder(path)
            elseif createFolder then
                createFolder(path)
            end
        end

        -- On s'assure que le dossier parent existe (modSettings)
        local parentPath = string.match(webSyncPath, "(.*)/")
        if parentPath then safeCreateFolder(parentPath) end
        safeCreateFolder(webSyncPath)
        
        local filePath = webSyncPath .. "/data.json"
        local file, fileErr = io.open(filePath, "w")
        
        if not file then
            print("[WebSync] Echec io.open sur " .. tostring(filePath) .. " : " .. tostring(fileErr))
            -- Fallback sur g_currentModSettingsDirectory si on avait essayé autre chose
            if g_currentModSettingsDirectory and g_currentModSettingsDirectory ~= "" then
                local fallbackPath = string.gsub(g_currentModSettingsDirectory, "\\", "/")
                if string.sub(fallbackPath, -1) == "/" then fallbackPath = string.sub(fallbackPath, 1, -2) end
                filePath = fallbackPath .. "/data.json"
                file, fileErr = io.open(filePath, "w")
                if file then
                    print("[WebSync] Utilisation du chemin de repli: " .. tostring(filePath))
                end
            end
        end

        if file then
            local jsonContent = self:encodeJSON(data)
            if jsonContent then
                file:write(jsonContent)
                file:close()
                print("[WebSync] SUCCES: data.json mis a jour dans " .. tostring(filePath))
            else
                print("[WebSync] ERREUR: Echec encodage JSON.")
                file:close()
            end
        else
            print("[WebSync] ERREUR CRITIQUE: Impossible d'ouvrir le fichier pour ecriture. Erreur: " .. tostring(fileErr))
        end
    end)

    if not status then
        print("[WebSync] CRASH dans exportData: " .. tostring(err))
    end
end

-- Fonction utilitaire pour convertir les données Lua en JSON avec échappement des caractères spéciaux
function WebSync:encodeJSON(val)
    local function escape(s)
        if type(s) ~= "string" then return tostring(s) end
        s = s:gsub('\\', '\\\\')
        s = s:gsub('"', '\\"')
        s = s:gsub('\n', '\\n')
        s = s:gsub('\r', '\\r')
        s = s:gsub('\t', '\\t')
        return s
    end

    local function encode(v)
        local t = type(v)
        if t == "table" then
            local res = {}
            local isArray = true
            local maxIndex = 0
            local count = 0
            for k, _ in pairs(v) do
                count = count + 1
                if type(k) ~= "number" then
                    isArray = false
                else
                    if k > maxIndex then maxIndex = k end
                end
            end
            
            if isArray and count > 0 then
                for i = 1, maxIndex do
                    table.insert(res, encode(v[i]))
                end
                return "[" .. table.concat(res, ",") .. "]"
            elseif isArray and count == 0 then
                -- Table vide, on l'encode comme un tableau par défaut pour FS
                return "[]"
            else
                for k, val in pairs(v) do
                    table.insert(res, '"' .. escape(tostring(k)) .. '":' .. encode(val))
                end
                return "{" .. table.concat(res, ",") .. "}"
            end
        elseif t == "string" then
            return '"' .. escape(v) .. '"'
        elseif t == "number" then
            -- Éviter les nan/inf qui cassent le JSON
            if v ~= v then return "0" end -- NaN
            if v == math.huge or v == -math.huge then return "0" end -- Inf
            return tostring(v)
        elseif t == "boolean" then
            return tostring(v)
        else
            return "null"
        end
    end
    
    return encode(val)
end

addModEventListener(WebSync)
