(function (App) {
	'use strict';

	var _this,
        formatMagnet;

	var FileSelector = Backbone.Marionette.ItemView.extend({
		template: '#file-selector-tpl',
		className: 'file-selector',

		events: {
			'click .close-icon': 'closeSelector',
			'click .file-item': 'startStreaming',
            'click .store-torrent': 'storeTorrent'
		},

		initialize: function () {
			_this = this;
            
            formatMagnet = function (link) {
                // format magnet with Display Name
                try {
                    var index = link.indexOf('\&dn=') + 4, // keep display name
                        _link = link.substring(index); // remove everything before dn
                    _link = _link.split('\&'); // array of strings starting with &
                    _link = _link[0]; // keep only the first (i.e: display name)
                    link = _link.replace(/\+/g,'.') // replace + by .
                    return link;
                } catch (err) {
                    win.error('This magnet lacks Display Name, it cannot be stored');
                    return;
                }
            }
		},

		onShow: function () {
			App.Device.ChooserView('#player-chooser2').render();
			this.$('#watch-now').text('');
            this.isTorrentStored();

			Mousetrap.bind(['esc', 'backspace'], function (e) {
				_this.closeSelector(e);
			});
		},


		startStreaming: function (e) {
			var torrent = _this.model.get('torrent');
			var file = parseInt($(e.currentTarget).attr('data-file'));
			var actualIndex = parseInt($(e.currentTarget).attr('data-index'));
			torrent.name = torrent.files[file].name;

			var torrentStart = new Backbone.Model({
				torrent: torrent,
				torrent_read: true,
				file_index: actualIndex
			});
			App.vent.trigger('stream:start', torrentStart);
			App.vent.trigger('system:closeFileSelector');
		},
        
        isTorrentStored: function () {
            var target = require('nw.gui').App.dataPath + '/TorrentCollection/';
			if (!Settings.droppedTorrent && !Settings.droppedMagnet) { // bypass errors
				$('.store-torrent').hide();
				return false;
			}

            if (Settings.droppedTorrent) {
                var file = Settings.droppedTorrent;
            } else if (Settings.droppedMagnet) {
                var _file = Settings.droppedMagnet,
                    file = formatMagnet(_file);
            }
            
            // check if torrent stored
            if (!fs.existsSync(target + file)) {
                $('.store-torrent').text(i18n.__('Store this torrent'));
                return false;
            } else {
                $('.store-torrent').text(i18n.__('Remove this torrent'));
                return true;
            }
        },

        storeTorrent: function () {
            var source = App.settings.tmpLocation + '/',
                target = require('nw.gui').App.dataPath + '/TorrentCollection/';

            if (Settings.droppedTorrent) {
                var file = Settings.droppedTorrent;

                if (this.isTorrentStored()) {
                    fs.unlinkSync(target + file); // remove the torrent
                } else {
                    if (!fs.existsSync(target)) fs.mkdir(target); // create directory if needed
                    fs.writeFileSync(target + file, fs.readFileSync(source + file)); // save torrent 
                }
            } else if (Settings.droppedMagnet) {
                var _file = Settings.droppedMagnet,
                    file = formatMagnet(_file);
                
                if (this.isTorrentStored()) {
                    fs.unlinkSync(target + file); // remove the magnet
                } else {
                    if (!fs.existsSync(target)) fs.mkdir(target); // create directory if needed
                    fs.writeFileSync(target + file, _file); // save magnet link inside readable file
                }
            }
            this.isTorrentStored(); // trigger button change
        },

		closeSelector: function (e) {
			Mousetrap.bind('backspace', function (e) {
				App.vent.trigger('show:closeDetail');
				App.vent.trigger('movie:closeDetail');
			});
			$('.filter-bar').show();
			$('#header').removeClass('header-shadow');
			$('#movie-detail').show();
			App.vent.trigger('system:closeFileSelector');
		},

		onClose: function () {
			Settings.droppedTorrent = false;
			Settings.droppedMagnet = false;
		},

	});

	App.View.FileSelector = FileSelector;
})(window.App);
