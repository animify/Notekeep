let socket = io()

socket.on('connect', function(socket) {
	console.log('Socket connection')
})

_.mixin({
	isBlank: (string) => {
		return (_.isUndefined(string) || _.isNull(string) || string.trim().length === 0)
	}
})

let nk = {
	init: () => {
		$('.medium-editor-toolbar-save').html('<i class="material-icons">check</i>')
		$('.medium-editor-toolbar-close').html('<i class="material-icons">clear</i>')
		$('.unit', '#ls-teams').sort(team.sortAlpha).appendTo('#ls-teams')
	},
	resetEditor: () => {
		editor.resetContent()
		$('.note_headroom h3').text('')
		$('.editor h6.team').text('')
		$('.note_headroom p').find('span.type').removeClass('draft published').addClass('draft')
		$('publish').show()
	}
}

let errorHandler = {
	modal: (msg, title) => {
		if ($('.modal.active .error').is(':visible')) return

		let _oldheight = $(`.modal.active .content`).height()
		let _newheight = $(`.modal.active .content`).height() + 54

		$(`.modal.active .content`).animate({height: _newheight}, 300)
		.queue(function() {
			$(this).find('.error .why').text(msg).parent().show('slide', {direction: 'down'}, 300).parent().dequeue()
		})
		.delay(4000)
		.animate({height: _oldheight}, 300)
		.queue(function() {
			$(this).find('.error').hide('slide', {direction: 'down'}, 300).parent().dequeue()
		})

	}
}

let templates = {
	teams: $('#tpl-teams').html(),
	notes: $('#tpl-note').html(),
	editorStatus: $('#tpl-editor_status').html(),
	escape: (str) => {
		return str
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
	},
	unescape: (str) => {
		return str
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&amp;/g, '&')
	}
}

let endpoint = {
	call: (url, type, data, callback) => {
		$.ajax({
			url: url,
			type: type,
			data: data,
			contentType: 'application/json',
			success: (res) => {
				callback(res)
			}
		})
	}
}

let team = {
	selected: null,
	append: (res) => {
		let _team = {
			color: res.team.color,
			created: res.team.created_at,
			firstname: res.fn,
			lastname: res.ln,
			modified: res.team.modified_at,
			name: res.team.name,
			initial: res.team.name.substr(0,1),
			members: res.team.userlist.length + 1,
			_id: res.team._id
		}

		modal.close()
		let newTeam = _.template(templates.teams)(_team)
		$('.unit', '#ls-teams').add($(newTeam)).sort(team.sortAlpha).appendTo('#ls-teams')
		$('.unit.new').slideDown()
	},
	sortAlpha: (a,b) => {
		return $(a).find('.title a').text().toLowerCase().localeCompare($(b).find('.title a').text().toLowerCase())
	}
}

let editor = new MediumEditor('.note_content', {
	spellcheck: false,
	placeholder: {
		text: 'Start typing your note here',
		hideOnClick: true
	},
	toolbar: {
		allowMultiParagraphSelection: true,
		buttons: ['bold',
		'italic',
		'underline',
		'anchor',
		{
			name: 'h4',
			action: 'append-h4',
			aria: 'main heading',
			tagNames: ['h4'],
			contentDefault: '<b>H4</b>',
			classList: ['custom-class-h4'],
			attrs: {
				'data-custom-attr': 'attr-value-h4'
			}
		},
		{
			name: 'h5',
			action: 'append-h5',
			aria: 'sub heading',
			tagNames: ['h5'],
			contentDefault: '<b>H5</b>',
			classList: ['custom-class-h5'],
			attrs: {
				'data-custom-attr': 'attr-value-h5'
			}
		},
		'quote'],
		firstButtonClass: 'medium-editor-button-first',
		lastButtonClass: 'medium-editor-button-last',
		align: 'center',
		autoLink: true
	},
	anchor: {
	 placeholderText: 'Type a link'
	 }
})


