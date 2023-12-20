const resourceName = GetParentResourceName();
const $slider = $("#slider");
const $container = $("#container");
const $hits = $("#hits");
const $next = $("#next");
const $prev = $("#prev");
const $pages = $("#pages");
const $reset_btn = $('#reset_btn');
const $search_btn = $('#search_btn');
const $form = $("form");

const $selectedDict = $('#selectedDict');
const $selectedName = $('#selectedName');
const $playTime = $('#playTime');
const floodProtectTime = 1000;

let idx = 0;
let maxPage = 0;
let dictArray = [];
let nameArray = [];
let resultName = [];
let resultDict = [];
let $resultItems = [];
let itemsPerPage = 1000;
let floodProtect;
let loadedItemId;
let lastLoadTime = new Date().getTime();

$("#wrapper").draggable({
    handle: '#header',
    containment: "parent"
});

$container.on("click", "li", function () {
    elementHighlighting($(this));
    loadSelectedItem($(this));
});

$slider.slider({
    min: 0,
    value: 0,
    slide: function (event, ui) {
        updatePageInfo(ui.value);
    },
    change: function (event, ui) {
        updatePageInfo(ui.value);
        render(ui.value * itemsPerPage);
    },
    create: function() {
        disableKeyOn();
    }
});

function disableKeyOn() {
    $(".ui-slider-handle").off('keydown keyup');
}

$prev.on("click", function () {
    let value = $slider.slider("option", "value");
    if (value > 0) {
        $slider.slider("option", "value", value - 1);
    }
});

$next.on("click", function () {
    let value = $slider.slider("option", "value");
    if (value < maxPage) {
        $slider.slider("option", "value", value + 1);
    }
});

/* SEARCH */
$search_btn.on("click", function (e) {
    e.preventDefault();
    let q = $('#q').val().trim().toLowerCase();
    if (!q) return;
    idx = 0;
    resultName = [];
    resultDict = [];
    for (const raw of animations) {
        let names = [];
        if (raw.length < 2) {
            continue;
        }

        if (raw[0].includes(q)) {
            for (let i = 1; i < raw.length; i++) {
                names.push([idx, raw[i]])
            }
        } else {
            raw.forEach(n => {
                if (n.includes(q)) {
                    names.push([idx, n])
                }
            });
        }
        if (names.length > 0) {
            resultDict[idx] = [raw[0], raw.length - 1, names.length];
            resultName.push(...names);
        }
        idx++;
    }
    maxPage = Math.floor(resultName.length / itemsPerPage);
    $slider.slider("option", {max: maxPage, value: 0});
    updatePageInfo(0);
    render(0);
});

$reset_btn.on("click", function (e) {
    e.preventDefault();
    $('#q').val('');

    resultName = nameArray;
    resultDict = dictArray;
    maxPage = Math.floor(resultName.length / itemsPerPage);
    $slider.slider("option", "max", maxPage);
    $slider.slider("option", "value", 0);
    updatePageInfo(0);
    render(0);
});

$form.on('keyup keypress', function (e) {
    let keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
        e.preventDefault();
        return false;
    }
});

$('#close').on("click", function () {
    $('#wrapper').css("display", "none");
    $.post(`https://${resourceName}/exit`);
});

$(document).on("keyup", function (key) {
    if (key.which === 27) {
        $('#wrapper').css("display", "none");
        $.post(`https://${resourceName}/exit`);
    }
});

function updatePageInfo(currentPage) {
    $hits.html(`hits: ${resultName.length.toLocaleString('en-US')}`);
    $pages.html(`page: ${currentPage} / ${maxPage}`);
}

