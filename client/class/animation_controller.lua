AnimationController = {}

function AnimationController:new(entity)
    local o = setmetatable({}, { __index = self })
    o.entity = entity
    o.flag = 1
    o.dict = nil
    o.name = nil
    o.duration = -1
    o.startTime = 0.0
    o.exitSpeed = 8.0
    o.enterSpeed = 8.0
    o.state = 'stopped'
    o.playStarting = false
    return o
end

function AnimationController:debugPrint(key, ...)
    print('^4' .. tostring(self.state) .. ': ^3' .. key, json.encode({ ... }, { indent = 1 }))
end

function AnimationController:isSetAnimationData()
    return self.entity and
            self.dict and type(self.dict) == "string" and self.dict ~= "" and
            self.name and type(self.name) == "string" and self.name ~= ""
end

function AnimationController:play()
    if self:isSetAnimationData() and not self.playStarting then
        self.playStarting = true
        TaskPlayAnim(
                self.entity,
                self.dict,
                self.name,
                self.enterSpeed,
                self.exitSpeed,
                self.duration,
                self.flag,
                self.startTime,
                false, false, false
        )
        local try = 0
        while not self:IsPlayingAnim() do
            try = try + 1
            if try >= 20 then
                print(('The animation cannot be played. (%s)'):format(self.name))
                break
            end
            Wait(0)
        end

        if self:IsPlayingAnim() then
            self.state = 'playing'
        end
        self.playStarting = false
    end
end

function AnimationController:resume(speed)
    if self:isSetAnimationData() then
        self.state = 'playing'
        self:setSpeed(speed)
    end
end

function AnimationController:pause()
    if self:isSetAnimationData() and self:IsPlayingAnim() and self.state == 'playing' then
        self.state = 'paused'
        SetEntityAnimSpeed(self.entity, self.dict, self.name, 0.0)
    end
end

function AnimationController:taskPause(time)
    time = tonumber(time) or 0
    TaskPause(self.entity, time) -- time in milliseconds
end

function AnimationController:stop()
    self.state = 'stopped'
    if self.entity then
        StopAnimPlayback(self.entity)
    end
end

function AnimationController:stopTask()
    self.state = 'stopped'
    if self:isSetAnimationData() then
        StopAnimTask(self.entity, self.dict, self.name, self.exitSpeed)
    end
end

function AnimationController:clearPedTasks()
    self.state = 'stopped'
    ClearPedTasks(self.entity)
end

function AnimationController:setDict(dict)
    if not dict or not DoesAnimDictExist(dict) then
        return false
    end

    if not HasAnimDictLoaded(dict) then
        RequestAnimDict(dict)
        while not HasAnimDictLoaded(dict) do
            Wait(0)
        end
    end
    self.dict = dict
    return true
end

function AnimationController:setName(name)
    if not name then
        return false
    end
    self.name = name
    return true
end

function AnimationController:setEnterSpeed(speed)
    if speed then
        speed = tonumber(speed) or 8.0
        self.enterSpeed = speed + 0.0
    end
end

function AnimationController:setExitSpeed(speed)
    if speed then
        speed = tonumber(speed) or 8.0
        self.exitSpeed = speed + 0.0
    end
end

function AnimationController:setCurrentTime(time)
    time = tonumber(time) or 0

    if not self:isSetAnimationData() then
        return
    end

    if not self:IsPlayingAnim() then
        self:play()
    end

    if self.state ~= 'paused' then
        self:pause()
    end
    SetEntityAnimCurrentTime(self.entity, self.dict, self.name, time + 0.0)
end

function AnimationController:setStartTime(time)
    time = tonumber(time) or 0
    self.startTime = time + 0.0
end

function AnimationController:setSpeed(multiplier)
    if multiplier then
        multiplier = tonumber(multiplier) or 1.0
        if self:IsPlayingAnim() and self.state == 'playing' then
            SetEntityAnimSpeed(self.entity, self.dict, self.name, multiplier + 0.0)
            if multiplier <= 0 then
                self.state = 'paused'
            end
        end
    end
end

function AnimationController:setFlag(flag)
    if flag then
        flag = tonumber(flag) or 1
        self.flag = flag
    end
end

function AnimationController:setDuration(ms)
    if ms then
        ms = tonumber(ms) or -1
        self.duration = ms
    end
end

function AnimationController:getAnimDuration()
    return GetAnimDuration(self.dict, self.name)
end

function AnimationController:getTotalTime()
    return GetEntityAnimTotalTime(self.entity, self.dict, self.name) -- playtime in milliseconds
end

function AnimationController:getCurrentTime()
    return GetEntityAnimCurrentTime(self.entity, self.dict, self.name)
end

function AnimationController:IsPlayingAnim()
    local isPlayingAnim = IsEntityPlayingAnim(self.entity, self.dict, self.name, 3)
    self.state = isPlayingAnim and self.state or 'stopped'
    return isPlayingAnim
end

function AnimationController:load(data)
    self:setDict(data.dict)
    self:setName(data.name)
    self:setEnterSpeed(data.enterSpeed)
    self:setExitSpeed(data.exitSpeed)
    self:setDuration(data.duration)
    self:setFlag(data.flag)
    self:setStartTime(data.startTime)
    self:play()

    if data.speedMultiplier then
        self:setSpeed(data.speedMultiplier)
    end

    if tonumber(data.stopPosition) and data.stopPosition > -1 then
        self:setCurrentTime(data.stopPosition)
    end
end

--[[
for methodName, methodFunc in pairs(AnimationController) do
    if type(methodFunc) == "function" and methodName ~= "init" and methodName ~= "debugPrint" then
        AnimationController[methodName] = function(self, ...)
            self:debugPrint(methodName, ...)
            return methodFunc(self, ...)
        end
    end
end
]]