let modal = {
	open: (modalID) => {
		$('body').addClass('noscroll')
		$(`#${modalID}`).addClass('active')
	},
	close: () => {
		$('body').removeClass('noscroll')
		$(`.modal`).removeClass('active')
	},
	openEditor: (teamSelect) => {
		if (teamSelect.private == 1) {
			team.selected = 0
			$('.editor h6.team').text('Private note')
		} else {
			team.selected = teamSelect.team[0]._id
			$('.editor h6.team').text(teamSelect.team[0].name)
		}

		$('body').addClass('noscroll')
		$('.editor').show('slide', {direction: 'left'}, 300)
	},
	editEditor: (info) => {
		(info.note.draft) ? $('.publish').show() : $('.publish').hide()
		$('.editor h6.team').text(info.team.name)

		$('.note_headroom h3').text(info.note.title)

		let editorStatus = _.template(templates.editorStatus)({firstname: info.note.owner.firstname, lastname: info.note.owner.lastname, status: (info.note.draft) ? 'draft' : 'published'})
		$('.note_headroom p').html($(editorStatus))

		editor.setContent(templates.unescape(info.note.content), 0)

		$('body').addClass('noscroll')
		$('.editor').show('slide', {direction: 'left'}, 300)
		socket.emit('note_join', {space: info.team._id})
	},
	closeEditor: () => {
		$('body').removeClass('noscroll')
		$('.editor').hide('slide', {direction: 'left'}, 300)
	}
}

