$(() => {
	$('#newnotekeep').bind('click', () => {
		$.ajax({
			url: "/facets/endpoints/newnotekeep",
			type: "POST",
			contentType: 'application/json',
			success: function(data) {
				JSON.stringify(data)
				console.log(data)
				if (data.status == "OK")
					window.location.replace("/account")
			}
		})
	})

	$('#signup').bind('click', function() {
		var data = {}
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
			success: function(data) {
				JSON.stringify(data)
				if (data.status == "OK")
					window.location.replace("/account")
			}
		})
	})

	$('#signin').click(() => {
		var data = {}
		data.username = $('#username').val()
		data.password = $('#password').val()
		$.ajax({
			url: "/signin",
			type: "POST",
			contentType: 'application/json',
			data: JSON.stringify(data),
			success: function(data) {
				JSON.stringify(data)
				if (data.status == "OK")
					window.location.replace("/account")
			}
		})
	})


})
