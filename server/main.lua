local serverCallback = {}

local RESOURCE_NAME = GetCurrentResourceName()
local CATEGORY_FILE = Config.db.category
local PRESET_FILE = Config.db.preset
local PROP_FILE = Config.db.prop
local BONE_FILE = Config.db.bone

local function addItemId(database)
    if not database or type(database) ~= 'table' then
        error('Database is not exist!')
        return false
    end

    local id = 0
    for _, item in pairs(database) do
        item.id = id
        id = id + 1
    end

    return database
end

local function getDB(database)
    return json.decode(LoadResourceFile(RESOURCE_NAME, database))
end

local function compareByName(a, b)
    return (a.name or "") < (b.name or "")
end

local function saveDB(data, file, sort, customCompareFunction)
    if sort then
        table.sort(data, customCompareFunction or nil)
    end

    local jsonString = json.encode(data, { pretty = 1, sort_keys = 1 })
    return SaveResourceFile(RESOURCE_NAME, file, jsonString, -1)
end

local function sendSaveMessage(subject, playerId, success)
    local color = success and { 0, 255, 0 } or { 255, 0, 0 }
    local msg = ("%s %s (Referrer: ^3%s)"):format(subject, success and ' saved' or ' save failed', GetPlayerName(playerId))
    TriggerClientEvent('chat:addMessage', playerId, { color = color, multiline = false, args = { "ECO ANIM:", msg } })
end

local function notValidDbMessage(subject, playerId)
    local msg = ("%s db: Not Loaded)"):format(subject)
    TriggerClientEvent('chat:addMessage', playerId, { color = { 255, 0, 0 }, multiline = false, args = { "ECO ANIM:", msg } })
end

local function notFoundItemMessage(subject, playerId)
    local msg = ("%s db: Item not found)"):format(subject)
    TriggerClientEvent('chat:addMessage', playerId, { color = { 255, 0, 0 }, multiline = false, args = { "ECO ANIM:", msg } })
end

local function notValidArgMessage(subject, value, playerId)
    local msg = ("%s -> %s: Not valid argument)"):format(subject, tostring(value))
    TriggerClientEvent('chat:addMessage', playerId, { color = { 255, 0, 0 }, multiline = false, args = { "ECO ANIM:", msg } })
end

local function getMaxId(tbl)
    local maxId = 0
    for _, item in pairs(tbl) do
        local id = tonumber(item.id) or 0
        maxId = id > maxId and id or maxId
    end
    return maxId
end

local function getIndexById(tbl, id)
    for i, item in ipairs(tbl) do
        if item.id == id then
            return i
        end
    end
    return false
end

function table.clone(tbl)
    local result = {}
    for key, value in pairs(tbl) do
        if type(value) == "table" then
            result[key] = table.clone(value)
        else
            result[key] = value
        end
    end
    return result
end

local function removeId(tbl)
    local result = table.clone(tbl)
    for _, item in ipairs(result) do
        item.id = nil
    end
    return result
end

local db = {
    presets = addItemId(getDB(PRESET_FILE)),
    categories = getDB(CATEGORY_FILE),
    props = getDB(PROP_FILE),
    bones = getDB(BONE_FILE)
}

--- PRESETS
RegisterServerEvent('eco_anim:addPreset', function(data)
    local playerId = source
    if not db.presets then
        notValidDbMessage('PRESET', playerId)
        return false
    end

    local id = getMaxId(db.presets) + 1
    data.id = id
    table.insert(db.presets, data)
    local success = saveDB(removeId(db.presets), PRESET_FILE, true, compareByName)
    sendSaveMessage('PRESETS', playerId, success)
    if success then
        TriggerClientEvent('eco_anim:databaseChanged', -1, 'presets', 'add', data, playerId)
    end
end)

RegisterServerEvent('eco_anim:updatePreset', function(data)
    local playerId = source
    local id = tonumber(data.id)

    if not db.presets then
        notValidDbMessage('PRESET', playerId)
        return false
    end

    if not id then
        notValidArgMessage('ID', id, playerId)
        return false
    end

    local foundIndex = getIndexById(db.presets, id)

    if not foundIndex then
        notFoundItemMessage('PRESET', playerId)
        return false
    end

    db.presets[foundIndex] = data
    local success = saveDB(removeId(db.presets), PRESET_FILE, true, compareByName)
    sendSaveMessage('PRESETS', playerId, success)
    if success then
        TriggerClientEvent('eco_anim:databaseChanged', -1, 'presets', 'update', data, playerId)
    end
end)

RegisterServerEvent('eco_anim:removePreset', function(id)
    local playerId = source
    id = tonumber(id)

    if not db.presets then
        notValidDbMessage('PRESET', playerId)
        return false
    end

    if not id then
        notValidArgMessage('ID', id, playerId)
        return false
    end

    local foundIndex = getIndexById(db.presets, id)

    if not foundIndex then
        notFoundItemMessage('PRESET', playerId)
        return false
    end

    table.remove(db.presets, foundIndex)
    local success = saveDB(removeId(db.presets), PRESET_FILE, true, compareByName)
    sendSaveMessage('PRESETS', playerId, success)
    if success then
        TriggerClientEvent('eco_anim:databaseChanged', -1, 'presets', 'remove', id, playerId)
    end
end)

--- PROPS
RegisterServerEvent('eco_anim:addProp', function(data)
    local playerId = source
    if not db.props then
        notValidDbMessage('PROPS', playerId)
    end

    table.insert(db.props, data)

    local success = saveDB(db.props, PROP_FILE, true)
    sendSaveMessage('PROPS', playerId, success)
    if success then
        TriggerClientEvent('eco_anim:databaseChanged', -1, 'props', 'addProp', data, playerId)
    end
end)

serverCallback['eco_anim:getDB'] = function(playerId, cb, data)
    cb(db)
end

RegisterServerEvent('eco_anim:triggerServerCallback', function(_name, _cbId, ...)
    local _source = source
    if serverCallback[_name] then
        serverCallback[_name](_source, function(...)
            TriggerClientEvent('eco_anim:serverCallback', _source, _cbId, ...)
        end, ...)
    end
end)

function print_r(data)
    print(json.encode(data, { pretty = 1, sort_keys = 1 }))
end