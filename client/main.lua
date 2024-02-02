local nuiReady, enable, controlPed
local controller = Controller:new()
local serverRequests = {}
local cbId = 0

RegisterCommand('anim', function()
    if not nuiReady then
        print('Waiting for NUI ready...')
        return
    end

    enable = not enable

    if enable then
        DisableIdleCamera(true)
        controller:initPeds()

        while not controller.isReady do
            Wait(250)
        end

        SetNuiFocus(true, true)
        SendNUIMessage({ subject = 'OPEN' })
        CreateThread(sendProgress)
    else
        exit()
    end
end)

function sendProgress()
    controlPed = controller.pedEntities[1]
    local isPlayingAnim, state, lastState
    while enable do
        Wait(250)

        if controlPed.animationController and controlPed.animationController.state ~= 'stopped' then

            isPlayingAnim = controlPed.animationController:IsPlayingAnim()
            state = controlPed.animationController.state

            if isPlayingAnim and state == 'playing' then
                SendNUIMessage({ subject = 'PROGRESS', value = round(controlPed.animationController:getCurrentTime(), 2) })
            end

            if state ~= lastState then
                SendNUIMessage({ subject = 'ANIM_STATE', value = state })
                lastState = state
            end
        end
    end
end

-- NUI CALLBACKS
RegisterNUICallback('set', function(data, cb)
    local subject = data.subject

    if subject == 'focus' then
        SetNuiFocus(data.state, data.state)
    elseif subject == 'removeAndResetProp' then
        controller:removeAndResetProp()
    elseif subject == 'attachPropToBone' then
        controller:attachPropToBone(data.boneId, data.model, data.adjustment)
    elseif subject == 'attachmentAdjust' then
        controller:attachEntityToEntity(data)
    elseif subject == 'switchBone' then
        controller:switchBone(data.boneId)
    elseif subject == 'switchProp' then
        controller:switchProp(data.model)
    elseif subject == 'setAnimCurrentTime' then
        controller:setAnimCurrentTime(data.value)
    elseif subject == 'resume' then
        controller:resumeAnim(data.value)
    elseif subject == 'pause' then
        controller:pause()
    elseif subject == 'speed' then
        controller:setAnimSpeed(data.value)
    end

    local animState = controlPed.animationController.state
    cb({ animState = animState })
end)

RegisterNUICallback('changeDatabase', function(data, cb)
    local subject = data.subject
    TriggerServerEvent('eco_anim:' .. subject, data.value)
    cb('ok')
end)

RegisterNUICallback('animLoad', function(data, cb)
    controller:stopAnim()
    controller:setPedDefaultPosition()

    if not controller.animationControllerClass:setDict(data.dict) or not controller.animationControllerClass:setName(data.name) then
        return cb({ loadAnim = false, dict = data.dict, name = data.name, playTime = 0 })
    end

    controller:loadAnim(data)
    cb({ loadAnim = true, dict = data.dict, name = data.name, playTime = controller.animationControllerClass:getAnimDuration() })
end)

RegisterNUICallback('app', function(data, cb)
    local subject = data.subject
    if subject == 'ready' then
        triggerServerCallback('eco_anim:getDB', function(db)
            nuiReady = true
            cb({
                subject = 'INIT',
                db = db,
                locale = locales[Config.locale],
                config = {
                    gameBuild = GetGameBuildNumber(),
                    playerId = GetPlayerServerId(PlayerId())
                }
            })
        end)
    elseif subject == 'exit' then
        exit()
        cb('ok')
    end
end)

RegisterNetEvent('eco_anim:databaseChanged', function(db, action, data, referrerId)
    SendNUIMessage({ subject = 'DB_CHANGED', db = db, action = action, data = data, referrerId = referrerId })
end)

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        exit()
    end
end)

RegisterCommand('set_focus_on', function()
    if enable then
        SetNuiFocus(true, true)
    end
end)

RegisterKeyMapping('set_focus_on', 'Eco Anim Focus', 'keyboard', 'E')

function exit()
    enable = false
    DisableIdleCamera(false)
    SendNUIMessage({ subject = 'CLOSE' })
    SetNuiFocus(false, false)
    controller:deleteAllProp()
    controller:deleteAllPeds()
end

function round(num, numDecimalPlaces)
    if not numDecimalPlaces then
        return math.floor(num + 0.5)
    end
    local mul = 10 ^ (numDecimalPlaces or 0)
    return math.floor(num * mul + 0.5) / mul
end

function triggerServerCallback(name, cb, ...)
    serverRequests[cbId] = cb
    TriggerServerEvent('eco_anim:triggerServerCallback', name, cbId, ...)
    cbId = cbId + 1
end

RegisterNetEvent('eco_anim:serverCallback', function(_cbId, ...)
    serverRequests[_cbId](...)
    serverRequests[_cbId] = nil
end)