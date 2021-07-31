let listLength = 1000;
let timeDiv = 0;
let animationList = [];
let sBtn, rBtn, qInput, qString, qHl;

function createLink(data) {

    let a = $(document.createElement('a'));

    a.attr('data-start', data.start);
    a.attr('href', '#');
    a.html(data.text);

    return a;
}

function createPageLinks() {

    let btnContainer = $(".pageLinkContainer");
    btnContainer.empty();

    let animationListLength = animationList.length;


    for (let i = 0; i < animationListLength; i = i + listLength) {

        let link = createLink({
            start: i,
            text: i + ' - ' + (i + (listLength - 1)),
        });

        link.click(function () {

            btnContainer.find('a').removeClass('active');
            $(this).addClass('active');
            lister(this.getAttribute('data-start') * 1);
            return false;
        });

        btnContainer.append(link);
    }
}

function lister(start) {

    let out = '';
    let row = '';

    let idx = (start === undefined) ? 0 : start;

    idx = idx * 1;

    let listEnd = idx + listLength;


    if (animationList.length < listEnd) {

        listEnd = animationList.length;
    }


    for (idx; idx < listEnd; idx++) {

        row = animationList[idx];

        out += "<p>" + row[0] + "</p>";
        out += "<ul data-lib='" + row[0] + "'>";

        for (let z = 1; z < row.length; z++) {

            qHl = '';

            if (typeof qString === 'string' && qString.length > 0 && finder(row[z])) {

                qHl = ' class = "qHl" '

            }

            out += "<li" + qHl + ">" + row[z] + "</li>\n";
        }

        out += "</ul>";
    }


    $('#list').html(out);

    $("li").click(function () {

        let lib = this.parentNode.dataset.lib;
        let anim = this.innerText;

        copyToClipboard(("lib = '" + lib + "', anim = '" + anim + "'"));

        $.post('https://eco_anim/playAnim', JSON.stringify({
            lib: lib,
            anim: anim
        }));
    });
}

function finder(str) {

    return str.includes(qString);
}

// Listen for NUI Events
window.addEventListener('message', function (event) {

    let item = event.data;

    if (item.subject === 'OPEN') {

        $('#wrapper').css("display", "grid");

        timeDiv = $('#timeDiv');
        sBtn = $('#sBtn');
        rBtn = $('#rBtn');
        qInput = $('#qInput');
        animationList = animations;

        createPageLinks();
        lister();

        sBtn.click(function () {

            if (qInput.val().length > 0) {

                qString = qInput.val().toLowerCase();
                animationList = animations.filter(s => s.find(finder));

                createPageLinks();
                lister();
            }

        });

        rBtn.click(function () {

            animationList = animations;
            qInput.val('');

            createPageLinks();
            lister();
        });


    } else if (item.subject === 'TIME') {

        timeDiv.html(item.time);
    }

});

$(document).keyup(function (key) {

    if (key.which === 27) {

        $.post('https://eco_anim/exit', JSON.stringify({}));
    }
});


$('form').on('keyup keypress', function(e) {

    let keyCode = e.keyCode || e.which;

    if (keyCode === 13) {
        e.preventDefault();
        return false;
    }
});


$('.btnClose').click(function () {

    $('#wrapper').css("display", "none");
    $.post('https://eco_anim/exit', JSON.stringify({
        off: true
    }));
});

function copyToClipboard(string) {
    let $temp = $("<input>");
    $("body").append($temp);
    $temp.val(string).select();
    document.execCommand("copy");
    $temp.remove();
}

