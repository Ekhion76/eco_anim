local _PlayerPedId, cam
local data = {
    { hash = 'a_m_y_skater_01', flag = 16 },
    { hash = 'a_m_y_skater_02', flag = 0 },
    { hash = 'a_f_m_bevhills_01', flag = 0 },
}

local on = false

RegisterCommand('anim', function()

    on = true

    SendNUIMessage({
        subject = 'OPEN'
    })
end)


RegisterNUICallback('playAnim', function(nuiData, cb)

    _PlayerPedId = PlayerPedId()

    stopAnim()
    msginf('stop anim', 1000)

    ClearPedTasksImmediately(_PlayerPedId)
    Citizen.Wait(100)

    npcHandler(nuiData.lib, nuiData.anim)

    msginf('PLAYING: ' .. nuiData.anim, 15000)


    if not cam then

        local pos = GetEntityForwardVector(data[2].npc) * 5 + GetEntityCoords(data[2].npc)

        local curCam = GetRenderingCam()
        cam = CreateCamWithParams("DEFAULT_SCRIPTED_CAMERA", pos.x, pos.y, pos.z + 0.5, -5.0, 0.0, data[2].heading - 180, 60.00, false, 0)
        SetCamActive(cam, true)
        RenderScriptCams(true, 1, 1000, 1, 1);
        SetCamActiveWithInterp(curCam, cam, 1, 1000, 1);
    end

    cb('ok')
end)



function modelLoader(model)

    if not HasModelLoaded(model) then

        RequestModel(model)
        Citizen.Wait(100)
        while not HasModelLoaded(model) do Citizen.Wait(10) end
    end
end


-- NPC
function npcHandler(lib, anim)

    _PlayerPedId = PlayerPedId()

    local offset = GetEntityForwardVector(_PlayerPedId) * 6
    local pos = GetEntityCoords(_PlayerPedId)
    local heading = GetEntityHeading(_PlayerPedId)
    local npcHeading = heading - 180

    local x, y, xVector, yVector
    local forward = {}
    local xDistance = 2.0


    forward.x = math.sin(math.rad(heading + 90.0))
    forward.y = math.cos(math.rad(heading + 90.0))


    for k, param in pairs(data) do

        if not param.npc then

            modelLoader(param.hash)

            x = pos.x - forward.x * (k - 2) * xDistance + offset.x
            y = pos.y + forward.y * (k - 2) * xDistance + offset.y

            local _, z = GetGroundZFor_3dCoord(x, y, pos.z, 0)
            param.npc = CreatePed(6, param.hash, x, y, z, npcHeading, false, false)

            param.pos = vector3(x, y, z)
            param.heading = npcHeading
        else

            SetEntityCoords(param.npc, param.pos)
            SetEntityHeading(param.npc, param.heading)
        end
    end

    local lastNpc

    for _, param in pairs(data) do

        setAnim(param.npc, lib, anim, param.flag)
        lastNpc = param.npc
    end

    TriggerEvent('eco_anim:timer', lastNpc, lib, anim)
end


function npcDeleter()

    for _, param in pairs(data) do

        DeletePed(param.npc)
        param.npc = nil
    end
end


function stopAnim()

    for _, param in pairs(data) do

        if param.npc then

            ClearPedTasksImmediately(param.npc)
        end
    end

    msginf('CLEARED', 2000)
end


function setAnim(ped, lib, anim, flag)

    local try = 0

    if not HasAnimDictLoaded(lib) then

        RequestAnimDict(lib)
        while not HasAnimDictLoaded(lib) and try < 10 do
            try = try + 1

            if try == 10 then

                msginf('~r~NEM LEHET BETÖLTENI:' .. lib, 5000)
            end
            Citizen.Wait(100)
        end
    end

    TaskPlayAnim(ped,
        lib,
        anim,
        8.0, -- blendInSpeed
        8.0, -- blendOutSpeed
        -1, -- duration
        flag, -- flag
        0, -- playbackRate
        false, -- lockX
        false, -- lockY
        false) -- lockZ
end


RegisterNUICallback('exit', function(data, cb)

    on = false

    SetCamActive(cam, false)
    DestroyCam(cam, true)
    RenderScriptCams(false, 1, 1000, 1, 1);
    cam = nil
    SetNuiFocus(false, false)

    if data.off then

        npcDeleter()
    end
    cb('ok')
end)

AddEventHandler('eco_anim:timer', function(ped, lib, anim)

    local start = GetGameTimer()

    Citizen.CreateThread(function()

        while IsEntityPlayingAnim(ped, lib, anim, 3) do

            Citizen.Wait(100)

            SendNUIMessage({
                subject = 'TIME',
                time = GetGameTimer() - start
            })
        end
    end)
end)

function msginf(msg, duree)
    duree = duree or 500
    ClearPrints()
    SetTextEntry_2("STRING")
    AddTextComponentString(msg)
    DrawSubtitleTimed(duree, 1)
end


RegisterKeyMapping("tnf", "Focus", "keyboard", "i") --Removed Bind System and added standalone version
RegisterCommand('tnf', function(source, args, raw)

    if on then SetNuiFocus(true, true) end
end, false)
--TriggerEvent("chat:removeSuggestion", "/+toggleNuiFocus")


function print_r(t)
    local print_r_cache = {}
    local function sub_print_r(t, indent)
        if (print_r_cache[tostring(t)]) then
            print(indent .. "*" .. tostring(t))
        else
            print_r_cache[tostring(t)] = true
            if (type(t) == "table") then
                for pos, val in pairs(t) do
                    if (type(val) == "table") then
                        print(indent .. "[" .. pos .. "] => " .. tostring(t) .. " {")
                        sub_print_r(val, indent .. string.rep(" ", string.len(pos) + 8))
                        print(indent .. string.rep(" ", string.len(pos) + 6) .. "}")
                    else
                        print(indent .. "[" .. pos .. "] => " .. tostring(val))
                    end
                end
            else
                print(indent .. tostring(t))
            end
        end
    end

    sub_print_r(t, "  ")
end