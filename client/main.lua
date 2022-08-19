local _PlayerPedId, cam
local peds = {
    { hash = 'a_m_y_skater_01', flag = 16 },
    { hash = 'a_m_y_skater_02', flag = 0 },
    { hash = 'a_f_m_bevhills_01', flag = 0 },
}

RegisterCommand('anim', function()

    SetNuiFocus(true, true)
    SendNUIMessage({
        subject = 'OPEN'
    })
end)

function loadAnimDict(data)

    if not DoesAnimDictExist(data.dict) then
        return false
    end

    if not HasAnimDictLoaded(data.dict) then

        RequestAnimDict(data.dict)

        while not HasAnimDictLoaded(data.dict) do
            Wait(10)
        end
    end

    return true
end

function camRender()

    if not cam then

        local pos = GetEntityForwardVector(peds[2].npc) * 5 + GetEntityCoords(peds[2].npc)

        local curCam = GetRenderingCam()
        cam = CreateCamWithParams("DEFAULT_SCRIPTED_CAMERA", pos.x, pos.y, pos.z + 0.5, -5.0, 0.0, peds[2].heading - 180, 60.00, false, 0)
        SetCamActive(cam, true)
        RenderScriptCams(true, 1, 1000, 1, 1);
        SetCamActiveWithInterp(curCam, cam, 1, 1000, 1);
    end
end

RegisterNUICallback('playAnim', function(data, cb)

    _PlayerPedId = PlayerPedId()

    stopAnim()

    ClearPedTasksImmediately(_PlayerPedId)

    if not loadAnimDict(data) then

        cb({
            loadAnim = false,
            dict = data.dict,
            name = data.name,
            playTime = 0
        })
        return false
    end

    npcHandler(data.dict, data.name)
    camRender()

    cb({
        loadAnim = true,
        dict = data.dict,
        name = data.name,
        playTime = GetAnimDuration(data.dict, data.name)
    })
end)

function modelLoader(model)

    if not HasModelLoaded(model) then

        RequestModel(model)
        Wait(100)
        while not HasModelLoaded(model) do
            Wait(10)
        end
    end
end


-- NPC
function npcHandler(lib, anim)

    _PlayerPedId = PlayerPedId()

    local x, y
    local forward = {}
    local xDistance = 2.0

    local offset = GetEntityForwardVector(_PlayerPedId) * 6
    local pos = GetEntityCoords(_PlayerPedId)
    local heading = GetEntityHeading(_PlayerPedId)
    local npcHeading = heading - 180

    forward.x = math.sin(math.rad(heading + 90.0))
    forward.y = math.cos(math.rad(heading + 90.0))

    for k, param in pairs(peds) do

        if not param.npc then

            modelLoader(param.hash)

            x = pos.x - forward.x * (k - 2) * xDistance + offset.x
            y = pos.y + forward.y * (k - 2) * xDistance + offset.y

            local _, z = GetGroundZFor_3dCoord(x, y, pos.z, 0)
            param.npc = CreatePed(6, param.hash, x, y, z, npcHeading, false, false)

            param.pos = vector3(x, y, z)
            param.heading = npcHeading
            TaskPlayAnim(param.npc, lib, anim, 8.0, 8.0, -1, param.flag, 0, false, false, false)
        else

            SetEntityCoords(param.npc, param.pos)
            SetEntityHeading(param.npc, param.heading)
            TaskPlayAnim(param.npc, lib, anim, 8.0, 8.0, -1, param.flag, 0, false, false, false)
        end
    end
end

function npcDeleter()

    for _, params in pairs(peds) do

        DeletePed(params.npc)
        params.npc = nil
    end
end

function stopAnim()

    for _, param in pairs(peds) do

        if param.npc then

            ClearPedTasksImmediately(param.npc)
        end
    end
end

RegisterNUICallback('exit', function(data, cb)

    SetCamActive(cam, false)
    DestroyCam(cam, true)
    RenderScriptCams(false, 1, 1000, 1, 1);
    cam = nil
    SetNuiFocus(false, false)
    npcDeleter()
    cb('ok')
end)
