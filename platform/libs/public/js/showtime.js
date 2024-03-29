let socket = io()

_.mixin({
	isBlank: (string) => {
		return (_.isUndefined(string) || _.isNull(string) || string.trim().length === 0)
	}
})

let priority = {
	label: {
		0: 'Low priority',
		1: 'Medium priority',
		2: 'High priority'
	},
	classes: {
		0: 'text-green',
		1: 'text-yellow',
		2: 'text-red'
	}
}

let nk = {
	init: () => {
		$('.medium-editor-toolbar-save').html('<i class="material-icons">check</i>')
		$('.medium-editor-toolbar-close').html('<i class="material-icons">clear</i>')
		$('.unit', '#ls-groups').sort(group.sortAlpha).appendTo('#ls-groups')

		if ($('.populate[data-populate="populate_activity"]').length)
			activities.group($('.populate[data-populate="populate_activity"]').data('group'))

		if ($('#activities_list').length)
			activities.all()

		if ($('#recent_activity').length)
			activities.recent()

		if ($('#all_sessions').length)
			sessions.all()

		if($('.open__selected').length) {
			history.replaceState({notes:null}, "Notes - Notekeep", "/notes");
			$('.open__selected').trigger("click")
		}

	},
	resetEditor: () => {
		editor.resetContent()
		$('.publish, .create_link').show()
		$('.priority, .toggle_comments, .share, .copy_link, .delete_note').hide()
		$('.note_headroom h3').text('')
		$('.editor h6.group').text('')
		$('.note_headroom p').find('span.user').text(`${accountHash.firstname} ${accountHash.lastname}`)
		$('.note_headroom p').find('span.type').removeClass('draft published').addClass('draft')
		$('.editor .priority a.toggle').attr('data-status', 0).html(`<i class="material-icons ${priority.classes[0]}">lens</i> ${priority.label[0]}`)
	}
}

let errorHandler = {
	modal: (msg, title) => {
		if (title) return iziToast.error({title: title, message: msg})
		iziToast.error({message: msg})
	}
}

let comments = {
	new: () => {
		_data = JSON.stringify({group: group.viewing, note: group.viewingNote, content: $('#comment_new').text()})
		endpoint.call(`/facets/endpoints/comments/new`, 'POST', _data, (res) => {
			if (res.error) return errorHandler.modal(res.message[0].msg, res.message[0].param)
			res.created = moment(res.created).fromNow()
			newComment = _.template(templates.comments_compact)(res)
			$('.comments_display').prepend($(newComment))
			$('.comment.new').slideDown('fast')
			jdenticon.update('.comments-avatar')
			socket.emit('note-new_comment', res._id)
		})
	},
	forNote: () => {
		_data = JSON.stringify({group: group.viewing, note: group.viewingNote})
		endpoint.call(`/facets/endpoints/comments/get`, 'POST', _data, (res) => {
			_.each(res, (comm) => comm.created = moment(comm.created).fromNow())
			acts = _.template(templates.build_comments)({comments: res})
			$('.comments_display').empty().append($(acts))
			jdenticon.update(".comments-avatar")
			let errMsg = ''
			res.error ? errorHandler.modal(res.message[0].msg, res.message[0].param) : $(document).trigger('saved:editor')
		})
	}
}

