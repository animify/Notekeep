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
			closeModal()
		}
	}

	$('#in_newnote').bind('click', () => {
		$('.notes .fit').prepend(`
			<div class="note open new">
				<h3>New note</h3>
				<p>Write something inspiring</p>
				<small>A few seconds ago</small>
			</div>
		`)
		$('.note.new').slideDown('fast')
	})

	$('#newnotekeep').bind('click', () => {
		$.ajax({
			url: "/facets/endpoints/notes/new",
			type: "POST",
			contentType: 'application/json',
			success: (data) => {
				JSON.stringify(data)
				if (data.statusCode == 200)
					window.location.replace("/")
			}
		})
	})

	$('#signup').bind('click', function() {
		let data = {}
		data.username = $('#username').val()
		data.firstname = $('#firstname').val()
		data.lastname = $('#lastname').val()
		data.email = $('#email').val()
		data.password = $('#password').val()
		data.repassword = $('#repassword').val()
		$.ajax({
			url: "/signup",
			type: "POST",
			contentType: 'application/json',
			data: JSON.stringify(data),
			success: (data) => {
				if (data.statusCode == 200)
					window.location.replace("/")
			}
		})
	})

	$('#signin').bind('click', () => {
		let data = {}
		data.username = $('#username').val()
		data.password = $('#password').val()
		console.log(data)
		$.ajax({
			url: "/signin",
			type: "POST",
			contentType: 'application/json',
			data: JSON.stringify(data),
			success: (data) => {
				if (data.statusCode == 200)
					window.location.replace("/")
			}
		})
	})

	$('[data-modal="open"]').bind('click', function() {
		openModal($(this).attr('data-modal-name'))
	})

	openModal = (modalID) => {
		$(`#${modalID}`).addClass('active')
	}

	closeModal = (modalID) => {
		$(`.modal`).removeClass('active')
	}
})
