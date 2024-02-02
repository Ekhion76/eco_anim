class LocalStorageManager {
    constructor(tables) {
        this._validTableNames = new Set(tables);
        this._validTableNames.forEach(table => {
            const data = this.getLocalStorage(table);
            if (!data) {
                this.setLocalStorage(table, {});
            }
        });
    }

    isValidTableName(tableName) {
        if (!this._validTableNames.has(tableName)) {
            throw new Error(`Not exists table: ${tableName}`);
        }
        return true;
    }

    addDefaultValues(tableName, keyValues) {
        if (!this.isValidTableName(tableName)) return false;
        const tableValues = this.getLocalStorage(tableName);
        if (!tableValues) return false;

        let addValues = false;

        for (const [key, value] of Object.entries(keyValues)) {
            if (value !== undefined && typeof key === 'string' && key.trim() !== '' && !tableValues.hasOwnProperty(key)) {
                addValues = true;
                tableValues[key] = value;
            }
        }

        if (addValues) {
            this.setLocalStorage(tableName, tableValues);
        }
        return true;
    }


    getLocalStorage(tableName) {
        if (!this.isValidTableName(tableName)) return false;
        try {
            const jsonData = localStorage.getItem(tableName);
            return jsonData ? JSON.parse(jsonData) : null;
        } catch (e) {
            throw new Error(`Not exists table: ${tableName}`);
        }
    }

    setLocalStorage(tableName, value) {
        if (!this.isValidTableName(tableName)) return false;
        localStorage.setItem(tableName, JSON.stringify(value));
        return true;
    }

    updateLocalStorage(tableName, key, value) {
        if (!this.isValidTableName(tableName)) return false;
        let storage = this.getLocalStorage(tableName);
        if (storage) {
            storage[key] = value;
            this.setLocalStorage(tableName, storage);
            return true;
        }
        return false;
    }
}

