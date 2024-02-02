class CodeMonitor {
    SETTINGS_DEFAULTS = {
        'codeMonitorWindowStyle': {
            top: '1rem',
            left: '30rem',
            width: '50rem',
            height: '10rem',
            display: 'block'
        }
    };

    constructor(configManager) {
        this._codeFragments = {};
        this._configManager = configManager;
        this._configManager.setDefaultSettings(this.SETTINGS_DEFAULTS);
        this._settings = this._configManager.getSettings();
        this.setupUI();
        this.setupEventHandlers();
    }

    setupUI() {
        this._window = new Window({
            name: 'codeMonitor',
            title: 'Code Monitor:',
            isDraggable: true,
            isResizable: true,
            ...this._settings.codeMonitorWindowStyle
        })

        this._window.setContent(renderCodeMonitorFrame());
        this.$window = this._window.getWindow();
        this.$codeAttach = this.$window.find('#code_attach');
        this.$codeAnimation = this.$window.find("#code_animation");
    }

    toggleWindow(state) {
        state = state === undefined ? this.$window.css('display') !== 'block' : state;
        this._window.toggleWindow(state);
    }

    setupEventHandlers() {
        this.$window.on("click", ".code_row", (e) => {
            let target = $(e.currentTarget);
            let codeFragment = target.find('.code_fragment');
            if (codeFragment.length) {
                let text = codeFragment.text();
                this.copyToClipboard(text);
            }
        });

        this.$window.on('windowOpenState', (e, style) => {
            this._configManager.updateSetting('codeMonitorWindowStyle', style);
        });

        this.$window.on('resize', (e, style) => {
            this._configManager.updateSetting('codeMonitorWindowStyle', style);
        });

        this.$window.on('move', (e, style) => {
            this._configManager.updateSetting('codeMonitorWindowStyle', style);
        });

        $(window).on('animationLoaded', (e, data) => {
            this._codeFragments.animation = data || null;
            this.setAnimationCode();
        });

        $(window).on('changeProp', (e, data) => {
            this._codeFragments.prop = data || null;
            this.setAttachCode();
        });

        $(window).on('changeBone', (e, data) => {
            this._codeFragments.bone = data || null;
            this.setAttachCode();
        });

        $(window).on('changeAdjust', (e, data) => {
            this._codeFragments.adjust = data || null;
            this.setAttachCode();
        });
    }

    setAnimationCode() {
        if (!this._codeFragments.animation) {
            this.$codeAnimation.empty();
            this.$codeAnimation.parent().css('display', 'none');
            return;
        }

        this.$codeAnimation.parent().css('display', 'grid');
        this.$codeAnimation.text(`dict = "${this._codeFragments.animation.dict}", name = "${this._codeFragments.animation.name}"`);
    }

    setAttachCode() {
        if (!this._codeFragments.prop) {
            this.$codeAttach.parent().css('display', 'none');
            return;
        }

        const adjust = this._codeFragments.adjust ? Object.values(this._codeFragments.adjust) : [0, 0, 0, 0, 0, 0];
        const bone = this._codeFragments.bone ? this._codeFragments.bone : 0;

        this.$codeAttach.parent().css('display', 'grid');
        this.$codeAttach.text(`AttachEntityToEntity(\`${this._codeFragments.prop}\`, ped, GetPedBoneIndex(ped, ${bone}), 
            ${adjust[0].toFixed(1)}, ${adjust[1].toFixed(1)}, ${adjust[2].toFixed(1)}, 
            ${adjust[3].toFixed(1)}, ${adjust[4].toFixed(1)}, ${adjust[5].toFixed(1)}, 
            false, false, false, false, 2, true)`.replace(/\s{2,}/g, ' '));

    }

    copyToClipboard(string) {
        let $temp = $("<input>");
        $("body").append($temp);
        $temp.val(string).select();
        document.execCommand("copy");
        $temp.remove();
    }
}

//this.$codePlayAnim.text(`TaskPlayAnim(ped, animation.dict, animation.name, enterSpeed, exitSpeed, duration, flag, startTime, false, false, false)`);
//CreateObject(model, self.propBasePosition, false, false)