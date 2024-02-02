class PlayControl {
    SETTINGS_DEFAULTS = {
        'playerWindowStyle': {
            top: 'unset',
            bottom: '1rem',
            left: '30rem',
            right: 'unset',
            width: '50rem',
            height: 'min-content',
            display: 'block'
        }
    };

    constructor(configManager) {
        this._maxSpeed = 2;
        this._minSpeed = 0.1;
        this._totalTime = 0;
        this._speedStep = 0.1;
        this._lastPlayed = null;
        this._progressRatio = 0;
        this._speedMultiplier = 1.0;
        this._player = {
            playButton: 'play',
            state: 'stopped'
        };
        this._configManager = configManager;
        this._apiUrl = configManager.apiUrl;
        this._configManager.setDefaultSettings(this.SETTINGS_DEFAULTS);
    }

    initialize() {
        this._settings = this._configManager.getSettings();
        this.setupUI();
        this.setupEventHandlers();
        this.setupSliders();
        this.resetState();
    }

    setupUI() {
        this._window = new Window({
            name: 'player',
            title: 'Player:',
            isDraggable: true,
            isResizable: false,
            ...this._settings.playerWindowStyle
        })

        this._window.setContent(createPlayControl());
        this.$window = this._window.getWindow();
        this.$playedDict = this.$window.find("#play_control_dict");
        this.$playedName = this.$window.find("#play_control_name");
        this.$speedMultiplier = this.$window.find("#speed_multiplier");
        this.$speedMultiplierBar = this.$window.find("#speed_multiplier_bar");
        this.$playPause = this.$window.find("#play_pause");
        this.$progress = this.$window.find("#progress");
        this.$progressTime = this.$window.find(".progress_time");
        this.$progressRatio = this.$window.find("#progress_ratio");
        this.$totalTime = this.$window.find('.total_time');
    }

    toggleWindow(state) {
        state = state === undefined ? this.$window.css('display') !== 'block' : state;
        this._window.toggleWindow(state);
    }

    setupEventHandlers() {
        this.$playPause.on('click', () => {
            if (this._player.state === 'stopped') {
                this.load(this.lastPlayed);
            } else if (this._player.state === 'paused') {
                $.post(this._apiUrl.setter, JSON.stringify({
                    subject: 'resume',
                    value: this._speedMultiplier
                }), response => this.setPlayerState(response.animState));
            } else {
                $.post(this._apiUrl.setter, JSON.stringify({
                    subject: 'pause'
                }), response => this.setPlayerState(response.animState));
            }
        });

        this.$window.on('windowOpenState', (e, style) => {
            this._configManager.updateSetting('playerWindowStyle', style);
        });

        this.$window.on('move', (e, style) => {
            this._configManager.updateSetting('playerWindowStyle', style);
        });

        $(window).on('animationSelected', (e, data) => {
            this.load(data);
        });
    }

    setupSliders() {
        this.$progress.slider({
            min: 0,
            max: 1,
            step: 0.01,
            value: 0.0,
            slide: (event, ui) => {
                this.progressRatio = ui.value;
                $.post(this._apiUrl.setter, JSON.stringify({
                    subject: 'setAnimCurrentTime',
                    value: ui.value
                }), response => this.setPlayerState(response.animState));
            }
        });

        this.$speedMultiplierBar.slider({
            min: this._minSpeed,
            max: this._maxSpeed,
            step: this._speedStep,
            value: 1.0,
            slide: (event, ui) => {
                this.speedMultiplier = ui.value;
            },
            stop: (event, ui) => {
                $.post(this._apiUrl.setter, JSON.stringify({
                    subject: 'speed',
                    value: ui.value
                }), response => this.setPlayerState(response.animState));
            }
        });
    }

    resetState() {
        this.speedMultiplier = this._speedMultiplier;
        this.progressRatio = 0;
    }

    load(data, stopPosition) {
        if (!data) {
            $(window).trigger('animationLoaded', null);
            this.lastPlayed = null;
            return;
        }

        stopPosition = (stopPosition && Number.isFinite(stopPosition)) ? stopPosition : -1
        $.post(this._apiUrl.animLoad, JSON.stringify({
            dict: data.dict,
            name: data.name,
            speedMultiplier: this.speedMultiplier,
            stopPosition: stopPosition
        }), response => {
            $(window).trigger('animationLoaded', response);
            this.totalTime = response.playTime;
            if (response.loadAnim) {
                this.lastPlayed = data;
            }
        });
    }

    setProgress(value) {
        this.updateProgress(value);
        this.setPlayerState('playing');
    }

    setPlayerState(state) {
        if (this._player.state === state) return;
        this._player.state = state;
        switch (state) {
            case 'stopped':
                this.updateProgress(1);
                this.playButtonState = 'play';
                break;
            case 'paused':
                this.playButtonState = 'play';
                break;
            case 'playing':
                this.playButtonState = 'pause';
                break;
        }
    }

    set lastPlayed(data) {
        this._lastPlayed = data;
        this.displayLastPlayed();
    }

    set speedMultiplier(speed) {
        this.$speedMultiplier.html(speed.toFixed(1));
        this._speedMultiplier = speed;
    }

    set playButtonState(state) {
        if (this._player.playButton === state) return;
        this._player.playButton = state;
        this.$playPause.removeClass(state === 'pause' ? 'play' : 'pause').addClass(state);
    }

    set progressRatio(ratio) {
        this._progressRatio = ratio;
        this.displayProgressRatio();
        this.displayElapsedTime();
    }

    set totalTime(time) {
        time = (time && Number.isFinite(time)) ? time : 0;
        this._totalTime = time;
        this.$totalTime.html(time.toFixed(2) + ' sec');
    }

    get lastPlayed() {
        return this._lastPlayed;
    }

    get speedMultiplier() {
        return this._speedMultiplier;
    }

    updateProgress(ratio) {
        this.$progress.slider("value", ratio);
        this.progressRatio = ratio;
    }

    displayProgressRatio() {
        this.$progressRatio.html(this._progressRatio.toFixed(2));
    }

    displayElapsedTime() {
        this.$progressTime.html((this._totalTime * this._progressRatio).toFixed(2));
    }

    displayLastPlayed() {
        this.$playedDict.html(this._lastPlayed ? this._lastPlayed.dict : '-');
        this.$playedName.html(this._lastPlayed ? this._lastPlayed.name : '-');
    }
}