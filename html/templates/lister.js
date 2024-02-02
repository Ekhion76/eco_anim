function renderListFrame() {
    return `
        <div id="anim_list_wrapper">
            <div id="anim_list_container">
                <div id="list_header">                    
                    <div id="game_build_container">
                        <span>Your gameBuild:</span>
                        <span id="gameBuildValue"></span>
                        <span>Only listing available animDicts:</span>
                        <i data-game_build_filter="0" class="game_build_filter_toggle_button fa-solid fa-toggle-off"></i>
                    </div>
       
                    <div id="search_container" class="center">
                        <form id="animation_search_form">
                            <input type="search" name="q" id="q" placeholder="search...">
                            <button id="search_btn">search</button>
                            <button id="reset_btn">reset</button>
                        </form>
                    </div>
        
                    <div id="pager_slider_header">
                        <div class="left"><span id="prev" class="paging btn">prev</span></div>
                        <div id="hits" class="center"></div>
                        <div id="pages" class="center"></div>
                        <div class="right"><span id="next" class="paging btn">next</span></div>
                    </div>
        
                    <div id="pager_slider_container">
                        <div id="pager_slider"></div>
                    </div>
        
                    <div id="message_container">
                        <span class="bold">Played:</span>
                        <ul id="playing">
                            <li id="selected_dict">no selected anim</li>
                            <li id="selected_name">no selected anim</li>
                        </ul>
                        <span class="bold">Play time:</span>
                        <span class="total_time">0ms</span>
                    </div>
                </div>
                <div id="list_content"></div>
            </div>
        </div>
    `;
}

function renderDictionaryTitleItem(data) {
    const buildClassName = (data.buildNumber === 'none' || data.buildNumber > data.currentBuildNumber) ? 'invalid' : 'valid';
    return `
        </ul>
            <p>${data.animDict}
                <span class="details">
                     <span class="${buildClassName}">[build:${data.buildNumber}]</span> 
                     show: ${data.displayedAnimations} / ${data.totalAnimations}
                </span>
            </p>
        <ul data-dict="${data.animDict}">
    `;
}

function renderListItem(id, name) {
    return `<li id='li${id}'>${name}</li>`;
}