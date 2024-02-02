class AttachmentHandler {
    SETTINGS_DEFAULTS = {
        'presetWindowStyle': {
            top: '1rem',
            left: '85rem',
            width: '30rem',
            height: '28rem',
            display: 'block'
        }
    };

    constructor(database, configManager) {
        this._newPropName = '';
        this._selectedProp = null;
        this._selectedBone = null;
        this._loadedAnimation = {};
        this._adjust = {offsetX: 0, offsetY: 0, offsetZ: 0, pitch: 0, roll: 0, yaw: 0};

        this._database = database;
        this._configManager = configManager;
        this._apiUrl = configManager.apiUrl;
        this._searchPreset = new SearchPreset();
        this._categories = this._database.categories;
        this._configManager.setDefaultSettings(this.SETTINGS_DEFAULTS);
    }

    initialize() {
        this._settings = this._configManager.getSettings();
        this.setupUI();
        this.setupSliders();
        this.setupEventHandlers();
        this.initPresetFilters();
        this.renderPresetList('disableUpdateFilter');
    }

    setupUI() {
        this.$wrapper = $("#page_container");
        this.$wrapper.append($(renderAttachmentFrame()));

        this.$selfWrapper = this.$wrapper.find('#attachment_wrapper');
        this.$attachmentForm = this.$wrapper.find("#attachment_form");
        this.$editPropPreset = this.$wrapper.find("#edit_prop_preset");
        this.$savePropPreset = this.$wrapper.find("#save_prop_preset");
        this.$attachmentLabel = this.$wrapper.find("#attachment_label");
        this.$resetPropPreset = this.$wrapper.find("#reset_prop_preset");
        this.$attachedAnimDict = this.$wrapper.find(".attached_anim_dict");
        this.$attachedAnimName = this.$wrapper.find(".attached_anim_name");
        this.$animationSaveToggleButton = this.$wrapper.find(".animation_save_toggle_button");
        this._window = new Window({
            name: 'presets',
            title: 'Presets:',
            isDraggable: true,
            isResizable: true,
            ...this._settings.presetWindowStyle
        })

        this._window.setContent(renderPresetFrame());
        this.$window = this._window.getWindow();
        this.$presetContent = this.$window.find(".preset_content");

        this.$adjust = {sliders: {}, values: {}};
        ['offsetX', 'offsetY', 'offsetZ', 'pitch', 'roll', 'yaw'].forEach(axis => {
            this.$adjust.sliders[axis] = this.$wrapper.find(`#${axis}_slider`);
            this.$adjust.values[axis] = this.$wrapper.find(`#${axis}_value`);
        });

        const props = this._database.props || [];
        this.$propSelect = this.$wrapper.find("#prop_select").selectBox({
            options: props.map(item => ({value: item, text: item})),
            placeHolder: 'Select Prop',
            noHitsContent: renderNewPropItemFrame()
        })

        this.$viewNewPropButton = this.$propSelect.find("#view_new_prop");
        this.$saveNewPropButton = this.$propSelect.find("#save_new_prop");
        this.$newPropName = this.$propSelect.find("#new_prop_name");

        let boneOptions = [];
        const pedBoneId = this._database.bones || [];

        for (const key in pedBoneId) {
            if (pedBoneId.hasOwnProperty(key)) {
                boneOptions.push({value: key, text: pedBoneId[key]});
            }
        }

        this.$boneSelect = this.$wrapper.find("#bone_select").selectBox({
            options: boneOptions,
            placeHolder: 'Select Bone'
        })

        const categoryOptions = [];
        const categories = this._database.categories || [];

        for (const key in categories) {
            if (categories.hasOwnProperty(key)) {
                categoryOptions.push({value: key, text: categories[key]});
            }
        }

        this.$categorySelect = this.$wrapper.find("#category_select").selectBox({
            options: categoryOptions,
            placeHolder: 'Select Category'
        })

        this.$categoryFilterSelect = this.$window.find("#category_filter_select");
        this.$propFilterSelect = this.$window.find("#prop_filter_select");
        this.$labelFilter = this.$window.find("#label_filter");

        this.updateEditButtonState();
    }

    hidePage() {
        this.$selfWrapper.hide();
    }

    showPage() {
        this.$selfWrapper.show();
    }

    toggleWindow(state) {
        state = state === undefined ? this.$window.css('display') !== 'block' : state;
        this._window.toggleWindow(state);
    }

    setupEventHandlers() {
        this.$animationSaveToggleButton.on('click', (e) => {
            const target = $(e.currentTarget);
            const state = String(target.attr('data-animation_attach')) === "1";
            this.setAnimationSaveState(!state);
        });

        this.$propSelect.on('selectBoxChange', (e, data) => {
            if (data === undefined) return false;
            this.setProp(data?.value, true);
            $.post(this._apiUrl.setter, JSON.stringify({subject: 'switchProp', model: this._selectedProp}));
        });

        this.$boneSelect.on('selectBoxChange', (e, data) => {
            if (data === undefined) return false;
            this.setBone(data?.value, true);
            $.post(this._apiUrl.setter, JSON.stringify({subject: 'switchBone', boneId: this._selectedBone}));
        });

        this.$resetPropPreset.on('click', (e) => {
            e.preventDefault();
            this.setAllAdjustValue(null);
            $.post(this._apiUrl.setter, JSON.stringify({subject: 'attachmentAdjust', ...this._adjust}));
        });

        this.$savePropPreset.on('click', (e) => {
            e.preventDefault();
            this.savePreset();
        });

        this.$editPropPreset.on('click', (e) => {
            e.preventDefault();
            this.updatePreset();
        });

        this.$presetContent.on('click', '.preset_item', (e) => {
            const target = $(e.target);
            const currentTarget = $(e.currentTarget);
            const presetId = parseInt(currentTarget.attr('id').split('_')[1]);

            if (target.hasClass("preset_del")) {
                $.post(this._apiUrl.changeDatabase, JSON.stringify({subject: 'removePreset', value: presetId}));
            } else {
                this.loadPreset(presetId);
            }
        });

        this.$categoryFilterSelect.on('selectBoxChange', (e, data) => {
            this.setPropFilter(null);
            this.setLabelFilter('');

            this._searchPreset.resetState();
            this._searchPreset.categoryId = data.value;
            this.renderPresetList();
        });

        this.$propFilterSelect.on('selectBoxChange', (e, data) => {
            this._searchPreset.prop = data.value;
            this.renderPresetList();
        });

        this.$labelFilter.on('input', (e) => {
            this._searchPreset.label = $(e.currentTarget).val();
            this.renderPresetList();
        });

        this.$window.on('windowOpenState', (e, style) => {
            this._configManager.updateSetting('presetWindowStyle', style);
        });

        this.$window.on('resize', (e, style) => {
            this._configManager.updateSetting('presetWindowStyle', style);
        });

        this.$window.on('move', (e, style) => {
            this._configManager.updateSetting('presetWindowStyle', style);
        });

        this.$propSelect.on('noHits', (e, data) => {
            this._newPropName = data.queryString;
            this.$newPropName.text(data.queryString);
        });

        this.$viewNewPropButton.on('click', (e) => {
            e.preventDefault();
            $.post(this._apiUrl.setter, JSON.stringify({subject: 'switchProp', model: this._newPropName}));
        });

        this.$saveNewPropButton.on('click', (e) => {
            e.preventDefault();
            $.post(this._apiUrl.changeDatabase, JSON.stringify({subject: 'addProp', value: this._newPropName}));
        });

        $(window).on('animationLoaded', (e, data) => {
            this._loadedAnimation = data;
            this.displayAnimation(data);
        });

        $(window).on('dbChange', (e, data) => {
            this.onDbChange(data);
        });
    }

    setAnimationSaveState(state) {
        this.$animationSaveToggleButton.toggleClass('fa-toggle-on', state);
        this.$animationSaveToggleButton.toggleClass('fa-toggle-off', !state);
        this.$animationSaveToggleButton.attr('data-animation_attach', state ? "1" : "0");
    }

    getAnimationSaveState() {
        return String(this.$animationSaveToggleButton.attr('data-animation_attach')) === '1';
    }

    displayAnimation(data) {
        this.$attachedAnimDict.html(data?.dict || '-');
        this.$attachedAnimName.html(data?.name || '-');
    }

    setupSliders() {
        ['offsetX', 'offsetY', 'offsetZ'].forEach(axis => {
            this.$adjust.sliders[axis].slider({
                min: -1,
                max: 1,
                step: 0.01,
                value: 0,
                slide: (event, ui) => {
                    this.adjustValue(axis, ui.value);
                },
                stop: (event, ui) => {
                    $.post(this._apiUrl.setter, JSON.stringify({subject: 'attachmentAdjust', [axis]: ui.value}));
                    $(window).trigger('changeAdjust', this._adjust);
                }
            });
        });

        ['pitch', 'roll', 'yaw'].forEach(axis => {
            this.$adjust.sliders[axis].slider({
                min: 0,
                max: 360,
                step: 1,
                value: 0,
                slide: (event, ui) => {
                    this.adjustValue(axis, ui.value);
                },
                stop: (event, ui) => {
                    $.post(this._apiUrl.setter, JSON.stringify({subject: 'attachmentAdjust', [axis]: ui.value}));
                    $(window).trigger('changeAdjust', this._adjust);
                }
            });
        });
    }

    adjustValue(key, value) {
        this._adjust[key] = value;
        this.$adjust.values[key].text(value.toFixed(1));
    }

    setAllAdjustValue(values = [0, 0, 0, 0, 0, 0]) {
        Object.keys(this._adjust).forEach((key, i) => {
            this.adjustValue(key, values[i]);
            this.$adjust.sliders[key].slider("option", "value", values[i]);
        });
        $(window).trigger('changeAdjust', this._adjust);
    }

    highlightPreset(presetId) {
        presetId = this.numberOrNull(presetId);
        this.$presetContent.find(".preset_item").removeClass("selected");
        if (presetId !== null) {
            this.$presetContent.find(`#p_${presetId}`).addClass("selected");
        }
    }

    get presetId() {
        return this.numberOrNull(this.$attachmentForm.attr('data-presetId'))
    }

    set presetId(value) {
        this.$attachmentForm.attr('data-presetId', value);
        this.updateEditButtonState();
        this.highlightPreset(value);
    }

    updateEditButtonState() {
        this.$editPropPreset.prop('disabled', this.presetId === null);
    }

    getPresetData() {
        const propData = this._selectedProp ? [
            {
                name: this._selectedProp,
                bone: this._selectedBone,
                adjustment: Object.values(this._adjust)
            }
        ] : [];

        return {
            id: this.presetId,
            prop: propData.length > 0 ? propData : undefined,
            animation: this.getAnimationSaveState() ? this.getLoadedAnimation() : null,
            label: this.$attachmentLabel.val(),
            categoryId: this.$categorySelect.attr('data-value')
        };
    }

    getLoadedAnimation() {
        if(this._loadedAnimation?.dict) {
            const { dict, name } = this._loadedAnimation;
            return { dict, name };
        }
        return null;
    }

    savePreset() {
        const presetData = this.getPresetData();
        $.post(this._apiUrl.changeDatabase, JSON.stringify({subject: 'addPreset', value: presetData}));
    }

    updatePreset() {
        const presetData = this.getPresetData();
        $.post(this._apiUrl.changeDatabase, JSON.stringify({subject: 'updatePreset', value: presetData}));
    }

    onDbChange({db, action, data, referrerId}) {
        switch (db) {
            case 'presets': /* EDIT PRESETS */
                switch (action) {
                    case 'add':
                        if (referrerId === this._configManager.playerId) {
                            this.presetId = data.id;
                        }
                        this._database.addPreset(data.id, data);
                        this.initPresetFilters();
                        this.renderPresetList();
                        break;
                    case 'update':
                        this._database.updatePreset(data.id, data);
                        this.initPresetFilters();
                        this.renderPresetList();
                        break;
                    case 'remove':
                        this.$window.find(`#p_${data}`).remove();
                        this._database.removePreset(data);
                        this.initPresetFilters();
                        if (this.presetId === data) {
                            this.unLoadPreset();
                        }
                        break;
                }

                break;

            case 'props':  /* EDIT PROPS */
                switch (action) {
                    case 'addProp':
                        this._database.addProp(data);
                        const props = this._database.props || [];
                        this.$propSelect.data('selectBoxInstance').updateOptions(props.map(item => ({
                            value: item,
                            text: item
                        })));

                        if (referrerId === this._configManager.playerId) {
                            this.setProp(data);
                            $.post(this._apiUrl.setter, JSON.stringify({
                                subject: 'switchProp',
                                model: this._selectedProp
                            }));
                        }
                        break;
                }
                break;
        }

    }

    setProp(prop, notSetSelectBox) {
        if (!notSetSelectBox) {
            this.$propSelect.data('selectBoxInstance').setSelected(prop);
        }
        this._selectedProp = prop;
        $(window).trigger('changeProp', this._selectedProp);
    }

    setBone(bone, notSetSelectBox) {
        if (!notSetSelectBox) {
            this.$boneSelect.data('selectBoxInstance').setSelected(bone);
        }
        this._selectedBone = bone;
        $(window).trigger('changeBone', this._selectedBone);
    }

    setCategory(categoryId) {
        this.$categorySelect.data('selectBoxInstance').setSelected(categoryId)
    }

    setLabel(label) {
        this.$attachmentLabel.val(label);
    }

    setPropFilter(prop) {
        this.$propFilterSelect.data('selectBoxInstance').setSelected(prop)
    }

    setLabelFilter(label) {
        this.$labelFilter.val(label);
    }

    loadPreset(id) {
        const data = this._database.presetsMap.get(id);

        //RESET PROP
        this.presetId = null;

        $.post(this._apiUrl.setter, JSON.stringify({subject: 'removeAndResetProp'}), () => {
            const prop = data?.prop?.[0];

            // SET SLIDERS
            this.setAllAdjustValue(prop?.adjustment);

            // SET SELECT MENUS
            this.setProp(prop?.name || null);
            this.setBone(prop?.bone || null);

            if (prop) {
                //SET PROP
                $.post(this._apiUrl.setter, JSON.stringify({
                    subject: 'attachPropToBone',
                    boneId: prop.bone,
                    model: prop.name,
                    adjustment: this._adjust
                }));
            }

            //SET DETAILS
            this.setLabel(data?.label || '');
            this.setCategory(this.numberOrNull(data?.categoryId));

            //PLAY ANIMATION
            $(window).trigger('animationSelected', data?.animation);

            if (data) {
                this.presetId = data.id;
            }
        });
    }

    unLoadPreset() {
        this.presetId = null;
        $(window).trigger('animationSelected', null);

        // RESET ADJUST
        this.setAllAdjustValue(null);

        // SET SELECT MENUS
        this.setProp(null);
        this.setBone(null);

        //SET DETAILS
        this.setLabel('');
        this.setCategory(null);
    }


    /* PRESET WINDOW - PRESET SEARCH */
    renderPresetList(disableUpdateFilter) {
        this._searchPreset.data = this._database.presetsArray;
        const filteredPresets = this._searchPreset.search();
        const htmlElements = filteredPresets.map(item => renderPresetItem(item, this._categories, this._searchPreset.label ? this.searchHighLight.bind(this) : undefined));
        this.$presetContent.html(htmlElements.join(''));

        if (!disableUpdateFilter) {
            this.updatePropFilterOptions(filteredPresets);
        }
    }

    searchHighLight(text) {
        return text.replace(
            new RegExp(`(${this._searchPreset.label})`, 'gi'),
            '<span class="fragmentHighlight">$1</span>'
        );
    }

    collectUniqueValuesForPresets(presets) {
        const categoryIds = new Set();
        const props = new Set();

        for (const preset of presets) {
            const firstProp = preset.prop?.[0];

            if (firstProp && firstProp.name !== null && firstProp.name !== undefined && firstProp.name !== "") {
                props.add(firstProp.name);
            }

            const categoryId = this.numberOrNull(preset.categoryId);
            if (categoryId !== null) {
                categoryIds.add(categoryId);
            }
        }

        return {
            categoryIds: [...categoryIds].sort(),
            props: [...props].sort()
        };
    }

    createPropFilterOptions(props) {
        return props.map(prop => ({value: prop, text: prop}));
    }

    updatePropFilterOptions(presets) {
        const uniqueValuesForPresets = this.collectUniqueValuesForPresets(presets);
        const options = this.createPropFilterOptions(uniqueValuesForPresets.props);
        this.$propFilterSelect.data('selectBoxInstance').updateOptions(options);
    }

    initPresetFilters() {
        const uniqueValuesForPresets = this.collectUniqueValuesForPresets(this._database.presetsArray);
        const categories = this._database.categories;
        this.$categoryFilterSelect.selectBox({
            options: uniqueValuesForPresets.categoryIds.map(categoryId => ({
                value: categoryId,
                text: categories[categoryId] || categoryId
            })),
            placeHolder: 'Select Category'
        });

        this.$propFilterSelect.selectBox({
            options: this.createPropFilterOptions(uniqueValuesForPresets.props),
            placeHolder: 'Select Prop'
        });
    }

    numberOrNull(value) {
        value = parseInt(value);
        return isNaN(value) ? null : value;
    }
}