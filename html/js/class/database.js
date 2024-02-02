class DataBase {
    constructor(animationList, database, configManager) {
        this._animRow = [];
        this._filteredAnimList = [];
        this._props = database.props;
        this._bones = database.bones;
        this._configManager = configManager;
        this._categories = database.categories;
        this._presets = this.createMap(database.presets);
        this._rawAnimList = this.insertAnimCountIntoAnimDB(animationList);
    }

    initialize() {
        this._settings = this._configManager.getSettings();
        this._gameBuild = parseInt(this._configManager.gameBuild) || 0;
        this._settings.filterByGameBuild ? this.filterByGameBuild() : this.filterByNonEmptyAnimNames();
    }

    createMap(data) {
        const result = new Map();
        if (typeof data === 'object' && data !== null && Array.isArray(data)) {
            data.forEach((item) => {
                if (typeof item === 'object' && item !== null && 'id' in item) {
                    result.set(item.id, item);
                }
            });
        }
        return result;
    }

    // Animation List pattern
    rowToObject() {
        const [totalAnimations, buildNumber, animDict, ...names] = this._animRow;
        return {totalAnimations, buildNumber, animDict, names};
    }

    rowToArray(excludeNames = false) {
        const [totalAnimations, buildNumber, animDict, ...names] = this._animRow;
        return excludeNames ? [totalAnimations, buildNumber, animDict] : [totalAnimations, buildNumber, animDict, ...names];
    }
    // Animation List pattern end

    get dictAndNameList() {
        return {dictionaries: this._dictionaries, names: this._names};
    }

    toggleGameBuildFilter(buildFilterState) {
        if (this._settings.filterByGameBuild !== buildFilterState) {
            buildFilterState ? this.filterByGameBuild() : this.filterByNonEmptyAnimNames();
            this._configManager.updateSettingLocalStorage('settings', 'filterByGameBuild', buildFilterState);
            this._settings.filterByGameBuild = buildFilterState
        }
    }

    filterByNonEmptyAnimNames() {
        this._data = this._rawAnimList ? this._rawAnimList.filter(e => e.length > 2) : [];
        this.applyBlacklistFilter();
    }

    filterByGameBuild() {
        this._data = this._rawAnimList ? this._rawAnimList.filter(e => e.length > 2 && e[1] !== 'none' && parseInt(e[1]) <= this._gameBuild) : [];
        this.applyBlacklistFilter();
    }

    insertAnimCountIntoAnimDB(animations) {
        return animations.map(raw => [(raw.length - 2).toString(), ...raw]);
    };

    resetSearch() {
        this.createDictAndNameList(this._filteredAnimList);
    }

    isBlacklisted(name) {
        return this._settings.blacklist.some(word => name.includes(word));
    }

    applyBlacklistFilter() {
        if (!this._settings.isBlacklistEnabled || this._settings.blacklist.length === 0) {
            this._filteredAnimList = [...this._data];
        } else {
            this._filteredAnimList = this._data.reduce((acc, animation) => {
                this._animRow = animation;
                const animObj = this.rowToObject();

                if (!this.isBlacklisted(animObj.animDict)) {
                    const filteredNames = animObj.names.filter(name => !this.isBlacklisted(name));

                    if (filteredNames.length > 0) {
                        acc.push([...this.rowToArray(true), ...filteredNames]);
                    }
                }
                return acc;
            }, []);
        }
        this.createDictAndNameList(this._filteredAnimList);
    }

    // blacklistHandler handlers
    get blacklist() {
        return this._settings.blacklist;
    }

    set blacklist(words) {
        this._settings.blacklist = words;
        this.applyBlacklistFilter();
    }

    toggleBlacklist(isEnabled) {
        this._settings.isBlacklistEnabled = isEnabled;
        this.applyBlacklistFilter();
    }

    search(query) {
        if (!query) return;
        const filteredAnimations = this._filteredAnimList.reduce((acc, raw) => {
            this._animRow = raw;
            const animObj = this.rowToObject();

            if (animObj.animDict.includes(query)) {
                acc.push(raw);
            } else {
                const filteredNames = animObj.names.filter(item => item.includes(query));
                if (filteredNames.length > 0) {
                    acc.push([...this.rowToArray(true), ...filteredNames]);
                }
            }
            return acc;
        }, []);

        this.createDictAndNameList(filteredAnimations)
        return this.dictAndNameList;
    }

    createDictAndNameList(animations) {
        let animationIndex = 0;
        this._dictionaries = [];
        this._names = [];

        animations.forEach(row => {
            this._animRow = row
            const animObj = this.rowToObject();
            const displayedAnimations = animObj.names.length;
            this._names.push(...animObj.names.map((name) => [animationIndex, name]));
            this._dictionaries[animationIndex] = [...this.rowToArray(true), displayedAnimations];
            animationIndex++;
        });
    }

    get gameBuild() {
        return this._gameBuild;
    }

    /* CONFIG MANAGER */
    get props() {
        return this._props;
    }

    get bones() {
        return this._bones;
    }

    get categories() {
        return this._categories;
    }

    get presetsMap() {
        return this._presets;
    }

    get presetsArray() {
        return [...this._presets.values()];
    }

    addProp(prop) {
        this._props.push(prop);
    }

    addPreset(id, preset) {
        this._presets.set(id, preset);
    }

    removePreset(id) {
        this._presets.delete(id);
    }

    updatePreset(id, updatedPreset) {
        if (this._presets.has(id)) {
            this._presets.set(id, updatedPreset);
        } else {
            console.error(`Preset with id ${id} not found.`);
        }
    }
}