function render(start) {
    let dictId = -1;
    let elements = [];
    let liId = 0;

    let requiredItems = start + itemsPerPage;
    let maxItems = resultName.length;

    requiredItems = Math.min(requiredItems, maxItems);
    start = Math.min(start, maxItems);

    for (let i = start; i < requiredItems; i++) {
        if (resultName[i][0] !== dictId) {
            dictId = resultName[i][0];
            let dict = resultDict[dictId];
            elements.push(`</ul><p>${dict[0]} <span class="details">show: ${dict[2]} / ${dict[1]}</span></p><ul data-dict="${dict[0]}">`);
        }
        elements.push(`<li id='li${liId++}'>${resultName[i][1]}</li>`);
    }

    $container.html(`<ul>${elements.join('')}</ul>`);
    $container.animate({scrollTop: 0}, "slow");
    $resultItems = $container.find("li");
}

function renderMessage(data) {
    if (data.loadAnim) {
        $selectedDict.html(data.dict);
        $selectedName.html(data.name);
        $playTime.html(`${Math.round(data.playTime * 100) / 100}sec`);
    } else {
        $selectedDict.html('cannot be loaded');
        $selectedName.html('-');
        $playTime.html('-');
    }
}

function copyToClipboard(string) {
    let $temp = $("<input>");
    $("body").append($temp);
    $temp.val(string).select();
    document.execCommand("copy");
    $temp.remove();
}

animations.forEach(raw => {
    let sumNameLength = raw.length - 1;
    if (sumNameLength < 1) {
        return;
    }
    dictArray[idx] = [raw[0], sumNameLength, sumNameLength];
    for (let i = 1; i < raw.length; i++) {
        nameArray.push([idx, raw[i]]);
    }
    idx++;
});

resultName = nameArray;
resultDict = dictArray;

maxPage = Math.floor(resultName.length / itemsPerPage);
$slider.slider("option", "max", maxPage);

updatePageInfo(0);
render(0);

// Listen for NUI Events
window.addEventListener('message', function (event) {
    let item = event.data;
    if (item.subject === 'OPEN') {
        $('#wrapper').css("display", "grid");
    }
});

$(document).on("keydown", function (e) {
    const up = e.which === 38;
    const down = e.which === 40;
    if (!up && !down) return;
    e.preventDefault();
    let $activeItem = $resultItems.filter(".active");
    if ($activeItem.length > 0) {
        let newItem = getNewItem($activeItem, up);
        if (newItem.length > 0) {
            scrollToCenter(newItem);
            elementHighlighting(newItem);
        }
    } else {
        elementHighlighting($resultItems.first());
    }
});

$(document).on("keyup", function (e) {
    if (floodProtect) return;
    const up = e.which === 38;
    const down = e.which === 40;
    if (!up && !down) return;
    e.preventDefault();
    let $activeItem = $resultItems.filter(".active");
    if ($activeItem.length > 0) {
        let now = new Date().getTime();
        if (now - lastLoadTime > floodProtectTime) {
            loadSelectedItem($activeItem)
        }
        floodProtect = true;
        setTimeout(function () {
            $activeItem = $resultItems.filter(".active");
            if ($activeItem.attr('id') !== loadedItemId) {
                let now = new Date().getTime();
                loadSelectedItem($activeItem)
            }
            floodProtect = false;
        }, floodProtectTime);
    }
});

function scrollToCenter(item) {
    const scrollTopValue = item.offset().top - $container.offset().top + $container.scrollTop() - ($container.height() / 2) + (item.height() / 2);
    $container.scrollTop(scrollTopValue);
}

function getNewItem($activeItem, up) {
    let currentId = parseInt($activeItem.attr('id').replace('li', ''));
    let newId = 'li' + (up ? currentId - 1 : currentId + 1);
    return $resultItems.filter("#" + newId);
}

function elementHighlighting(elem) {
    $resultItems.removeClass('active');
    elem.addClass('active');
}

function loadSelectedItem($selectedItem) {
    let dict = $selectedItem.parent().data('dict');
    let name = $selectedItem.text();
    loadedItemId = $selectedItem.attr('id');
    copyToClipboard((`dict = '${dict}', name = '${name}'`));
    lastLoadTime = new Date().getTime();
    $.post(`https://${resourceName}/playAnim`, JSON.stringify({dict, name}), response => {
        renderMessage(response);
    });
}
