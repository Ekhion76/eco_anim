class Window {
    DEFAULT_WINDOW_STYLE = {
        top: '1rem',
        left: '30rem',
        right: 'unset',
        width: '25rem',
        height: '20rem',
        bottom: 'unset',
        display: 'block'
    };

    constructor(options) { //isHeader
        const {
            name,
            title,
            isResizable,
            isDraggable,
            top = this.DEFAULT_WINDOW_STYLE.top,
            left = this.DEFAULT_WINDOW_STYLE.left,
            right = this.DEFAULT_WINDOW_STYLE.right,
            width = this.DEFAULT_WINDOW_STYLE.width,
            height = this.DEFAULT_WINDOW_STYLE.height,
            bottom = this.DEFAULT_WINDOW_STYLE.bottom,
            display = this.DEFAULT_WINDOW_STYLE.display
        } = options;

        this._name = name;
        this._title = title;
        this._parent = '#wrapper';
        this._isResizable = isResizable;
        this._isDraggable = isDraggable;
        this._style = { width, height, top, left, bottom, right, display };

        this.setupUI();
        this.setupEventHandlers();
        this.setTitle(this._title);
    }

    setupUI() {
        this.$wrapper = $(this._parent);
        this.$selfWrapper = $(renderWindowFrame(this._name)).css(this._style);
        this.$selfWrapper.find('.window_header').append($(renderWindowHeader()));
        this.$content = this.$selfWrapper.find('.window_content');
        this.$windowTitle = this.$selfWrapper.find('.window_title');
        this.$windowControlButtons = this.$selfWrapper.find('.window_control_buttons');
        this.$wrapper.append(this.$selfWrapper);
    }

    getWindow() {
        return this.$selfWrapper;
    }

    setContent(content) {
        this.$content.html(content);
    }

    setTitle(title) {
        this.$windowTitle.html(title);
    }

    toggleWindow(state) {
        this.$selfWrapper.toggle(state);
        this.onChangeOpenState(state);
    }

    onChangeOpenState(state) {
        this._style.display = state ? 'block' : 'none';
        this.$selfWrapper.trigger('windowOpenState', this._style);
    }

    onResize() {
        this.$selfWrapper.trigger('resize', this._style);
    }

    onMove() {
        this.$selfWrapper.trigger('move', this._style)
    }

    setupEventHandlers() {
        this.$windowControlButtons.on('click', '.btn', (e) => {
            const target = $(e.target);
            //const currentTarget = $(e.currentTarget);

            if (target.hasClass("window_close")) {
                this.toggleWindow(false);
            }
        });

        if (this._isResizable) {
            this.$selfWrapper.resizable({
                minWidth: 250,
                minHeight: 100,
                containment: this.$wrapper,
                start: (event, ui) => {
                    let top = parseFloat(this.$selfWrapper.css("top"));
                    let left = parseFloat(this.$selfWrapper.css("left"));
                    this.$selfWrapper.css({left: left, top: top, right: 'unset', bottom: 'unset', transform: 'none'});
                },

                stop: (event, ui) => {
                    const position = this.getPosition();
                    this.$selfWrapper.css(position);
                    const sizeWithUnit = {
                        width: ui.size.width + 'px',
                        height: ui.size.height + 'px'
                    };

                    Object.assign(this._style, position, sizeWithUnit);
                    this.onResize();
                }
            });
        }

        if (this._isDraggable) {
            this._dragData = {};
            this.$selfWrapper.draggable({
                containment: this.$wrapper,
                handle: '.window_header',
                distance: 0,
                stack: ".window",
                start: (event, ui) => {
                    this._dragData.parentWidth = parseFloat(this.$wrapper.width());
                    this._dragData.parentHeight = parseFloat(this.$wrapper.height());
                    this._dragData.halfWrapperWidth = this.$selfWrapper.width() / 2;
                    this._dragData.halfWrapperHeight = this.$selfWrapper.height() / 2;
                    this.$selfWrapper.css({right: 'unset', bottom: 'unset', transform: 'none'});
                },
                stop: (event, ui) => {
                    const position = this.getPosition();
                    this.$selfWrapper.css(position);
                    Object.assign(this._style, position);
                    this.onMove();
                }
            });
        }
    }

    getPosition() {
        let l = 'unset', r = 'unset', t = 'unset', b = 'unset';
        let left = parseFloat(this.$selfWrapper.css("left"));
        let right = parseFloat(this.$selfWrapper.css("right"));
        let top = parseFloat(this.$selfWrapper.css("top"));
        let bottom = parseFloat(this.$selfWrapper.css("bottom"));

        //horizontal align
        if ((left + this._dragData.halfWrapperWidth) > (this._dragData.parentWidth / 2)) {
            r = (100 * right / this._dragData.parentWidth).toFixed(2) + "%";
        } else {
            l = (100 * left / this._dragData.parentWidth).toFixed(2) + "%";
        }

        //vertical align
        if ((top + this._dragData.halfWrapperHeight) > (this._dragData.parentHeight / 2)) {
            b = (100 * bottom / this._dragData.parentHeight).toFixed(2) + "%";
        } else {
            t = (100 * top / this._dragData.parentHeight).toFixed(2) + "%";
        }
        return {top: t, left: l, right: r, bottom: b};
    }
}