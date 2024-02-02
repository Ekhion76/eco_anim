class ConfigurationManager {
    STORAGE_TABLES = {
        settings: 'settings'
    }

    constructor() {
        this._localStorageManager = new LocalStorageManager(Object.values(this.STORAGE_TABLES));
    }

    init(data) {
        this._data = data;
    }

    getSettings() {
        return this._localStorageManager.getLocalStorage(this.STORAGE_TABLES.settings);
    }

    setDefaultSettings(settings) {
        return this._localStorageManager.addDefaultValues(this.STORAGE_TABLES.settings, settings);
    }

    updateSetting(key, value) {
        return this._localStorageManager.updateLocalStorage(this.STORAGE_TABLES.settings, key, value);
    }

    get config() {
        return this._data;
    }

    get apiUrl() {
        return this._data.apiUrl;
    }

    get gameBuild() {
        return this._data.gameBuild;
    }

    get playerId() {
        return this._data.playerId;
    }
}

