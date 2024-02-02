class Page {
    SETTINGS_DEFAULTS = {
        'mainWindowStyle': {
            left: '0',
            right: 'unset',
        }
    };

    constructor(database, configManager) {
        this._loadedPage = null;
        this._dragData = {};
        this._configManager = configManager
        this._apiUrl = this._configManager.apiUrl;
        this._pages = {
            lister: new Lister(database, this._configManager),
            playControl: new PlayControl(this._configManager),
            blacklistHandler: new BlacklistHandler(database, this._configManager),
            attachmentHandler: new AttachmentHandler(database, this._configManager),
            codeMonitor: new CodeMonitor(this._configManager)
        }

        database.initialize();
        this._pages.lister.initialize();
        this._pages.attachmentHandler.initialize();
        this._pages.playControl.initialize();
        this._pages.blacklistHandler.initialize();
        this._configManager.setDefaultSettings(this.SETTINGS_DEFAULTS);
        this._settings = this._configManager.getSettings();

        this.setupUI();
        this.setupEventHandlers();
    }

    get lister() {
        return this._pages.lister;
    }

    get playControl() {
        return this._pages.playControl;
    }

    get attachmentHandler() {
        return this._pages.attachmentHandler;
    }

    get blacklistHandler() {
        return this._pages.blacklistHandler;
    }

    set page(page) {
        if (this._loadedPage === page || !this._pages[page]) {
            return;
        }

        if (this._loadedPage && this._pages[this._loadedPage]) {
            this._pages[this._loadedPage].hidePage();
        }

        this._pages[page].showPage();
        this._loadedPage = page;
    }

    get page() {
        return this._loadedPage;
    }

    setupUI() {
        this.$pageWrapper = $("#page_wrapper");
        this.pageHeader = this.$pageWrapper.find("#page_header");
        this.$pageContainer = this.$pageWrapper.find("#page_container");
        this.$navTabsContainer = this.$pageWrapper.find("#nav_tabs_container");
        this.$pageWrapper.css({
            left: this._settings.mainWindowStyle.left,
            right: this._settings.mainWindowStyle.right
        })

        const tabClass = this.numberOrNull(this._settings.mainWindowStyle.left) === null ? 'nav_tabs_left' : 'nav_tabs_right';
        this.$navTabsContainer.attr('class', tabClass);
        this._dragData.navAlignRight = tabClass === 'nav_tabs_right';
    }

    togglePageWrapper() {
        this._dragData.hidePageWrapper ? this.showPageWrapper() : this.hidePageWrapper();
    }

    showPageWrapper() {
        this._dragData.hidePageWrapper = false;
        this.pageHeader.show();
        this.$pageContainer.show();
        this.$pageWrapper.removeClass("null_width");
    }

    hidePageWrapper() {
        this._dragData.hidePageWrapper = true;
        const position = this._dragData.navAlignRight ? {left: 0, right: 'unset'} : {left: 'unset', right: 0};
        this.$pageWrapper.css(position).addClass("null_width");
        this.pageHeader.hide();
        this.$pageContainer.hide();
    }

    setupEventHandlers() {
        this.$navTabsContainer.on("click", ".nav_tab", (e) => {
            switch ($(e.currentTarget).attr('id')) {
                case 'hide_tab':
                    this.togglePageWrapper();
                    break;
                case 'lister_tab':
                    this.page = 'lister';
                    break;
                case 'play_control_tab':
                    this._pages.playControl.toggleWindow();
                    break;
                case 'blacklist_tab':
                    this._pages.blacklistHandler.toggleWindow();
                    break;
                case 'attachment_tab':
                    this.page = 'attachmentHandler';
                    break;
                case 'preset_tab':
                    this._pages.attachmentHandler.toggleWindow();
                    break;
                case 'code_monitor_tab':
                    this._pages.codeMonitor.toggleWindow();
                    break;
                case 'focus_tab':
                    $.post(this._apiUrl.setter, JSON.stringify({subject: 'focus', state: false}))
                    break;
            }
        });

        this.$pageWrapper.draggable({
            handle: '#page_header',
            containment: "parent",
            start: () => {
                this._dragData.halfWrapperWidth = this.$pageWrapper.width() / 2;
                this._dragData.parentWidth = parseFloat(this.$pageWrapper.parent().width());
                this.$pageWrapper.css('right', 'unset');
                this._dragData.navAlignRight = this.$navTabsContainer.hasClass("nav_tabs_right");
            },
            drag: (event, ui) => {
                let alignRight = (ui.position.left + this._dragData.halfWrapperWidth) <= (this._dragData.parentWidth / 2);

                if (alignRight !== this._dragData.navAlignRight) {
                    this.$navTabsContainer.toggleClass("nav_tabs_left nav_tabs_right");
                    this._dragData.navAlignRight = alignRight;
                }
            },
            stop: (event, ui) => {
                let l = 'unset', r = 'unset';
                let left = parseFloat(this.$pageWrapper.css("left"));
                let right = parseFloat(this.$pageWrapper.css("right"));

                //horizontal align
                if ((left + this._dragData.halfWrapperWidth) > (this._dragData.parentWidth / 2)) {
                    r = (100 * right / this._dragData.parentWidth) + "%"
                } else {
                    l = (100 * left / this._dragData.parentWidth) + "%"
                }

                const styles = { left: l, right: r };

                this.$pageWrapper.css(styles);
                this._configManager.updateSetting('mainWindowStyle', styles);
            }
        });
    }

    numberOrNull(value) {
        value = parseInt(value);
        return isNaN(value) ? null : value;
    }
}