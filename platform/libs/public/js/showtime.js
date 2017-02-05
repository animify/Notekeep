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
	}
}

let errorHandler = {
	modal: (msg) => {
		let _oldheight = $(`.modal .content`).height()
		let _newheight = $(`.modal .content`).height() + 50
		$(`.modal .content`).animate({
			height: _newheight
		}, 300, () => {
			$(`.modal.active .error .why`).text(msg).parent().show('slide', {direction: 'down'}, 300)
			$(`.modal.active input`).delay(300).addClass('error').delay(4000).queue(function() {
				$(this).delay(300).removeClass('error').dequeue()
				$(`.modal.active .error`).show('slide', {direction: 'down'}, 300, () => {
					$(`.modal .content`).animate({
						height: _oldheight
					}, 300)
				})
			})
		})
	}
}

let templates = {
	teams: $('#tpl-teams').html()
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
	openEditor: (team) => {
		$('body').addClass('noscroll')
		$('.editor h6.team').text(team.team[0].name)
		$('.editor').show('slide', {direction: 'down'}, 300)
	},
	closeEditor: () => {
		$('body').removeClass('noscroll')
		$('.editor').hide('slide', {direction: 'down'}, 300)
	}
}

$(() => {
	$('.dropdown').dropdown()

	$(document).bind('click', function(e) {
		if (! $(e.target).parents().hasClass('switches'))
			$('.switches.open').hide()
			$('.switches').removeClass('open')
	 }).bind('onkeydown', function(e) {
		 e = e || window.event
		 let isEscape = false
		 if ("key" in e) {
			 isEscape = (e.key == "Escape" || e.key == "Esc")
		 } else {
			 isEscape = (e.keyCode == 27)
		 }
		 (isEscape) && modal.close()
	 }).bind('open:editor', function(e, teamid) {
		 let _data = JSON.stringify(teamid)
		 endpoint.call(`/facets/endpoints/teams/find`, 'POST', _data, (res) => {
			 console.log(res);
			 modal.openEditor(res)
		 })
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


	$('#newnotekeep').bind('click', () => {
		// let _data = JSON.stringify(data)
		// endpoint.call('/facets/endpoints/notes/new', 'POST', _data, (res) => {
			// res.statusCode == 200 && window.location.replace("/")
		// })
	})

	$('[data-modal="open"]').bind('click', function() {
		modal.open($(this).attr('data-modal-name'))
	})

	$('.modal .close, [data-modal="close"]').bind('click', function() {
		modal.close()
	})

	$('[data-run]').bind('click', function() {
		let _type = $(this).data('run')
		switch (_type) {
			case 'new_team':
				let teamname = $('#input-new_team').val()
				if(_(teamname).isBlank()) return errorHandler.modal("You'll need to enter a name for the team to continue.")
				if(teamname.length < 6) return errorHandler.modal('A team name needs to be at least 6 characters long.')
				let _data = JSON.stringify({name: teamname})
				endpoint.call('/facets/endpoints/teams/new', 'POST', _data, (res) => {
					res.error ? errorHandler.modal(res.message) : team.append(res)
				})
				break
			case 'open_editor':
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
		$(document).trigger('open:editor', [{team: $(this).data('teamid')}])
	})

	$('#settings .item a').bind('click', function(e) {
		$('#settings .item').removeClass('active')
		$(this).parent().addClass('active')
		$('#settings .section').hide()
		$('.switches').removeClass('open')
		$(`#${$(this).parent().data('target')}`).show()
	})

	nk.init()
})
