-- Animation database: database/animations.js
-- Props database: database/prop.json
-- Bones database: database/bone.json
-- Preset category database: database/category.json
-- Preset database: database/preset.json

Config.locale = 'en'
Config.peds = {
    { model = 'a_m_y_skater_01', flag = 16 },
    { model = 'a_f_y_bevhills_02', flag = 0 },
    { model = 'a_m_y_skater_02', flag = 0 },
}

Config.pedDistance = 3 -- The distance of the observer from the peds
Config.pedSpacing = 1.5 -- The distance between the rows of peds

Config.db = {
    prop = 'database/prop.json',
    bone = 'database/bone.json',
    preset = 'database/preset.json',
    category = 'database/category.json'
}