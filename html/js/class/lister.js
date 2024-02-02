class Lister {
    SETTINGS_DEFAULTS = {
        'filterByGameBuild': false,
    };

    constructor(database, configManager) {
        this._names = [];
        this._maxPage = 0;
        this.$resultItems = [];
        this._dictionaries = [];
        this._loadedItemId = null;
        this._floodProtect = false;
        this._itemsPerPage = 1000;
        this._floodProtectTime = 1000;
        this._lastLoadTime = new Date().getTime();

        this._database = database;
        this._configManager = configManager;
        this._configManager.setDefaultSettings(this.SETTINGS_DEFAULTS);
        this.setupUI();
    }

    initialize() {
        this._settings = this._configManager.getSettings();
        this.setupEventHandlers();
        this.setupSliders();
        this.resetState();
    }

    setupUI() {
        this.$parent = $("#page_container");
        this.$parent.append($(renderListFrame()));
        this.$selfWrapper = this.$parent.find('#anim_list_wrapper');
        this.$pagerSlider = this.$parent.find("#pager_slider");
        this.$hits = this.$parent.find("#hits");
        this.$next = this.$parent.find("#next");
        this.$prev = this.$parent.find("#prev");
        this.$pages = this.$parent.find("#pages");
        this.$reset_btn = this.$parent.find('#reset_btn');
        this.$search_btn = this.$parent.find('#search_btn');
        this.$form = this.$parent.find("form");
        this.queryField = this.$parent.find("#q");
        this.$selectedDict = this.$parent.find('#selected_dict');
        this.$selectedName = this.$parent.find('#selected_name');
        this.$totalTime = this.$parent.find('.total_time');
        this.$listContent = this.$parent.find('#list_content');
        this.$gameBuildValue = this.$parent.find('#gameBuildValue');
        this.$gameBuildFilterToggleButton = this.$parent.find('.game_build_filter_toggle_button');

        this.$gameBuildValue.html(this._configManager.gameBuild);
    }

    hidePage() {
        this.$selfWrapper.hide();
    }

    showPage() {
        this.$selfWrapper.show();
    }

    setupEventHandlers() {
        this.$listContent.on("click", "li", (e) => {
            let target = $(e.currentTarget);
            this.elementHighlighting(target);
            this.loadSelectedItem(target);
        });

        this.$prev.on("click", () => {
            let value = this.$pagerSlider.slider("option", "value");
            if (value > 0) {
                this.$pagerSlider.slider("option", "value", value - 1);
            }
        });

        this.$next.on("click", () => {
            let value = this.$pagerSlider.slider("option", "value");
            if (value < this._maxPage) {
                this.$pagerSlider.slider("option", "value", value + 1);
            }
        });

        /* SEARCH */
        this.$search_btn.on("click", (e) => {
            e.preventDefault();
            let q = this.queryField.val().trim().toLowerCase();
            if (!q) return;
            ({dictionaries: this._dictionaries, names: this._names} = this._database.search(q));
            this.updateDisplayedList();
        });

        this.$reset_btn.on("click", (e) => {
            e.preventDefault();
            this.queryField.val('');
            this._database.resetSearch();
            ({dictionaries: this._dictionaries, names: this._names} = this._database.dictAndNameList);
            this.updateDisplayedList();
        });

        $(document).on("keydown", (e) => {
            const up = e.which === 38;
            const down = e.which === 40;
            if (!up && !down) return;
            e.preventDefault();
            let $activeItem = this.$resultItems.filter(".active");
            if ($activeItem.length > 0) {
                let newItem = this.getSiblingItem($activeItem, up);
                if (newItem.length > 0) {
                    this.scrollToCenter(newItem);
                    this.elementHighlighting(newItem);
                }
            } else {
                this.elementHighlighting(this.$resultItems.first());
            }
        });

        $(document).on("keyup", (e) => {
            if (this._floodProtect) return;
            const up = e.which === 38;
            const down = e.which === 40;
            if (!up && !down) return;
            e.preventDefault();
            let $activeItem = this.$resultItems.filter(".active");
            if ($activeItem.length > 0) {
                let now = new Date().getTime();
                if (now - this._lastLoadTime > this._floodProtectTime) {
                    this.loadSelectedItem($activeItem)
                }
                this._floodProtect = true;
                setTimeout(() => {
                    $activeItem = this.$resultItems.filter(".active");
                    if ($activeItem.attr('id') !== this._loadedItemId) {
                        this.loadSelectedItem($activeItem)
                    }
                    this._floodProtect = false;
                }, this._floodProtectTime);
            }
        });

        this.$gameBuildFilterToggleButton.on('click', (e) => {
            const target = $(e.currentTarget);
            const state = String(target.data('game_build_filter')) === "1";
            this.setGameBuildFilterState(!state);
            this._database.toggleGameBuildFilter(!state);
            ({dictionaries: this._dictionaries, names: this._names} = this._database.dictAndNameList);
            this.updateDisplayedList();
        });

        $(window).on('animationLoaded', (e, data) => {
            this.renderMessage(data);
        });

        $(window).on('blacklistChanged', () => {
            this.resetState();
        });
    }

    setGameBuildFilterState(state) {
        this.$gameBuildFilterToggleButton.toggleClass('fa-toggle-on', state);
        this.$gameBuildFilterToggleButton.toggleClass('fa-toggle-off', !state);
        this.$gameBuildFilterToggleButton.data('game_build_filter', state ? "1" : "0");
    }

    scrollToCenter(item) {
        const scrollTopValue = item.offset().top - this.$listContent.offset().top + this.$listContent.scrollTop() - (this.$listContent.height() / 2) + (item.height() / 2);
        this.$listContent.scrollTop(scrollTopValue);
    }

    getSiblingItem($item, move) {
        let itemId = parseInt($item.attr('id').replace('li', ''));
        let newId = move ? itemId - 1 : itemId + 1;
        return this.$resultItems.filter(`#li${newId}`);
    }

    elementHighlighting(elem) {
        this.$resultItems.removeClass('active');
        elem.addClass('active');
    }

    loadSelectedItem($item) {
        let dict = $item.parent().data('dict');
        let name = $item.text();
        this._loadedItemId = $item.attr('id');
        this._lastLoadTime = new Date().getTime();
        $(window).trigger('animationSelected', {dict, name})
    }

    setupSliders() {
        let init = true
        this.$pagerSlider.slider({
            min: 0,
            value: 0,
            slide: (event, ui) => {
                this.updatePageInfo(ui.value);
            },
            change: (event, ui) => {
                if (init) return init = false;
                this.renderListContent(ui.value * this._itemsPerPage);
            },
            create: () => {
                this.disableKeyOn();
            }
        });
    }

    disableKeyOn() {
        $(".ui-slider-handle").off('keydown keyup');
    }

    resetState() {
        this._settings = this._configManager.getSettings();
        ({dictionaries: this._dictionaries, names: this._names} = this._database.dictAndNameList);
        this.updateDisplayedList();
        this.setGameBuildFilterState(this._settings.filterByGameBuild)
    }

    updateDisplayedList() {
        this.setMaxPage();
        this.updatePageInfo(0);
        this.renderListContent(0);
    }

    setMaxPage() {
        this._maxPage = Math.floor(this._names.length / this._itemsPerPage);
        this.$pagerSlider.slider('option', {value: 0, max: this._maxPage});
    }

    updatePageInfo(currentPage) {
        this.$hits.html(`hits: ${this._names.length.toLocaleString('en-US')}`);
        this.$pages.html(`page: ${currentPage} / ${this._maxPage}`);
    }

    renderListContent(renderStart) {
        let previousDictId = -1;
        let elements = [];
        let liId = 0;
        let renderEnd = renderStart + this._itemsPerPage;
        let maxItems = this._names.length;

        renderEnd = Math.min(renderEnd, maxItems);
        renderStart = Math.min(renderStart, maxItems);

        for (const [dictId, name] of this._names.slice(renderStart, renderEnd)) {
            if (dictId !== previousDictId) {
                previousDictId = dictId;
                const [totalAnimations, buildNumber, animDict, displayedAnimations] = this._dictionaries[previousDictId];
                elements.push(renderDictionaryTitleItem({
                    animDict,
                    buildNumber,
                    totalAnimations,
                    displayedAnimations,
                    currentBuildNumber: this._configManager.gameBuild
                }));
            }
            elements.push(renderListItem(liId++, name));
        }

        this.$listContent.html(`<ul>${elements.join('')}</ul>`);
        this.$listContent.animate({scrollTop: 0}, "slow");
        this.$resultItems = this.$listContent.find("li");
    }

    renderMessage({loadAnim, dict, name, playTime}) {
        let totalTime = loadAnim ? `${Math.round(playTime * 100) / 100} sec` : '-';
        this.$selectedDict.html(loadAnim ? dict : 'cannot be loaded');
        this.$selectedName.html(loadAnim ? name : '-');
        this.$totalTime.html(totalTime);
    }
}