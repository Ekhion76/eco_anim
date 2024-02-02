class BlacklistHandler {
    SETTINGS_DEFAULTS = {
        'isBlacklistEnabled': true,
        'blacklist': [],
        'blacklistWindowStyle': {
            top: '30rem',
            left: '85rem',
            width: '30rem',
            height: '14rem',
            display: 'block'
        }
    };

    constructor(database, configManager) {
        this._database = database;
        this._configManager = configManager;
        this._configManager.setDefaultSettings(this.SETTINGS_DEFAULTS);
    }

    initialize() {
        this._settings = this._configManager.getSettings();
        this._blacklist = this._settings.blacklist;
        this.setupUI();
        this.setupEventHandlers();
        this.resetState();
    }

    setupUI() {
        this._window = new Window({
            name: 'blacklist',
            title: 'Animation blacklist:',
            isDraggable: true,
            isResizable: true,
            ...this._settings.blacklistWindowStyle
        })

        this._window.setContent(renderBlacklistFrame());
        this.$window = this._window.getWindow();
        this.$blacklistInput = this.$window.find("#blacklist_input");
        this.$blacklistContent = this.$window.find("#blacklist_content");
        this.$addBlacklistItemBtn = this.$window.find("#add_blacklist_item_btn");
        this.$clearAllBlacklistItemBtn = this.$window.find("#clear_all_blacklist_item_btn");
    }

    toggleWindow(state) {
        state = state === undefined ? this.$window.css('display') !== 'block' : state;
        this._window.toggleWindow(state);
    }

    setupEventHandlers() {
        this.$addBlacklistItemBtn.on("click", (e) => {
            e.preventDefault();
            let wordFragment = this.$blacklistInput.val().trim().toLowerCase();
            if (!wordFragment) return;
            if (this.addToBlacklist(wordFragment)) {
                this.renderItem(wordFragment);
                this._configManager.updateSetting('blacklist', this._blacklist);
                this._database.blacklist = this._blacklist;
                this.$blacklistInput.val('');
                $(window).trigger('blacklistChanged');
            }
        });

        this.$clearAllBlacklistItemBtn.on("click", (e) => {
            e.preventDefault();
            if (this._blacklist.length === 0) return;
            this._blacklist = [];
            this._configManager.updateSetting('blacklist', this._blacklist);
            this._database.blacklist = [];
            this.$blacklistContent.empty();
            $(window).trigger('blacklistChanged');
        });

        this.$blacklistContent.on("click", ".bl_del", (e) => {
            let target = $(e.currentTarget);
            let parentSpan = target.closest('.blacklist_item');
            if (parentSpan.length) {
                let wordFragment = parentSpan.find('.word_fragment').text();
                if (this.removeFromBlacklist(wordFragment)) {
                    parentSpan.remove();
                    this._configManager.updateSetting('blacklist', this._blacklist);
                    this._database.blacklist = this._blacklist;
                    $(window).trigger('blacklistChanged');
                }
            }
        });

        this.$window.on('windowOpenState', (e, style) => {
            this._configManager.updateSetting('blacklistWindowStyle', style);
        });

        this.$window.on('resize', (e, style) => {
            this._configManager.updateSetting('blacklistWindowStyle', style);
        });

        this.$window.on('move', (e, style) => {
            this._configManager.updateSetting('blacklistWindowStyle', style);
        });
    }

    resetState() {
        this._settings = this._configManager.getSettings();
        this._blacklist = this._settings.blacklist;
        this._blacklist.map((wordFragment) => {
            this.renderItem(wordFragment);
        });
    }

    renderItem(wordFragment) {
        this.$blacklistContent.append(renderBlacklistItem(wordFragment));
    }

    addToBlacklist(word) {
        const index = this._blacklist.findIndex(item => item === word);
        if (index === -1) {
            this._blacklist.push(word);
            return true;
        }
        return false;
    }

    removeFromBlacklist(word) {
        const index = this._blacklist.findIndex(item => item === word);
        if (index !== -1) {
            this._blacklist.splice(index, 1);
            return true;
        }
        return false;
    }
}