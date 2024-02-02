function renderAttachmentFrame() {
    const offsetSliders = ['offsetX', 'offsetY', 'offsetZ'].map(id => renderAdjustSliders(id));
    const rotationSliders = ['pitch', 'roll', 'yaw'].map(id => renderAdjustSliders(id));

    return `
        <div id="attachment_wrapper">
            <div id="attachment_container">
                <div id="attachment_header">
                    <h4 style="margin-top: 1rem;">Attachment:</h4>
                    <form id="attachment_form" data-presetId="">
                        <fieldset id="attachment_subject">
                            <label for="prop_select">Prop select:</label>
                            <div id="prop_select"></div>
    
                            <label for="bone_select">Bone select:</label>
                            <div id="bone_select"></div>
                        </fieldset>
                        
                        <fieldset id="attachment_animation">
                            <div id="attached_animation">
                                <div class="animation_attach_head">
                                    <h4>Attach animation:</h4>
                                    <i data-animation_attach="1" class="animation_save_toggle_button fa-solid fa-toggle-on"></i>
                                </div>
                                <div>
                                    <span class="attached_anim_dict"></span>
                                    <span class="attached_anim_name"></span>
                                </div>
                            </div>
                        </fieldset>
                        
                        <fieldset id="offset_adjust">
                            ${offsetSliders.join('')}
                        </fieldset>

                        <fieldset id="rotation_adjust">
                            ${rotationSliders.join('')}
                        </fieldset>
                        
                        <fieldset id="attachment_details">
                            <label for="category_select">Category:</label>
                            <div id="category_select"></div>
    
                            <label for="attachment_label">Custom name:</label>
                            <input type="text" placeholder="Name" id="attachment_label">
                        </fieldset>

                        <div id="attachment_action_buttons">
                            <button id="reset_prop_preset">Reset Rotation</button>
                            <button id="edit_prop_preset">Edit Saved Preset</button>
                            <button id="save_prop_preset">Save New Preset</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function renderPresetFrame() {
    return `
        <div class="preset_container">
            <div class="preset_header">
                <div id="category_filter_select"></div>
                <div id="prop_filter_select"></div>
                <input id="label_filter" type="search" placeholder="Name / Anim">
            </div>
            <div class="preset_content"></div>
        </div>
    `;
}

function renderPresetItem(preset, categories, highLight) {
    const categoryId = preset.categoryId;
    const category = categories[categoryId] || '-';
    let label = preset.label || '-';
    let anim = `${preset.animation?.dict || ''} - ${preset.animation?.name || ''}`;

    if(highLight) {
        anim = highLight(anim);
        label = highLight(label);
    }

    const propHtml = preset.prop?.[0] ? `<div class="nowrap overflow_hidden dimmed_text">${preset.prop[0].name}</div>` : '';
    const animHtml = preset.animation?.name ? `<div class="nowrap overflow_hidden subtext">${anim}</div>` : '';

    return `
        <div id="p_${preset.id}" class="preset_item">
            <div class="preset_item_head">
                <div class="nowrap overflow_hidden">${label} <span class="subtext_2">/ ${category}</span></div>
                <div><i class="btn preset_del fa-solid fa-xmark"></i></div>
            </div>
            ${propHtml}
            ${animHtml}
        </div>
    `;
}

function renderAdjustSliders(id) {
    return `
        <div id="${id}_slider_container" class="slider_group">
            <div class="slider_information"><span>${id}:</span><div id="${id}_value">0</div></div>
            <div class="slider" id="${id}_slider"></div>
        </div>
    `;
}

function renderNewPropItemFrame() {
    return `
        <p class="no_hits_text">No Hits</p>
        <p>Would you like to be added to the list: <span id="new_prop_name"></span></p>
        <div class="new_prop_button_container">
            <button id="view_new_prop">View Prop</button><button id="save_new_prop">Save Prop</button>
        </div>
    `;
}