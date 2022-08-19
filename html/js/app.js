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

let idx = 0;
let maxPage = 0;
let dictArray = [];
let nameArray = [];
let resultName = [];
let resultDict = [];
let itemsPerPage = 1000;

$("#wrapper").draggable({
    handle: '#header',
    containment: "parent"
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
    }
});

$prev.on("click", function () {

    let value = $slider.slider("option", "value");
    if (value - 1 >= 0) {

        $slider.slider("option", "value", value - 1);
    }
});

$next.on("click", function () {

    let value = $slider.slider("option", "value");
    if (value + 1 <= maxPage) {

        $slider.slider("option", "value", value + 1);
    }
});

/* SEARCH */
$search_btn.on("click", function (e) {

    e.preventDefault();

    let q = $('#q').val().toLowerCase();

    if (q.length > 0) {

        idx = 0;
        resultName = [];
        resultDict = [];

        animations.forEach(raw => {

            let names = [];

            if (raw.length < 2) {
                return
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
        });

        maxPage = Math.floor(resultName.length / itemsPerPage);
        $slider.slider("option", "max", maxPage);
        $slider.slider("option", "value", 0);

        updatePageInfo(0);
        render(0);
    }
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
    $pages.html(`page: ${ currentPage } / ${ maxPage }`);
}

function render(start) {

    let dictId = -1;
    let out = '';

    let requiredItems = start + itemsPerPage;
    let maxItems = resultName.length;

    requiredItems = requiredItems > maxItems ? maxItems : requiredItems;
    start = start > maxItems ? maxItems : start;

    for (let i = start; i < requiredItems; i++) {

        if (resultName[i][0] !== dictId) {

            dictId = resultName[i][0];
            let dict = resultDict[dictId];

            out += `</ul>\n`;
            out += `<p>${dict[0]} <span class="details">show: ${dict[2]} / ${dict[1]}</span></p>\n`;
            out += `<ul data-dict="${dict[0]}">\n`;
        }

        out += `<li>${resultName[i][1]}</li>\n`;
    }

    $container.html(`<ul>${out}</ul>`);
    $container.animate({scrollTop: 0}, "slow");

    $("li").on("click", function () {

        let dict = this.parentNode.dataset.dict;
        let name = this.innerText;

        $("li").removeClass('active');
        $(this).addClass('active');

        copyToClipboard((`dict = '${dict}', name = '${name}'`));
        $.post(`https://${resourceName}/playAnim`, JSON.stringify({
            dict: dict,
            name: name
        }), response => {
            renderMessage(response);
        });
    });
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
        return
    }

    dictArray[idx] = [raw[0], sumNameLength, sumNameLength];

    for (let i = 1; i < raw.length; i++) {
        nameArray.push([idx, raw[i]])
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
