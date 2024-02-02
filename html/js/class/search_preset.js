class SearchPreset {
    constructor() {
        this.resetState();
    }

    set data(data) {
        this._data = data;
    }

    resetState() {
        this._categoryId = null;
        this._label = null;
        this._anim = null;
        this._dict = null;
        this._prop = null;
    }

    set categoryId(categoryId) {
        this._categoryId = this.numberOrNull(categoryId);
    }

    set label(searchTerm) {
        this._label = this.trimSearchTerm(searchTerm);
    }
    
    set anim(searchTerm) {
        this._anim = this.trimSearchTerm(searchTerm);
    }

    set dict(searchTerm) {
        this._dict = this.trimSearchTerm(searchTerm);
    }

    set prop(searchTerm) {
        this._prop = this.trimSearchTerm(searchTerm);
    }

    get label() {
        return this._label;
    }

    trimSearchTerm(searchTerm) {
        if (searchTerm !== null && searchTerm !== undefined) {
            if (typeof searchTerm.toString === 'function') {
                searchTerm = searchTerm.toString().trim();
                return searchTerm === '' ? null : searchTerm.toLowerCase();
            }
        }
        return null;
    }

    search() {
        return this._data.filter(item => {
            if(this._categoryId !== null && this.numberOrNull(item.categoryId) !== this._categoryId) return false;
            if (this._label !== null) {
                const animDictAndNameToSearch = (
                    (item.label || '') + ' ' +
                    (item.animation?.dict || '') + ' ' +
                    (item.animation?.name || '')
                ).toLowerCase();

                if (!animDictAndNameToSearch.includes(this._label)) return false;
            }

            //if(this._label !== null && (!item.label || !item.label.toLowerCase().includes(this._label))) return false;
            //if(this._anim !== null && (!item.animation?.name || !item.animation.name.toLowerCase().includes(this._anim))) return false;
            //if(this._dict !== null && (!item.animation?.dict || !item.animation.dict.toLowerCase().includes(this._dict))) return false;
            if(this._prop !== null && (!item.prop?.[0]?.name || !item.prop[0].name.toLowerCase().includes(this._prop))) return false;
            return true;
        })
    }

    numberOrNull(value) {
        value = parseInt(value);
        return isNaN(value) ? null : value;
    }
}