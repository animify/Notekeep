$(() => {
	$('.dropdown').dropdown()

	document.onkeydown = function(evt) {
		evt = evt || window.event
		let isEscape = false
		if ("key" in evt) {
			isEscape = (evt.key == "Escape" || evt.key == "Esc")
		} else {
			isEscape = (evt.keyCode == 27)
		}
		if (isEscape) {
			modal.close()
		}
	}

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

	$('.modal .close').bind('click', function() {
		modal.close()
	})

	$('[data-run]').bind('click', function() {
		let _type = $(this).data('run')

		switch (_type) {
			case 'new_team':
				let teamname = $('#input-new_team').val()
				if(teamname.length < 6) return errorHandler.modal('A team name needs to be at least 6 characters long.')
				let _data = JSON.stringify({name: teamname})
				endpoint.call('/facets/endpoints/teams/new', 'POST', _data, (res) => {
					res.error ? errorHandler.modal(res.message) : teams.append(res)
				})
				break
			default:
				console.error('Notekeep: Something went wrong')
		}
	})

	$('input').bind('click change', function() {
		if (!$(this).hasClass('error')) return

		$(this).removeClass('error')
	})
})

let errorHandler = {
	modal: (msg) => {
		let _oldheight = $(`.modal .content`).height()
		let _newheight = $(`.modal .content`).height() + 53
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

let teams = {
	append: (res) => {
		let _team = {
			color: res.color,
			created: res.created_at,
			creator: res.creator,
			modified: res.modified_at,
			name: res.name
		}
	}
}

let modal = {
	open: (modalID) => {
		$('body').addClass('noscroll')
		$(`#${modalID}`).addClass('active')
	},
	close: () => {
		$('body').removeClass('noscroll')
		$(`.modal`).removeClass('active')
	}
}
