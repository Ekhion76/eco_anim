(function ($) {
    $.fn.selectBox = function (args) {
        const instances = [];

        this.each(function () {
            const $parent = $(this);
            const selectBoxInstance = new SelectBox($parent, args);
            $parent.data('selectBoxInstance', selectBoxInstance);
            instances.push($parent);
        });

        return instances.length === 1 ? instances[0] : instances;
    };

    class SelectBox {
        constructor($parent, args) {
            args = args && typeof args === 'object' ? args : {};
            this.$parent = $parent;
            this.options = args.options || [];
            this.selectedValue = args.selectedValue || '';
            this.placeHolder = args.placeHolder || 'Please Select';
            this.noHitsContent = args.noHitsContent || 'No Hits';
            this.previousSelectedValue = '';

            this.init();
            this.renderOptions();
            this.addEventListeners();
        }

        createSelectBox() {
            return `
                <div class="select_box_wrapper">
                    <div class="select_box_container">
                        <div class="select_box_header">
                            <button class="select_box_cancel_button">x</button>
                            <input class="select_box_option_search" placeholder="${this.placeHolder}">
                        </div>
                        <div class="select_box_content">
                            <div class="select_box_no_hits_container">
                                ${this.noHitsContent}
                            </div>
                            <div class="select_box_options_container"></div>
                        </div>
                    </div>
                </div>
                `
        }

        createOption(value, text) {
            return `
                <div class="option" data-value="${value}">${text}</div>
            `
        }

        // addOption(value, text) {
        //     const optionHTML = this.createOption(value, text);
        //     this.$optionsContainer.prepend(optionHTML);
        //     this.$options = this.$optionsContainer.find('.option');
        // }
        //
        // removeOption(value) {
        //     this.$optionsContainer.find(`.option[data-value="${value}"]`).remove();
        //     this.$options = this.$optionsContainer.find('.option');
        // }

        init() {
            this.$parent.html(this.createSelectBox());
            this.$optionsContainer = this.$parent.find('.select_box_options_container');
            this.$searchInput = this.$parent.find('.select_box_option_search');
            this.$content = this.$parent.find('.select_box_content');
            this.$noHitsContainer = this.$parent.find('.select_box_no_hits_container');
            this.$cancelButton = this.$parent.find('.select_box_cancel_button');
            this.$parent.attr('data-value', '').attr('data-text', '');
        }

        renderOptions() {
            if (this.isIterable(this.options)) {
                const optionsHTML = this.options.map(option => this.createOption(option.value, option.text)).join('');
                this.$optionsContainer.html(optionsHTML);
                this.$options = this.$optionsContainer.find('.option');
            }
        }

        isIterable(obj) {
            return obj && obj.forEach && typeof obj.forEach === 'function';
        }

        addEventListeners() {
            this.$searchInput.on('input', (e) => {
                const target = $(e.currentTarget);
                const queryString = target.val();
                this.filterOptions(queryString);
                if (queryString === '') {
                    this.removeSelectedValue();
                }
                this.updateCancelButtonState();
            });

            this.$optionsContainer.on('mousedown', '.option', (e) => {
                e.preventDefault();
                const target = $(e.currentTarget);
                this.setSelectedValue(target);
                this.$searchInput.blur();
            });

            this.$searchInput.on('focus', () => {
                this.$content.addClass('input_focused');
                this.toggleNoHitsVisibility(false);
                this.updateCancelButtonState();
            });

            this.$searchInput.on('blur', () => {
                this.onBlurHandler();
                this.updateCancelButtonState();
            });

            this.$cancelButton.on('mousedown', (e) => {
                e.preventDefault();
                this.removeSelectedValue();
            });

            this.$noHitsContainer.on('mousedown', (e) => {
                e.preventDefault();
            });
        }

        updateCancelButtonState() {
            const state = this.$searchInput.is(':focus') && this.$searchInput.val() ? 'block' : 'none';
            this.$cancelButton.css('display', state);
        }

        filterOptions(queryString) {
            queryString = queryString.toLowerCase();
            let hit = false;

            this.$options.each(function () {
                const optionText = $(this).text().toLowerCase();
                const display = optionText.includes(queryString) ? '' : 'none';
                $(this).css('display', display);
                if (display !== 'none') {
                    hit = true;
                }
            });

            this.toggleNoHitsVisibility(!hit);

            if (!hit) {
                this.onNoHits(queryString);
            }
        }

        toggleNoHitsVisibility(enable) {
            this.$noHitsContainer.css('display', enable ? '' : 'none');
        }

        onNoHits(queryString) {
            this.$parent.trigger('noHits', {queryString: queryString});
        }

        setSelectedValue($option, value) {
            this.$options.removeClass('selected');
            const canTrigger = value == null
            let text = value;
            if ($option) {
                text = $option.text();
                value = $option.data('value');

                this.$searchInput.val(text);
                $option.addClass('selected');
            }

            this.$parent.attr('data-text', text).attr('data-value', value);
            if (this.previousSelectedValue !== value) {
                if (canTrigger) {
                    this.$parent.trigger('selectBoxChange', {value: value});
                }
                this.previousSelectedValue = value;
            }
        }

        removeSelectedValue() {
            this.$options.removeClass('selected');
            this.$parent.attr('data-value', '').attr('data-text', '');
            this.$searchInput.val('');
            if (this.previousSelectedValue !== '') {
                this.$parent.trigger('selectBoxChange', {value: ''});
                this.previousSelectedValue = '';
            }
            this.displayAllOptions();
            this.updateCancelButtonState();
            this.toggleNoHitsVisibility(false);
        }

        displayAllOptions() {
            this.$options.each(function () {
                $(this).css('display', '');
            });
        }

        onBlurHandler() {
            this.$content.removeClass('input_focused');
            const selectedText = this.$parent.attr('data-text');
            if (this.$searchInput.val() !== selectedText) {
                this.$searchInput.val(selectedText);
                this.displayAllOptions();
            }
        }

        setSelected(value) {
            if (value == null || value === '') return this.removeSelectedValue();
            const $option = this.$optionsContainer.find(`.option[data-value="${value}"]`);
            $option.length > 0 ? this.setSelectedValue($option, value) : this.removeSelectedValue();
            this.$searchInput.blur();
        }

        updateOptions(newOptions) {
            this.options = newOptions;
            this.renderOptions();
        }
    }
})(jQuery);

