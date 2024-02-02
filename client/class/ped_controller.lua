PedController = {}

function PedController:new(entity)
    local rawCoords = GetEntityCoords(entity)
    local _, z = GetGroundZFor_3dCoord(rawCoords.x, rawCoords.y, rawCoords.z + 5, 0)
    local o = setmetatable({}, { __index = self })
    o.entity = entity
    o.animationController = AnimationController:new(entity)
    o.propController = PropController:new(entity)
    o.pos = vec(rawCoords.x, rawCoords.y, z)
    o.heading = GetEntityHeading(entity)
    return o
end

function PedController:setDefaultPosition()
    if DoesEntityExist(self.entity) then
        SetEntityCoords(self.entity, self.pos)
        SetEntityHeading(self.entity, self.heading)
    end
end

function PedController:delete()
    if DoesEntityExist(self.entity) then
        DeletePed(self.entity)
    end
end