$(() => {
	$('.dropdown').dropdown()

	$(document).bind('click', function(e) {
		if (! $(e.target).parents().hasClass('switches'))
			$('.switches.open').hide()
			$('.switches').removeClass('open')
	 }).on('keydown', function(e) {
		 e = e || window.event
		 let isEscape = false
		 if ("key" in e) {
			 isEscape = (e.key == "Escape" || e.key == "Esc")
		 } else {
			 isEscape = (e.keyCode == 27)
		 }
		 (isEscape) && modal.close()
	 }).bind('open:editor', function(e, teamid) {
		 if (teamid.private != 1) {
			 let _data = JSON.stringify(teamid)
			 endpoint.call(`/facets/endpoints/teams/find`, 'POST', _data, (res) => {
				 nk.resetEditor()
				 modal.openEditor(res)
			 })
		 } else {
			 nk.resetEditor()
			 modal.openEditor(teamid)
		 }
	 }).bind('saved:editor', function(e, msg) {
			modal.close()
	 })

	$('#signup').bind('click', function() {
		let data = {
			username: $('#username').val(),
			firstname: $('#firstname').val(),
			lastname: $('#lastname').val(),
			email: $('#email').val(),
			password: $('#password').val(),
			repassword: $('#repassword').val()
		}

		let _data = JSON.stringify(data)
		endpoint.call('/signup', 'POST', _data, (res) => {
			console.log(res);
			res.statusCode == 200 && window.location.replace("/")
		})
	})

	$('#signin').bind('click', () => {
		let data = {
			username: $('#username').val(),
			password: $('#password').val()
		}

		let _data = JSON.stringify(data)
		endpoint.call('/signin', 'POST', _data, (res) => {
			res.statusCode == 200 && window.location.replace("/")
		})
	})

	$('[data-modal="open"]').bind('click', function() {
		modal.open($(this).attr('data-modal-name'))
	})

	$('.modal .close, [data-modal="close"]').bind('click', function() {
		modal.close()
	})

	$('[data-run]').bind('click', function() {
		let _type = $(this).data('run')
		let _data = null
		switch (_type) {
			case 'new_team':
				let teamname = $('#input-new_team').val()
				if(_(teamname).isBlank()) return errorHandler.modal("You'll need to enter a name for the team to continue.")
				if(teamname.length < 6) return errorHandler.modal('A team name needs to be at least 6 characters long.')
				_data = JSON.stringify({name: teamname})
				endpoint.call('/facets/endpoints/teams/new', 'POST', _data, (res) => {
					res.error ? errorHandler.modal(res.message) : team.append(res)
				})
				break
			case 'publish_note':
				_data = JSON.stringify({title: $('.note_headroom h3').text(), content: templates.escape(editor.getContent()), plain: ($('.note_content').text()).substr(0,40), team: team.selected})
				endpoint.call('/facets/endpoints/notes/publish', 'POST', _data, (res) => {
					console.log(res);
					let errMsg = ''
					res.error ? errorHandler.modal(res.message[0].msg, res.message[0].param) : $(document).trigger('saved:editor')
				})
				break
			case 'get_note':
				_data = JSON.stringify({})
				endpoint.call(`/facets/endpoints/notes/get/${$(this).data('note')}`, 'GET', _data, (res) => {
					nk.resetEditor()
					modal.editEditor(res[0])
					let errMsg = ''
					res.error ? errorHandler.modal(res.message[0].msg, res.message[0].param) : $(document).trigger('saved:editor')
				})
				break
			case 'switch_note_mode':
				const newType = $(this).data('type')
				console.log(newType);
				_data = JSON.stringify({})
				endpoint.call(`/facets/endpoints/notes/retrieve/${newType}`, 'GET', _data, (res) => {
					let newNote = null
					$('.inner').empty()
					_.each(res, function(arr) {
						newNote = _.template(templates.notes)(arr)
						console.log(newNote);
						$('.inner').append($(newNote))
					})

					let errMsg = ''
					res.error ? errorHandler.modal(res.message[0].msg, res.message[0].param) : $(document).trigger('saved:editor')
				})
				break
			case 'invite_member':
				_data = JSON.stringify({user: $('#member-email').val(), team: $('.add').data('team')})
				endpoint.call('/facets/endpoints/teams/invite', 'POST', _data, (res) => {
					res.error ? errorHandler.modal(res.message) : console.log('done');
				})
				break
			case 'accept_invite':
				_data = JSON.stringify({team: $(this).parent().data('team')})
				endpoint.call('/facets/endpoints/invites/accept', 'POST', _data, (res) => {
					console.log(res);
					res.error ? errorHandler.modal(res.message) : console.log('done');
				})
				break
			case 'decline_invite':
				_data = JSON.stringify({team: $(this).parent().data('team')})
				endpoint.call('/facets/endpoints/invites/decline', 'POST', _data, (res) => {
					console.log(res);
					res.error ? errorHandler.modal(res.message) : console.log('done');
				})
				break
			case 'open_editor':
				nk.resetEditor()
				modal.openEditor()
				break
			case 'close_editor':
				modal.closeEditor()
				break
			default:
				console.error('Notekeep: Something went wrong')
		}
	})

	$('input').bind('click change', function() {
		if (!$(this).hasClass('error')) return

		$(this).removeClass('error')
	})

	$('.switch_trigger').bind('click', function(e) {
		e.preventDefault()
		console.log('a', `.${$(this).data('switch')}`);
		$(`#${$(this).data('switch')}`).slideDown(300, () => $(`#${$(this).data('switch')}`).addClass('open'))
	})

	$('.switches#switch_note .switch').bind('click', function(e) {
		const selectedName = $(this).find('b').text()
		$('#notes h4.what span').text(selectedName)
		$('.switches').hide()
	})

	$('.switches#switch_teams .switch').bind('click', function(e) {
		$('.switches').hide()
		$('.switches').removeClass('open')
		if ($(this).data('teamid') != 0) {
			$(document).trigger('open:editor', [{private: 0, team: $(this).data('teamid')}])
		} else {
			$(document).trigger('open:editor', [{private: 1}])
		}
	})

	$('#settings .item a').bind('click', function(e) {
		$('#settings .item').removeClass('active')
		$(this).parent().addClass('active')
		$('#settings .section').hide()
		$('.switches').removeClass('open')
		$(`#${$(this).parent().data('target')}`).show()
	})

	$('.note_headroom h3[contenteditable]').on('paste',function(e) {
		e.preventDefault()
		let plain_text = (e.originalEvent || e).clipboardData.getData('text/plain')
		if(typeof plain_text !== undefined){
			document.execCommand('insertText', false, plain_text)
		}
	})

	nk.init()
})
