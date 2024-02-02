fx_version 'cerulean'
game 'gta5'

author 'Ekhion'
description 'Animation Presentation'
version '2.0'

lua54 'yes'

shared_scripts {
    'common.lua',
    'config/*.lua',
}

client_scripts {
    'config/*.lua',
	'locales/*.lua',
	'client/class/*.lua',
    'client/main.lua'
}

server_scripts {
    'server/main.lua'
}

ui_page 'html/ui.html'

files {
    'database/*.*',
    'html/ui.html',
    'html/*.css',
    'html/templates/*.*',
    'html/js/class/*.js',
    'html/js/jquery-ui.js',
    'html/js/app.js',
}