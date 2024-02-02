function renderBlacklistFrame() {
    return `
        <div id="blacklist_container">
            <div id="blacklist_header">
                <span style="display:block; margin: 0.5rem 0;">Blacklisted animation dict / name word fragments:</span>
                <form id="blacklist_form">
                    <div id="blacklist_input_field">
                        <input type="text" id="blacklist_input" name="blacklist_input">
                        <button id="add_blacklist_item_btn">ADD</button>
                    </div>
                </form>
            </div>
            <div id="blacklist_content"></div>
            <div id="blacklist_footer">
                Delete all blacklisted word fragments.
                <button id="clear_all_blacklist_item_btn"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>
    `;
}

function renderBlacklistItem(wordFragment) {
    return `
        <span class="blacklist_item">
            <span class="word_fragment">${wordFragment}</span> 
            <i class="bl_del fa-solid fa-xmark"></i>
        </span>
    `;
}