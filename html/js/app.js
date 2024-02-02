const parentResourceName = GetParentResourceName();
const appData = {
    resourceName: parentResourceName,
    apiUrl: {
        app: `https://${parentResourceName}/app`,
        setter: `https://${parentResourceName}/set`,
        animLoad: `https://${parentResourceName}/animLoad`,
        changeDatabase: `https://${parentResourceName}/changeDatabase`
    }
};

let page;
let database;
let $wrapper = $("#wrapper");

function translate(key, ...inc) {
    if (typeof appData.locale !== 'object') {
        return key;
    }

    let str = appData.locale[key] || key;
    return (inc.length > 0) ? str.format(...inc) : str;
}

$('#close').on("click", function () {
    close();
    $.post(appData.apiUrl.app, JSON.stringify({subject: 'exit'}));
});

$(document).on("keyup", function (key) {
    if (key.which === 27) { // ESC
        close();
        $.post(appData.apiUrl.app, JSON.stringify({subject: 'exit'}));
    }
});

//'keyup keypress' ENTER
$(document).on("keydown", function (e) {
    if (e.which === 13) { // ENTER
        e.preventDefault();
        return false;
    }

    if (e.target.tagName !== 'INPUT' && e.which === 69) { // E
        $.post(appData.apiUrl.setter, JSON.stringify({subject: 'focus', state: false}))
    }
});

// Listen for NUI Events
window.addEventListener('message', function (event) {
    let item = event.data;
    switch (item.subject) {
        case 'OPEN':
            open();
            break;
        case 'CLOSE':
            close();
            break;
        case 'PROGRESS':
            page.playControl.setProgress(item.value);
            break;
        case 'ANIM_STATE':
            page.playControl.setPlayerState(item.value);
            break;
        case 'DB_CHANGED':
            //page.attachmentHandler.onDbChange(item);
            $(window).trigger('dbChange', item);
            break;
    }
});

function open() {
    $wrapper.show();
    page.playControl.load({dict: 'random@shop_gunstore', name: '_greeting'});
}

function close() {
    $wrapper.hide();
}

const configManager = new ConfigurationManager();

$.post(appData.apiUrl.app, JSON.stringify({subject: 'ready'}), data => {
    data.locale = data.locale || {};
    data.config = data.config || {};

    database = new DataBase(animations, data.db, configManager);
    configManager.init({...appData, ...data.config});
    page = new Page(database, configManager);
    page.page = 'lister';
});