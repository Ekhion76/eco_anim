function createPlayControl() {
    return `
        <div id="play_control_container">
        <div id="play_control_sub_container">
            <div id="play_pause" class="pause"></div>
            <div>
                <div id="control_buttons">
                    <div id="speed_control">
                        <div>SPEED</div>
                        <div id="speed_multiplier_bar"></div>
                        <div id="speed_multiplier"></div>
                    </div>
                    <div id="time_container">
                        <span class="progress_time"></span> / <span class="total_time"></span>
                    </div>
                </div>
                <div id="progress_bar">
                    <div class="slider" id="progress"></div>
                    <div id="progress_ratio"></div>
                </div>
            </div>
        </div>
        <div id="play_control_anim_bar">
            <span id="play_control_dict"></span> - <span id="play_control_name"></span>
        </div>
    </div>
    `
}