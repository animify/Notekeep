$(() => {
	$('.dropdown').dropdown()
	$('#newnotekeep').bind('click', () => {
		$.ajax({
			url: "/facets/endpoints/newnotekeep",
			type: "POST",
			contentType: 'application/json',
			success: (data) => {
				JSON.stringify(data)
				if (data.statusCode == 200)
					window.location.replace("/dashboard")
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
					window.location.replace("/dashboard")
			}
		})
	})

	$('#signin').click(() => {
		let data = {}
		data.username = $('#username').val()
		data.password = $('#password').val()
		console.log(data);
		$.ajax({
			url: "/signin",
			type: "POST",
			contentType: 'application/json',
			data: JSON.stringify(data),
			success: (data) => {
				if (data.statusCode == 200)
					window.location.replace("/dashboard")
			}
		})
	})
})