let templates = {
	groupsFromEmpty: $('#tpl-group_fromempty').html(),
	groups: $('#tpl-groups').html(),
	session: $('#tpl-session').html(),
	newNoteGroup: $('#tpl-new_notegroup').html(),
	notes: $('#tpl-note').html(),
	notes_private: $('#tpl-notes_private').html(),
	editorStatus: $('#tpl-editor_status').html(),
	publishedNote: $('#tpl-note_created').html(),
	build_activities: $('#tpl-build_activities').html(),
	build_comments: $('#tpl-build_comments').html(),
	comments_compact: $('#tpl-comments_compact').html(),
	act_create_note: $('#tpl-act-create_note').html(),
	act_delete_note: $('#tpl-act-delete_note').html(),
	act_sent_invite: $('#tpl-act-sent_invite').html(),
	act_declined_invite: $('#tpl-act-declined_invite').html(),
	act_accepted_invite: $('#tpl-act-accepted_invite').html(),
	act_empty: $('#tpl-act-empty').html(),
	act_none: $('#tpl-act-none').html(),
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

const endpoint = {
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

let sessions = {
	all: () => {
		_data = JSON.stringify()
		endpoint.call('/facets/endpoints/account/sessions', 'GET', _data, (res) => {
			if (res.length < 1) {
				emptyActivities = _.template(templates.act_empty)({})
				$('.populate .xs-12').append($(emptyActivities))
			} else {
				_.each(res, (session) => {
					sessionItem = _.template(templates.session)(session)
					$('.sessions').append($(sessionItem))
				})
				Tooltip.init()
			}
		})
	}
}

let activities = {
	group: (id) => {
		_data = JSON.stringify({group: id})
		endpoint.call('/facets/endpoints/activities/group', 'POST', _data, (res) => {
			if (res.length < 1) {
				emptyActivities = _.template(templates.act_empty)({})
				$('.populate .xs-12').append($(emptyActivities))
			} else {
				_.each(res, function(story) {
					story.created = moment(story.created).fromNow()
					newStory = _.template(eval(`templates.act_${story.type}`))(story)
					$('.populate .xs-12').append($(newStory))
				})
			}
		})
	},
	all: (filter) => {
		_data = JSON.stringify({})
		endpoint.call('/facets/endpoints/activities/all', 'GET', _data, (res) => {

			if (_.isEmpty(res))
				return $('#activities_list').next().addClass('shown')
			else
				$('#activities_list').next().removeClass('shown')

			const acts = _.template(templates.build_activities)({dates: Object.getOwnPropertyNames(res).reverse()})
			$('#activities_list').empty().append($(acts))

			_.each(res, function(stories, i) {
				stories.sort((a,b) => {
					if (a.created < b.created) return 1
				})
				_.each(stories, function(story) {
					if (!filter || (filter && filter == story.type)) {
						story.created = moment(story.created).fromNow()
						newStory = _.template(eval(`templates.act_${story.type}`))(story)
						$(`[data-timeline='${i}']`).append($(newStory))
					}
				})
				if (!$(`[data-timeline='${i}'] .act_none`).length && !$(`[data-timeline='${i}'] .unit`).length) {
					actNone = _.template(templates.act_none)()
					$(`[data-timeline='${i}']`).append($(actNone))
				}
			})
		})
	},
	recent: (filter) => {
		_data = JSON.stringify({})
		endpoint.call('/facets/endpoints/activities/all/true', 'GET', _data, (stories) => {
			if (_.isEmpty(stories))
				return $('.summary.empty_activity').show()
			else
				$('.summary.has_activity').show()

			_.each(stories.recent, function(story) {
				if (!filter || (filter && filter == story.type)) {
					story.created = moment(story.created).fromNow()
					newStory = _.template(eval(`templates.act_${story.type}`))(story)
					$(`#recent_activity`).append($(newStory))
				}
			})
		})
	}
}

let group = {
	selected: null,
	viewing: null,
	viewingNote: null,
	append: (res) => {
		let _group = {
			color: res.group.color,
			created: res.group.created_at,
			firstname: res.fn,
			lastname: res.ln,
			modified: res.group.modified_at,
			name: res.group.name,
			initial: res.group.name.substr(0,1),
			members: res.group.userlist.length + 1,
			_id: res.group._id
		}

		modal.close()
		if ($('.groups.owned').length) {
			let newGroup = _.template(templates.groups)(_group)
			$('.groups.owned .grid-row').add($(newGroup)).sort(group.sortAlpha).appendTo('.groups.owned .grid-row')
			$('.group.new').slideDown('fast')
		} else {
			let newGroup = _.template(templates.groupsFromEmpty)(_group)
			$('#groups').empty().append($(newGroup))
			$('.group.new').slideDown('fast')
		}
	},
	sortAlpha: (a,b) => {
		return $(a).find('h6').text().toLowerCase().localeCompare($(b).find('h6').text().toLowerCase())
	}
}

let editor = new MediumEditor('.note_content', {
	spellcheck: false,
	placeholder: {
		text: 'Start typing your note here',
		hideOnClick: true
	},
	keyboardCommands: {
		commands: [
			{
				command: 'append-h4',
				key: '1',
				meta: true,
				shift: false,
				alt: true
			},
			{
				command: 'append-h5',
				key: '2',
				meta: true,
				shift: false,
				alt: true
			}
		],
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
			contentDefault: '<b>H1</b>',
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
			contentDefault: '<b>H2</b>',
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
	commentsClose: (_ele) => {
		$('.note_container').stop().animate({
			marginLeft: 0
		}, 300)
		$('.comments').hide('slide', {direction: 'right'}, 300,
		() => {
			$('[data-run="toggle_comments"]').removeClass('closed open').addClass('closed')
			$('[data-run="toggle_comments"]').find('i').text('first_page')
		})
	},
	commentsOpen: (_ele) => {
		$('.comments').show('slide', {direction: 'right'}, 300,
		() => {
			$('[data-run="toggle_comments"]').removeClass('closed open').addClass('open')
			$('[data-run="toggle_comments"]').find('i').text('last_page')
		})
		$('.note_container').stop().animate({
			marginLeft: -Math.abs($('.comments').outerWidth())
		}, 300)
	},
	open: (modalID) => {
		$('body, .wrap').addClass('noscroll')
		$(`#${modalID}`).addClass('active')
	},
	close: () => {
		$('body, .wrap').removeClass('noscroll')
		$(`.modal`).removeClass('active')
	},
	openEditor: (groupSelect) => {
		$('.copy_link, .create_link, .delete_note').hide()

		if (groupSelect.private == 1) {
			group.selected = 0
			$('.editor h6.group').text('Private note')
		} else {
			group.selected = groupSelect.group[0]._id
			$('.editor h6.group').text(groupSelect.group[0].name)
		}
		$('body, .wrap').addClass('noscroll')
		$('.comments').hide()
		$('.editor').show('slide', {direction: 'left'}, 300)

		jdenticon.update("#note-avatar", accountHash.avatar.toString())
	},
	editEditor: (info) => {
		if (info.note.draft) {
			$('.publish').show()
			$('.priority, .toggle_comments, .delete_note, .share').hide()
		} else {
			$('.publish').hide()
			$('.priority, .toggle_comments, .delete_note, .share').show()
		}

		if (!info.note.shared) {
			$('.copy_link').hide()
			$('.create_link').show()
		} else {
			$('.create_link').hide()
			$('.copy_link').show()
			$('#shared_url').val(`${$(location).attr('protocol')}//${$(location).attr('host')}/shard/${info.group._id}/${info.note._id}`)
		}

		(info.note.private) ? $('.editor h6.group').text('Private note') : $('.editor h6.group').text(info.group.name)
		$('.note_headroom h3').text(info.note.title)

		let editorStatus = _.template(templates.editorStatus)({firstname: info.note.owner.firstname, lastname: info.note.owner.lastname, status: (info.note.draft) ? 'draft' : 'published'})

		info.note.status == undefined ? $('.editor .priority a.toggle').attr('data-status', 0).html(`<i class="material-icons ${priority.classes[0]}">lens</i> ${priority.label[0]}`) : $('.editor .priority a.toggle').attr('data-status', info.note.status).html(`<i class="material-icons ${priority.classes[info.note.status]}">lens</i> ${priority.label[info.note.status]}`)

		comments.forNote()

		$('.note_headroom p').html($(editorStatus))
		editor.setContent(templates.unescape(info.note.content), 0)

		transform.oldHTML = editor.getContent()

		$('body, .wrap').addClass('noscroll')
		$('.editor').show('slide', {direction: 'left'}, 300, () => {

			$('.comments').show('slide', {direction: 'right'}, 300)
			$('.note_container').animate({
				marginLeft: -Math.abs($('.comments').outerWidth())
			}, 300)
			jdenticon.update(".comments-avatar")
		})

		jdenticon.update("#note-avatar", info.note.owner.avatar.toString())

		if (!info.note.private)
			socket.emit('group_join', {group: info.group._id, note: info.note._id})

	},
	closeEditor: () => {
		$('body, .wrap').removeClass('noscroll')
		group.viewing = null
		group.viewingNote = null
		$('.editor').hide('slide', {direction: 'left'}, 300, () => {
			$('.note_container').css({marginLeft: 0})
			$('.comments').hide()
		})
	}
}

let transform = {
	oldHTML: null,
	removeFromRange: (chg) => {
		let c = editor.getContent()
		chg.reverse()
		chg.forEach((typ) => {
			a = typ.frag.from
			b = typ.frag.from + typ.frag.count
			c = c.substring(0, a) + c.substring(b)
		})
		console.log(c);
		editor.setContent(c)
	},
replaceChange: (chg) => {
	let c = editor.getContent()

	chg.forEach((frag) => {
		if (frag.removed)
			c = c.substr(0, frag.from) + c.substr(frag.from + frag.count)

		if (frag.added)
			c = c.substr(0, frag.from) + frag.value + c.substr(frag.from)
	})
	transform.oldHTML = c
	editor.setContent(c)
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
	 }).bind('open:editor', function(e, groupid) {
		 if (groupid.private != 1) {
			 let _data = JSON.stringify(groupid)
			 endpoint.call(`/facets/endpoints/groups/find`, 'POST', _data, (res) => {
				 nk.resetEditor()
				 modal.openEditor(res)
			 })
		 } else {
			 nk.resetEditor()
			 modal.openEditor(groupid)
		 }
	 }).bind('saved:editor', function(e, msg) {

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

	$('body').on('click', '[data-run]', function(e) {
		let _this = $(e.currentTarget)
		let _type = _this.data('run')
		let _data = null
		switch (_type) {
			case 'new_group':
				let groupname = $('#input-new_group').val()
				if(_(groupname).isBlank()) return errorHandler.modal("You'll need to enter a name for the group to continue.")
				if(groupname.length < 6) return errorHandler.modal('A group name needs to be at least 6 characters long.')
				_data = JSON.stringify({name: groupname})
				endpoint.call('/facets/endpoints/groups/new', 'POST', _data, (res) => {
					res.error ? errorHandler.modal(res.message) : group.append(res)
				})
				break
			case 'publish_note':
				_data = JSON.stringify({title: $('.note_headroom h3').text(), content: templates.escape(editor.getContent()), plain: ($('.note_content').text()).substr(0,40), group: group.selected})
				endpoint.call('/facets/endpoints/notes/publish', 'POST', _data, (res) => {
					if (res.error) return errorHandler.modal(res.message[0].msg, res.message[0].param)
					modal.close()
					if ($(`[data-group_section=${res.Message.group._id}]`).length == 0) {
						newGroup = _.template(templates.newNoteGroup)(res.Message.group)
						$(`#summary_notes`).append(newGroup)
					}
					publishedNote = _.template(templates.publishedNote)(res.Message)
					$(`[data-group_section=${res.Message.group._id}] .all_notes`).append($(publishedNote))
					$(`[data-note=${res.Message._id}]`).trigger("click")
				})
				break
			case 'get_note':
				_data = JSON.stringify({})
				endpoint.call(`/facets/endpoints/notes/get/${_this.data('note')}`, 'GET', _data, (res) => {
					if (!res[0].note.private) group.viewing = res[0].group._id
					group.viewingNote = res[0].note._id
					nk.resetEditor()
					modal.editEditor(res[0])
					let errMsg = ''
					res.error ? errorHandler.modal(res.message[0].msg, res.message[0].param) : $(document).trigger('saved:editor')
				})
				break
			case 'new_comment':

				break
			case 'delete_note':
				_data = JSON.stringify({group: group.viewing, note: group.viewingNote})
				endpoint.call(`/facets/endpoints/notes/delete`, 'POST', _data, (res) => {
					if (res) {
						const noteEl = $(`[data-note="${group.viewingNote}"]`)
						if (!(noteEl.parent().children('.unit').length > 1)) noteEl.parent().closest('.summary').remove()
						noteEl.remove()
						modal.close()
						modal.closeEditor()
						return
					}
					let errMsg = ''
					res.error ? errorHandler.modal(res.message[0].msg, res.message[0].param) : $(document).trigger('saved:editor')
				})
				break
			case 'switch_note_mode':
				const newType = _this.data('type')
				_data = JSON.stringify({})
				endpoint.call(`/facets/endpoints/notes/retrieve/${newType}`, 'GET', _data, (res) => {
					console.log(res);
					
					let newNote = null
					noteSection = _.template(eval(`templates.notes_${newType}`))({})
					$('#summary_notes .summary').remove()
					$('#summary_notes').append($(noteSection))

					_.each(res, function(arr) {
						newNote = _.template(templates.notes)(arr)
						$('.all_notes').append($(newNote))
					})

					let errMsg = ''
					res.error ? errorHandler.modal(res.message[0].msg, res.message[0].param) : $(document).trigger('saved:editor')
				})
				break
			case 'chg_priority':
				_data = JSON.stringify({group: group.viewing, note: group.viewingNote, status: _this.data('status')})
				endpoint.call('/facets/endpoints/notes/status', 'POST', _data, (res) => {
					if (res.err) return console.debug('Internal error when changing priority')
					$('.editor .priority a.toggle').attr('data-status', res.status).html(`<i class="material-icons ${priority.classes[res.status]}">lens</i> ${priority.label[res.status]}`)
				})
				break
			case 'invite_member':
				_data = JSON.stringify({user: $('#member-email').val(), group: $('.add').data('group')})
				endpoint.call('/facets/endpoints/groups/invite', 'POST', _data, (res) => {
					if (res.error) return errorHandler.modal(res.message)
					iziToast.success({title: "Invite sent", message: `Group invite sent to ${$('#member-email').val()}`})
					modal.close()
				})
				break
			case 'accept_invite':
				_data = JSON.stringify({group: _this.parent().data('group')})
				endpoint.call('/facets/endpoints/invites/accept', 'POST', _data, (res) => {
				})
				break
			case 'decline_invite':
				_data = JSON.stringify({group: _this.parent().data('group')})

				endpoint.call('/facets/endpoints/invites/decline', 'POST', _data, (res) => {
				})
				break
			case 'publicize_note':
				_data = JSON.stringify({group: group.viewing, note: group.viewingNote})
				endpoint.call('/facets/endpoints/notes/share', 'POST', _data, (res) => {
					if (res.error) {
						iziToast.error({title: "Already public", message: `This note is already public`})
					} else {
						iziToast.success({title: "Note publisized", message: `The note has been made public`})
						$('#shared_url').val(res)
						$('.create_link').hide()
						$('.copy_link').show()
						$('#input-shared_link').val(res).slideDown('fast').parent().next().hide()
					}
				})
				break
			case 'presentation_mode':
				modal.commentsClose()
				$('.editor, .shard').toggleClass("presentation")
				break
			case 'update_preferences':
				_data = JSON.stringify({firstname: $('#input_firstname').val(), lastname: $('#input_lastname').val(), email: $('#input_email').val()})
				endpoint.call('/facets/endpoints/account/update', 'POST', _data, (res) => {
					if (res.error) {
						iziToast.error({title: "Error updating", message: `${res.message[0].msg !== undefined ? res.message[0].msg : res.message}`})
					} else {
						iziToast.success({title: "Updated!", message: `Your profile details have been updated`})
						accountHash.email = _data.email
						accountHash.firstname = _data.firstname
						accountHash.lastname = _data.lastname
					}
				})
				break
			case 'email_note':
				_data = JSON.stringify({note: group.viewingNote, email: $('#recipient_note').val()})
				endpoint.call('/facets/endpoints/mail/note', 'POST', _data, (res) => {
					if (res.error) {
						iziToast.error({message: `${res.message[0].msg !== undefined ? res.message[0].msg : res.message}`})
					} else {
						iziToast.success({title: "Note sent", message: res.message})
						$('#recipient_note').val('')
						modal.close()
					}
				})
				break
			case 'copy_shared_link':
				const copyField = $('#hidden_copy')
				copyField.show()
				copyField.val(`${$(location).attr('protocol')}//${$(location).attr('host')}/shard/${group.viewing}/${group.viewingNote}`)
				copyField.select()
				try {
					document.execCommand('copy')
					iziToast.success({title: "Link copied", message: `Shared note link has been copied to your clipboard`})
				} catch(err) {
					iziToast.error({title: "Link copy error", message: `The link could not be copied to your clipboard`})
				}
				break
			case 'toggle_comments':
				if ($(this).hasClass('open')) {
					modal.commentsClose($(this))
				} else {
					modal.commentsOpen($(this))
				}
				break
			case 'open_editor':
				nk.resetEditor()
				modal.openEditor()
				break
			case 'close_editor':
				modal.closeEditor()
				break
		}
	})

	$('input.filter').bind('keyup', function() {
		const filterType = $(this).data('filter-type')
		const filterSearch = $(this).val().toLowerCase()

		switch (filterType) {
			case 'notes':

				$("#summary_notes .unit").each(function() {
					if ($(this).text().toLowerCase().indexOf(filterSearch) > -1) {

						$(this).show()

						if ($(this).parent().find('.unit:hidden').length > 0)
							$(this).closest('.summary').show()
					}
					else {
						$(this).hide()

						if ($(this).parent().find('.unit:visible').length == 0)
							$(this).closest('.summary').hide()
					}
				})

				if($('#summary_notes').children(':visible').length == 0) {
					$('#summary_notes').css({"padding": "0"})
					$('.empty_notes').show()
				} else {
					$('#summary_notes').css({"padding": "1.4em 0"})
					$('.empty_notes').hide()
				}

			break
			case 'groups':
				$("#groups .group").each(function() {
					if ($(this).find('h6').text().toLowerCase().indexOf(filterSearch) > -1) {
						$(this).show()
					} else {
						$(this).hide()
					}
				})
			break
		}
	})

	$('input').bind('click change', function() {
		if (!$(this).hasClass('error')) return

		$(this).removeClass('error')
	})

	$('.switch_trigger').bind('click', function(e) {
		e.preventDefault()
		$(`#${$(this).data('switch')}`).slideDown(300, () => $(`#${$(this).data('switch')}`).addClass('open'))
	})

	$('.switches .switch').bind('click', function(e) {
		$('.switches').hide()
		$('.switches').removeClass('open')
	})

	$('.switches#switch_note .switch').bind('click', function(e) {
		const selectedName = $(this).find('b').text()
		$('#notes h4.what span').text(selectedName)
	})

	$('.switches#switch_groups .switch').bind('click', function(e) {
		if ($(this).data('groupid') != 0) {
			$(document).trigger('open:editor', [{private: 0, group: $(this).data('groupid')}])
		} else {
			$(document).trigger('open:editor', [{private: 1}])
		}
	})

	$('.switches#switch_activities .switch').bind('click', function(e) {
		if ($(this).data('select') == "all") return activities.all()
		activities.all($(this).data('select'))
	})

	$('.selection .item a').bind('click', function(e) {
		$('.selection .item').removeClass('active')
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

	editor.subscribe('editableKeydownEnter', (e,v) => {
		console.log(e,v);
	})

	$('.sharing li').bind('click', function (e) {
		$('.sharing li').removeClass('active')
		$('.inside.sharing-tab').hide()
		$(this).addClass('active')
		$(`.sharing-${$(this).data('sharing')}`).show()
	})

	$('#comment_new').on('keydown', function (e) {
		if(e.keyCode == 13) {
			e.preventDefault()
			if($('#comment_new').text() == "") return
			comments.new()
			$('#comment_new').text('')
		}
	})

	$('.note_content').on('keydown keyup', function (event, editable) {
		pushChanges(event, editable)
	})

	$('.medium-editor-action, .medium-editor-toolbar-save, .medium-editor-toolbar-close').on('click', function (event, editable) {
		pushChanges(event, editable)
	})

	pushChanges = (event, editable) => {
		// console.time('Diff')
		if (_.isBlank(group.viewingNote)) return
		oldHTML = transform.oldHTML
		newHTML = editor.getContent()
		ld = 0
		arChange = {op: "+change", change: []}

		diff = JsDiff.diffWordsWithSpace(oldHTML, newHTML)
		diff.forEach(function(part){
			part.count = part.value.length
			part.from = ld
			if (part.added || part.removed) {
				if (part.removed) {
					ld = ld - part.count
				}
				arChange.change.push(part)
			}
			ld = ld + part.count
		})

		transform.oldHTML = newHTML

		socket.emit('change', arChange)
		socket.emit('preSave', { _id: group.viewingNote, body: newHTML, plain: $('.note_content').text()})
		// console.timeEnd('Diff')
	}

	socket.on('connect', (sock) => {
		console.debug('Notekeep: socket connection made')
	})
	.on('change', (chg) => {
		switch (chg.op) {
			case "+remove":
				transform.removeFromRange(chg.change)
				break
			case "+add":
				transform.addToPoint(chg.change)
				break
			case "+all":
				console.log(chg)
				transform.replaceAll(chg.change)
			case "+change":
				transform.replaceChange(chg.change)
				break
		}
	})
	.on('new_comment', (comment) => {
		comment.created = moment(comment.created).fromNow()
		newComment = _.template(templates.comments_compact)(comment)
		$('.comments_display').prepend($(newComment))
		$('.comment.new').slideDown('fast')
		jdenticon.update('.comments-avatar')
	})
})
