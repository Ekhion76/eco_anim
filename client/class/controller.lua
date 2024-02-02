Controller = {}

function Controller:new()
    return setmetatable({
        peds = Config.peds,
        pedEntities = {},
        animationControllerClass = AnimationController,
        propControllerClass = PropController,
        isReady = false
    }, { __index = self })
end

function Controller:debugPrint(key, ...)
    print('^4' .. 'Controller' .. ': ^3' .. key, json.encode({ ... }, { indent = 1 }))
end

function Controller:getViewer()
    local ped = PlayerPedId()
    return {
        ped = ped,
        forwardVector = GetEntityForwardVector(ped),
        pos = GetEntityCoords(ped),
        heading = GetEntityHeading(ped)
    }
end

function Controller:initPeds()
    local viewer = self:getViewer()
    local xDistance = Config.pedSpacing
    local offset = viewer.forwardVector * Config.pedDistance
    local forward = {
        x = math.sin(math.rad(viewer.heading + 90.0)),
        y = math.cos(math.rad(viewer.heading + 90.0))
    }

    for k, v in pairs(self.peds) do
        if self:modelLoader(v.model) then
            local x = viewer.pos.x - forward.x * (k - 2) * xDistance + offset.x
            local y = viewer.pos.y + forward.y * (k - 2) * xDistance + offset.y
            local _, z = GetGroundZFor_3dCoord(x, y, viewer.pos.z, 0)
            local ped = PedController:new(CreatePed(6, v.model, x, y, z, viewer.heading - 180, false, false))
            SetEntityInvincible(ped.entity, true)
            SetPedDefaultComponentVariation(ped.entity)
            SetBlockingOfNonTemporaryEvents(ped.entity, true)
            SetPedCanRagdollFromPlayerImpact(ped.entity, false)
            SetEntityProofs(ped.entity, true, true, true, true, true, true, true, true)
            table.insert(self.pedEntities, ped)
            ped.animationController:setFlag(v.flag)
        end
    end

    self.isReady = true
end

function Controller:setPedDefaultPosition()
    for _, v in pairs(self.pedEntities) do
        v:setDefaultPosition()
    end
end

function Controller:deleteAllPeds()
    for _, v in pairs(self.pedEntities) do
        v:delete()
    end
    self.pedEntities = {}
    self.isReady = false
end

-- ANIMATIONS
function Controller:loadAnim(data)
    for _, v in pairs(self.pedEntities) do
        v.animationController:load(data)
    end
end

function Controller:resumeAnim(data)
    for _, v in pairs(self.pedEntities) do
        v.animationController:resume(data)
    end
end

function Controller:pause()
    for _, v in pairs(self.pedEntities) do
        v.animationController:pause()
    end
end

function Controller:stopAnim()
    for _, v in pairs(self.pedEntities) do
        v.animationController:stopTask()
    end
end

function Controller:setAnimCurrentTime(time)
    for _, v in pairs(self.pedEntities) do
        v.animationController:setCurrentTime(time)
    end
end

function Controller:setAnimSpeed(multiplier)
    for _, v in pairs(self.pedEntities) do
        v.animationController:setSpeed(multiplier)
    end
end

-- PROPS
function Controller:attachPropToBone(boneId, model, adjustment)
    for _, v in pairs(self.pedEntities) do
        v.propController:attachToBone(boneId, model, adjustment)
    end
end

function Controller:switchBone(boneId)
    for _, v in pairs(self.pedEntities) do
        v.propController:switchBone(boneId)
    end
end

function Controller:attachEntityToEntity(attachmentParameters)
    for _, v in pairs(self.pedEntities) do
        v.propController:attachEntityToEntity(attachmentParameters)
    end
end

function Controller:detachProp()
    for _, v in pairs(self.pedEntities) do
        v.propController:detach()
    end
end

function Controller:deleteAllProp()
    for _, v in pairs(self.pedEntities) do
        v.propController:delete()
    end
end

function Controller:removeAndResetProp()
    for _, v in pairs(self.pedEntities) do
        v.propController:removeAndReset()
    end
end

function Controller:switchProp(model)
    for _, v in pairs(self.pedEntities) do
        v.propController:switchProp(model)
    end
end

function Controller:modelLoader(model)
    if not model or not IsModelValid(model) then
        print('Model it does not exist!', model)
        return false
    end
    if not HasModelLoaded(model) then
        RequestModel(model)
        Wait(100)
        while not HasModelLoaded(model) do
            Wait(10)
        end
    end
    return true
end
--[[
for methodName, methodFunc in pairs(Controller) do
    if type(methodFunc) == "function" and methodName ~= "init" and methodName ~= "debugPrint" then
        Controller[methodName] = function(self, ...)
            self:debugPrint(methodName, ...)
            return methodFunc(self, ...)
        end
    end
end
]]
