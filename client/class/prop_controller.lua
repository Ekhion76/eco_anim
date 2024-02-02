PropController = {}

function PropController:new(entity)
    local o = setmetatable({}, { __index = self })
    o.entity = entity
    o.boneIndex = -1
    o.prop = nil
    o.propBasePosition = GetEntityCoords(o.entity) + GetEntityForwardVector(o.entity)
    o.offset = { x = 0.0, y = 0.0, z = 0.0 }
    o.rot = { x = 0.0, y = 0.0, z = 0.0 }
    return o
end

function PropController:debugPrint(key, ...)
    print('^4' .. 'Prop' .. ': ^3' .. key, json.encode({ ... }, { indent = 1 }))
end

function PropController:switchProp(model)
    self:delete()
    if not model or model == '' then -- Switch the non model mode
        return
    end

    local prop = self:create(model)
    if prop then
        self.prop = prop
        if self.boneIndex and self.boneIndex ~= -1 then
            self:attachEntityToEntity()
        end
    end
end

function PropController:create(model)
    model = self:requestModel(model)
    if model then
        return CreateObject(model, self.propBasePosition, false, false)
    end
    return false
end

function PropController:attachToBone(boneId, model, adjustment)
    self:delete()
    self.prop = self:create(model)

    if not self.prop then
        print('failed to create the object')
        return false
    end

    self.boneIndex = -1
    boneId = tonumber(boneId)
    if boneId then
        local boneIndex = GetPedBoneIndex(self.entity, tonumber(boneId))
        if boneIndex == -1 then
            print('no boneIndex found for this boneId')
            return false
        end
        self.boneIndex = boneIndex
    end

    self:attachEntityToEntity(adjustment)
    SetModelAsNoLongerNeeded(model)
end

function PropController:switchBone(boneId)
    boneId = tonumber(boneId)
    if not boneId or boneId == -1 then
        self.boneIndex = -1
        self:detachAndResetToBasePosition()
        return
    end

    local boneIndex = GetPedBoneIndex(self.entity, boneId)
    if boneIndex == -1 then
        print('no boneIndex found for this boneId')
        return false
    end
    self.boneIndex = boneIndex
    self:attachEntityToEntity()
end

function PropController:detachAndResetToBasePosition()
    if not self.prop or not DoesEntityExist(self.prop) then
        return
    end
    self:detach()
    SetEntityCoords(self.prop, self.propBasePosition)
end

function PropController:attachEntityToEntity(attachmentParameters)

    self:setTransformParams(attachmentParameters)

    if not self.prop or not DoesEntityExist(self.prop) then
        return
    end

    if not tonumber(self.boneIndex) or self.boneIndex == -1 then
        return
    end

    AttachEntityToEntity(self.prop, self.entity, self.boneIndex,
            self.offset.x, self.offset.y, self.offset.z,
            self.rot.x, self.rot.y, self.rot.z,
            false, false, false, false, 2, true)
end

function PropController:setTransformParams(attachmentParameters)
    attachmentParameters = attachmentParameters or {}
    self.rot.x = (tonumber(attachmentParameters.pitch) or self.rot.x) + 0.0
    self.rot.y = (tonumber(attachmentParameters.roll) or self.rot.y) + 0.0
    self.rot.z = (tonumber(attachmentParameters.yaw) or self.rot.z) + 0.0
    self.offset.x = (tonumber(attachmentParameters.offsetX) or self.offset.x) + 0.0
    self.offset.y = (tonumber(attachmentParameters.offsetY) or self.offset.y) + 0.0
    self.offset.z = (tonumber(attachmentParameters.offsetZ) or self.offset.z) + 0.0
end

function PropController:detach()
    if self.prop and DoesEntityExist(self.prop) then
        DetachEntity(self.prop, true, true)
    end
end

function PropController:delete()
    if self.prop and DoesEntityExist(self.prop) then
        DeleteEntity(self.prop)
    end
    self.prop = nil
end

function PropController:removeAndReset()
    self:delete()
    self.boneIndex = -1
    self.offset = { x = 0.0, y = 0.0, z = 0.0 }
    self.rot = { x = 0.0, y = 0.0, z = 0.0 }
end

function PropController:requestModel(model)
    model = self:validateModel(model)
    if not model then
        return
    end

    if HasModelLoaded(model) then
        return model
    end

    RequestModel(model)
    while not HasModelLoaded(model) do
        Wait(50)
    end

    return model
end

function PropController:validateModel(model)
    if model and IsModelValid(model) then
        return tonumber(model) or joaat(model)
    end
    return error(("Invalid model: '%s'"):format(model))
end
--[[
for methodName, methodFunc in pairs(PropController) do
    if type(methodFunc) == "function" and methodName ~= "init" and methodName ~= "debugPrint" then
        PropController[methodName] = function(self, ...)
            self:debugPrint(methodName, ...)
            return methodFunc(self, ...)
        end
    end
end]]
