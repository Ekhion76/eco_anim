function renderWindowFrame(name) {
    return `
        <div id="${name}_window_wrapper" class="window">
            <div class="window_container">
                <div class="window_header"></div>
                <div class="window_content"></div>
            </div>
        </div>
    `;
}

function renderWindowHeader() {
    return `
        <div class="window_header_content">
            <div class="window_title"></div>
            <div class="window_control_buttons">
                <div><i class="close window_close btn fa-solid fa-xmark"></i></div>
            </div>
        </div>
    `;
}