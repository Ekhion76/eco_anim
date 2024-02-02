function renderCodeMonitorFrame() {
    const codeRows = [];
    ['animation', 'attach'].forEach(id => codeRows.push(createCodeRow(id)))
    return `
        <div id="code_monitor_wrapper">
            <div id="code_monitor_container">
                <!--<div id="code_monitor_header">
                    <button>Copy All</button>
                </div>-->
                <div id="code_monitor_content">
                    ${codeRows.join('')}
                </div>
            </div>
        </div>
    `;
}

function createCodeRow(id) {
    return `
        <div class="code_row">
            <div id="code_${id}" class="code_fragment"></div>
            <div><i class="fa-regular fa-copy"></i></div>
        </div>
    `
}