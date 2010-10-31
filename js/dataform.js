/*

Jappix - An open social platform
These are the dataform JS scripts for Jappix

-------------------------------------------------

License: AGPL
Author: Valérian Saliou
Contact: http://project.jappix.com/contact
Last revision: 30/10/10

*/

// Gets the defined dataform elements
function dataForm(host, type, node, action, target) {
	// Clean the current session
	cleanDataForm(target);
	
	// We tell the user that a search has been launched
	$('#' + target + ' .wait').show();
	
	// If we have enough data
	if(host && type) {
		// Generate a session ID (taken from JSJaC)
		var sessionID = Math.round(100000.5 + (((900000.49999) - (100000.5)) * Math.random()));
		var id = target + '-' + sessionID + '-' + genID();
		$('.' + target + '-results').attr('class', 'results ' + target + '-results ' + target + '-' + sessionID);
		
		// We request the service the form
		var iq = new JSJaCIQ();
		iq.setID(id);
		iq.setTo(host);
		iq.setType('get');
		
		// We create the appropriate XML nodes
		if(type == 'browse') {
			var iqQuery = iq.setQuery(NS_DISCO_ITEMS);
			
			if(node)
				iqQuery.setAttribute('node', node);
			
			con.send(iq, handleDataFormBrowse);
		}
		
		if(type == 'command') {
			var items;
			
			if(node)
				items = iq.appendNode('command', {'node': node, 'xmlns': NS_COMMANDS});
			
			else {
				items = iq.setQuery(NS_DISCO_ITEMS);
				items.setAttribute('node', NS_COMMANDS);
			}
			
			if(action && node) {
				iq.setType('set');
				items.setAttribute('action', action);
			}
			
			con.send(iq, handleDataFormCommand);
		}
		
		if(type == 'search') {
			iq.setQuery(NS_SEARCH);
			con.send(iq, handleDataFormSearch);
		}
		
		if(type == 'subscribe') {
			iq.setQuery(NS_REGISTER);
			con.send(iq, handleDataFormSubscribe);
		}
		
		if(type == 'join') {
			if(target == 'discovery')
				quitDiscovery();
			
			checkChatCreate(host, 'groupchat');
		}
	}
}

// Sends a given dataform
function sendDataForm(type, action, id, xid, node, sessionid, status, target) {
	// New IS
	var iq = new JSJaCIQ();
	iq.setTo(xid);
	iq.setType('set');
	
	// Set the correct query
	var query;
	
	if(type == 'subscribe')
		iqQuery = iq.setQuery(NS_REGISTER);
	else if(type == 'search')
		iqQuery = iq.setQuery(NS_SEARCH);
	else if(type == 'command')
		iqQuery = iq.appendNode('command', {'xmlns': NS_COMMANDS, 'node': node, 'sessionid': sessionid, 'status': status, 'action': action});
	
	// Build the XML document
	if(action != 'cancel') {
		// No X node
		if(exists('input.register-special') && type == 'subscribe') {
			$('input.register-special').each(function() {
				var iName = $(this).attr('name');
				var iValue = $(this).val();
				
				iqQuery.appendChild(iq.buildNode(iName, {'xmlns': NS_REGISTER}, iValue));
			});
		}
		
		// Can create the X node
		else {
			var iqX = iqQuery.appendChild(iq.buildNode('x', {'xmlns': NS_XDATA, 'type': action}));
			
			// Each input
			$('.' + id + ' .oneresult input, .' + id + ' .oneresult textarea, .' + id + ' .oneresult select').each(function() {
				// Get the current input value
				var iVar = $(this).attr('name');
				var iType = $(this).attr('data-type');
				var iValue = $(this).val();
				
				// Build a new XML node
				var field = iqX.appendChild(iq.buildNode('field', {'var': iVar, 'type': iType, 'xmlns': NS_XDATA}));
				field.appendChild(iq.buildNode('value', {'xmlns': NS_XDATA}, iValue));
			});
		}
	}
	
	// Clean the current session
	cleanDataForm(target);
	
	// Show the waiting item
	$('#' + target + ' .wait').show();
	
	// Change the ID of the current discovered item
	var iqID = target + '-' + genID();
	$('.' + target + '-results').attr('class', 'results ' + target + '-results ' + iqID);
	iq.setID(iqID);
	
	// Send the IQ
	if(type == 'subscribe')
		con.send(iq, handleDataFormSubscribe);
	else if(type == 'search')
		con.send(iq, handleDataFormSearch);
	else if(type == 'command')
		con.send(iq, handleDataFormCommand);
}

// Displays the good dataform buttons
function buttonsDataForm(type, action, id, xid, node, sessionid, status, target, pathID) {
	// Override the "undefined" output
	if(!id)
		id = '';
	if(!xid)
		xid = '';
	if(!node)
		node = '';
	if(!sessionid)
		sessionid = '';
	if(!status)
		status = '';
	
	// We generate the buttons code
	var buttonsCode = '<div class="oneresult ' + target + '-oneresult ' + target + '-formtools">';
	
	if(action == 'submit') {
		buttonsCode += '<a class="submit" onclick="sendDataForm(\'' + type + '\', \'submit\', \'' + id + '\', \'' + xid + '\', \'' + node + '\', \'' + sessionid + '\', \'' + status + '\', \'' + target + '\');">' + _e("Submit") + '</a>';
		
		// When keyup on one text input
		$(pathID + ' input[type=text]').keyup(function(e) {
			if(e.keyCode == 13)
				sendDataForm(type, 'submit', id, xid, node, sessionid, status, target);
		});
	}
	
	if((action == 'submit') && (type != 'subscribe') && (type != 'search'))
		buttonsCode += '<a class="submit" onclick="sendDataForm(\'' + type + '\', \'cancel\', \'' + id + '\', \'' + xid + '\', \'' + node + '\', \'' + sessionid + '\', \'' + status + '\', \'' + target + '\');">' + _e("Cancel") + '</a>';
	
	if(((action == 'back') || (type == 'subscribe') || (type == 'search')) && (target == 'discovery'))
		buttonsCode += '<a class="back" onclick="openDiscovery();">' + _e("Close") + '</a>';
	
	if((action == 'back') && (target == 'welcome'))
		buttonsCode += '<a class="back" onclick="dataForm(HOST_VJUD, \'search\', \'\', \'\', \'welcome\');">' + _e("Previous") + '</a>';
	
	buttonsCode += '</div>';
	
	// We display the buttons code
	$(pathID).append(buttonsCode);
}

// Handles the browse dataform
function handleDataFormBrowse(iq) {
	handleErrorReply(iq);
	handleDataFormContent(iq, 'browse');
}

// Handles the command dataform
function handleDataFormCommand(iq) {
	handleErrorReply(iq);
	handleDataFormContent(iq, 'command');
}

// Handles the subscribe dataform
function handleDataFormSubscribe(iq) {
	handleErrorReply(iq);
	handleDataFormContent(iq, 'subscribe');
}

// Handles the search dataform
function handleDataFormSearch(iq) {
	handleErrorReply(iq);
	handleDataFormContent(iq, 'search');
}

// Handles the dataform content
function handleDataFormContent(iq, type) {
	// Get the ID
	var sID = iq.getID();
	
	// Get the target
	var splitted = sID.split('-');
	var target = splitted[0];
	var sessionID = target + '-' + splitted[1];
	var from = iq.getFrom();
	var pathID = '#' + target + ' .' + sessionID;
	
	// If an error occured
	if(!iq || iq.getType() != 'result')
		noResultDataForm(pathID);
	
	// If we got something okay
	else {
		var handleXML = iq.getNode();
		
		if(type == 'browse') {
			if($(handleXML).find('item').attr('jid')) {
				$(handleXML).find('item').each(function() {
					// We parse the received xml
					var itemHost = $(this).attr('jid');
					var itemNode = $(this).attr('node');
					var itemName = $(this).attr('name');
					var itemHash = hex_md5(itemHost);
					
					// Special node
					if(itemNode)
						$(pathID).append(
							'<div class="oneresult ' + target + '-oneresult" onclick="dataForm(\'' + itemHost + '\', \'browse\', \'' + itemNode + '\', \'' + target + '\');">' + 
								'<div class="one-name">' + itemNode.htmlEnc() + '</div>' + 
							'</div>'
						);
					
					// Special item
					else if(itemName)
						$(pathID).append(
							'<div class="oneresult ' + target + '-oneresult">' + 
								'<div class="one-name">' + itemName.htmlEnc() + '</div>' + 
							'</div>'
						);
					
					// Classical item
					else {
						// We display the waiting element
						$(pathID + ' .disco-wait .disco-category-title').after(
							'<div class="oneresult ' + target + '-oneresult ' + itemHash + '">' + 
								'<div class="one-icon">☉</div>' + 
								'<div class="one-host">' + itemHost + '</div>' + 
								'<div class="one-type">' + _e("Requesting this service...") + '</div>' + 
							'</div>'
						);
						
						// We display the category
						$('#' + target + ' .disco-wait').show();
					
						// We ask the server what's the service type
						getDataFormType(itemHost, itemNode, sessionID);
					}
				});
			}
			
			// Else, there are no items for this query
			else
				noResultDataForm(pathID);
		}
		
		else if(type == 'search' || type == 'subscribe' || (type == 'command' && $(handleXML).find('command').attr('xmlns'))) {
			// Get some values
			var xCommand = $(handleXML).find('command');
			var bNode = xCommand.attr('node');
			var bSession = xCommand.attr('sessionid');
			var bStatus = xCommand.attr('status');
			var xRegister = $(handleXML).find('query[xmlns=' + NS_REGISTER + ']').text();
			var xElement = $(handleXML).find('x');
			
			// Search done
			if((xElement.attr('type') == 'result') && (type == 'search')) {
				var bPath = pathID;
				
				// Display the result
				$(handleXML).find('item').each(function() {
					var bXID = $(this).find('field[var=jid] value:first').text();
					var bName = $(this).find('field[var=fn] value:first').text();
					var bCountry = $(this).find('field[var=ctry] value:first').text();
					var dName = bName;
					
					// Override "undefined" value
					if(!bXID)
						bXID = '';
					if(!bName)
						bName = _e("Unknown name");
					if(!bCountry)
						bCountry = _e("Unknown country");
					
					// User hash
					var bHash = hex_md5(bXID);
					
					// HTML code
					var bHTML = '<div class="oneresult ' + target + '-oneresult ' + bHash + '">' + 
							'<div class="avatar-container">' + 
								'<img class="avatar removable" src="' + './img/others/default-avatar.png' + '" alt="" />' + 
							'</div>' + 
							'<div class="one-fn">' + bName + '</div>' + 
							'<div class="one-ctry">' + bCountry + '</div>' + 
							'<div class="one-jid">' + bXID + '</div>' + 
							'<div class="buttons-container">';
					
					// The buddy is not in our buddy list?
					if(!exists('#buddy-list .buddy[data-xid=' + bXID + ']'))
						bHTML += '<a class="one-add one-vjud one-button">' + _e("Add") + '</a>';
					
					// Chat button, if not in welcome mode
					if(target == 'discovery')
						bHTML += '<a class="one-chat one-vjud one-button">' + _e("Chat") + '</a>';
					
					// Close the HTML element
					bHTML += '</div></div>';
					
					$(bPath).append(bHTML);
					
					// Click events
					$(bPath + ' .' + bHash + ' a').click(function() {
						// Buddy add
						if($(this).is('.one-add')) {
							$(this).hide();
							
							addThisContact(bXID);
						}
						
						// Buddy chat
						if($(this).is('.one-chat')) {
							if(target == 'discovery')
								quitDiscovery();
							
							checkChatCreate(bXID , 'chat', '', '', dName);
						}
					});
					
					// Get the user's avatar
					if(bXID)
						getAvatar(bXID, 'cache', 'true', 'forget');
				});
				
				// No result?
				if(!$(handleXML).find('item').size())
					noResultDataForm(pathID);
				
				// Previous button
				buttonsDataForm(type, 'back', sessionID, from, bNode, bSession, bStatus, target, pathID);
			}
			
			// Command to complete
			else if(xElement.attr('xmlns') || (type == 'subscribe' && xRegister)) {
				// We display the elements
				fillDataForm(handleXML, sessionID);
				
				// We display the buttons
				if(bStatus != 'completed')
					buttonsDataForm(type, 'submit', sessionID, from, bNode, bSession, bStatus, target, pathID);
				else
					buttonsDataForm(type, 'back', sessionID, from, bNode, bSession, bStatus, target, pathID);
			}
			
			// Command completed or subscription done
			else if((bStatus == 'completed' && type == 'command') || (!xRegister && type == 'subscribe')) {
				// Tell the user all was okay
				$(pathID).append('<div class="oneinstructions ' + target + '-oneresult">' + _e("Your form has been sent.") + '</div>');
				
				buttonsDataForm(type, 'back', sessionID, from, '', '', '', target, pathID);
				
				// Add the gateway to our roster if subscribed
				if(type == 'subscribe')
					addThisContact(from);
			}
			
			// Command canceled
			else if(bStatus == 'canceled' && type == 'command')
				openDiscovery();
			
			// Else, there are no items for this query
			else
				noResultDataForm(pathID);
		}
		
		else if(type == 'command') {
			if($(handleXML).find('item').attr('jid')) {
				// We display the elements
				$(handleXML).find('item').each(function() {
					// We parse the received xml
					var itemHost = $(this).attr('jid');
					var itemNode = $(this).attr('node');
					var itemName = $(this).attr('name');
					var itemHash = hex_md5(itemHost);
					
					// We display the waiting element
					$(pathID).prepend(
						'<div class="oneresult ' + target + '-oneresult ' + itemHash + '" onclick="dataForm(\'' + itemHost + '\', \'command\', \'' + itemNode + '\', \'execute\', \'' + target + '\');">' + 
							'<div class="one-name">' + itemName + '</div>' + 
							'<div class="one-next">»</div>' + 
						'</div>'
					);
				});
			}
			
			// Else, there are no items for this query
			else
				noResultDataForm(pathID);
		}
	}
	
	// Focus on the first input
	$(pathID + ' input:first').focus();
	
	// Hide the wait icon
	$('#' + target + ' .wait').hide();
}

// Appends the correct dataform elements
function appendDataForm(selector, id, target, label, type) {
	selector.find(type).each(function() {
		$('.' + id).append(
			'<div class="oneresult ' + target + '-oneresult">' + 
				'<label class="removable">' + label + '</label>' + 
				'<input name="' + type + '" type="text" class="register-special dataform-i removable" />' + 
			'</div>'
		);
	});
}

// Fills the dataform elements
function fillDataForm(xml, id) {
	/* REF: http://xmpp.org/extensions/xep-0004.html */
	
	var selector = $(xml);
	var target = id.split('-')[0];
	
	// Form title
	selector.find('title').each(function() {
		$('.' + id).append(
			'<div class="onetitle ' + target + '-oneresult">' + $(this).text() + '</div>'
		);
	});
	
	// Form instructions
	selector.find('instructions').each(function() {
		$('.' + id).append(
			'<div class="oneinstructions ' + target + '-oneresult">' + $(this).text() + '</div>'
		);
	});
	
	// Form username
	appendDataForm(selector, id, target, _e("Nickname"), 'username');
	
	// Form password
	appendDataForm(selector, id, target, _e("Password"), 'password');
	
	// Form email
	appendDataForm(selector, id, target, _e("E-mail"), 'email');
	
	// Form fields
	selector.find('field').each(function() {
		// We parse the received xml
		var type = $(this).attr('type');
		var label = $(this).attr('label');
		var field = $(this).attr('var');
		var value = $(this).find('value:first').text();
		
		// Compatibility fix
		if(!label)
			label = field;
		
		if(!type)
			type = '';
		
		// Generate some values
		var input;
		var hideThis = '';
		
		// Fixed field
		if(type == 'fixed')
			$('.' + id).append('<div class="oneinstructions">' + value.htmlEnc() + '</div>');
		
		else {
			// Hidden field
			if(type == 'hidden')
				hideThis = ' style="display: none;"';
			
			// Boolean checkbox field
			else if(type == 'boolean') {
				var checked;
				
				if(value == '1')
					checked = 'checked';
				else
					checked = '';
				
				input = '<input name="' + field + '" type="checkbox" data-type="' + type + '" class="dataform-i df-checkbox removable" ' + checked + ' />';
			}
			
			// List-multi checkboxes field
			else if(type == 'list-multi') {
				$(this).find('option').each(function() {
					var nLabel = $(this).attr('label');
					var nValue = $(this).find('value').text();
					
					if(nValue == '1')
						nChecked = 'checked';
					else
						nChecked = '';
					
					input += '<input name="' + field + '" type="checkbox" data-type="' + type + '" class="dataform-i df-checkbox removable" ' + nChecked + ' />';
				});
			}
			
			// We check if the value comes from a radio input
			else if(type == 'list-single') {
				input = '<select name="' + field + '" data-type="' + type + '" class="dataform-i removable">';
				var selected;
				
				$(this).find('option').each(function() {
					var nLabel = $(this).attr('label');
					var nValue = $(this).find('value').text();
					
					// If this is the selected value
					if(nValue == value)
						selected = 'selected';
					else
						selected = '';
					
					input += '<option ' + selected + ' value="' + nValue + '">' + nLabel + '</option>';
				});
				
				input += '</select>';
			}
			
			// Text-multi field
			else if(type == 'text-multi')
				input = '<textarea rows="8" cols="60" data-type="' + type + '" name="' + field + '" type="' + iType + '" class="dataform-i removable">' + value + '</textarea>';
			
			// Other stuffs that are similar
			else {
				// We change the type of the input
				if(type == 'text-private')
					iType = 'password';
				else
					iType = 'text';
				
				input = '<input name="' + field + '" data-type="' + type + '" type="' + iType + '" class="dataform-i removable" value="' + value + '" />';
			}
			
			// Append the HTML markup for this field
			$('.' + id).append(
				'<div class="oneresult ' + target + '-oneresult"' + hideThis + '>' + 
					'<label class="removable">' + label + '</label>' + 
					input + 
				'</div>'
			);
		}
	});
}

// Gets the dataform type
function getDataFormType(host, node, id) {
	var iq = new JSJaCIQ();
	iq.setID(id + '-' + genID());
	iq.setTo(host);
	iq.setType('get');
	
	var iqQuery = iq.setQuery(NS_DISCO_INFO);
	
	if(node)
		iqQuery.setAttribute('node', node);
	
	con.send(iq, handleThisBrowse);
}

// Handles the browse stanza
function handleThisBrowse(iq) {
	/* REF: http://xmpp.org/registrar/disco-categories.html */
	
	var id = iq.getID();
	var splitted = id.split('-');
	var target = splitted[0];
	var sessionID = target + '-' + splitted[1];
	var from = iq.getFrom();
	var hash = hex_md5(from);
	var handleXML = iq.getQuery();
	var pathID = '#' + target + ' .' + sessionID;
	
	// We first remove the waiting element
	$(pathID + ' .disco-wait .' + hash).remove();
	
	if($(handleXML).find('identity').attr('type')) {
		var category = $(handleXML).find('identity').attr('category');
		var type = $(handleXML).find('identity').attr('type');
		var named = $(handleXML).find('identity').attr('name');
		
		if(named)
			gName = named;
		else
			gName = '';
		
		var icon, one, two, three, four, five;
		
		// Get the features that this entity supports
		var findFeature = $(handleXML).find('feature');
		
		for(var i = 0; i < findFeature.length; i++) {
			var current = findFeature.eq(i).attr('var');
			
			switch(current) {
				case NS_DISCO_ITEMS:
					one = 1;
					break;
				
				case NS_COMMANDS:
					two = 1;
					break;
				
				case NS_REGISTER:
					three = 1;
					break;
				
				case NS_MUC:
					four = 1;
					break;
				
				case NS_SEARCH:
					five = 1;
					break;
				
				default:
					break;
			}
		}
		
		var buttons = Array(one, two, three, four, five);
		
		// We define the toolbox links depending on the supported features
		var tools = '';
		var aTools = Array('browse', 'command', 'subscribe', 'join', 'search');
		var bTools = Array(_e("Browse"), _e("Command"), _e("Subscribe"), _e("Join"), _e("Search"));
		var cTools = Array('⌘', '⚒', '✎', '➲', '⚲');
		
		for(var i = 0; i < buttons.length; i++)
			if(buttons[i])
				tools += '<a onclick="dataForm(\'' + from + '\', \'' + aTools[i] + '\', \'\', \'\', \'' + target + '\');" title="' + bTools[i] + '">' + cTools[i] + '</a>';
		
		// As defined in the ref, we detect the type of each category to put an icon
		switch(category) {
			case 'account':
				icon = '⚖';
				break;
			case 'auth':
				icon = '⚗';
				break;
			case 'automation':
				icon = '⚡';
				break;
			case 'client':
				icon = '☘';
				break;
			case 'collaboration':
				icon = '☻';
				break;
			case 'component':
				icon = '☌';
				break;
			case 'conference':
				icon = '⚑';
				break;
			case 'directory':
				icon = '☎';
				break;
			case 'gateway':
				icon = '⚙';
				break;
			case 'headline':
				icon = '☀';
				break;
			case 'hierarchy':
				icon = '☛';
				break;
			case 'proxy':
				icon = '☔';
				break;
			case 'pubsub':
				icon = '♞';
				break;
			case 'server':
				icon = '⛂';
				break;
			case 'store':
				icon = '⛃';
				break;
			default:
				icon = '★';
				category = 'others';
				break;
		}
		
		// We display the item that we found
		$(pathID + ' .disco-' + category + ' .disco-category-title').after(
			'<div class="oneresult ' + target + '-oneresult ' + hash + '">' + 
				'<div class="one-icon">' + icon + '</div>' + 
				'<div class="one-host">' + from + '</div>' + 
				'<div class="one-type">' + gName + '</div>' + 
				'<div class="one-actions">' + tools + '</div>' + 
			'</div>'
		);
		
		// We display the category
		$(pathID + ' .disco-' + category).show();
	}
	
	else {
		$(pathID + ' .disco-others .disco-category-title').after(
			'<div class="oneresult ' + target + '-oneresult">' + 
				'<div class="one-icon">☓</div>' + 
				'<div class="one-host">' + from + '</div>' + 
				'<div class="one-type">' + _e("Service offline or broken") + '</div>' + 
			'</div>'
		);
		
		// We display the category
		$(pathID + ' .disco-others').show();
	}
	
	// We hide the waiting stuffs if there's no remaining loading items
	if(!$(pathID + ' .disco-wait .' + target + '-oneresult').length)
		$(pathID + ' .disco-wait, #' + target + ' .wait').hide();
}

// Cleans the current data-form popup
function cleanDataForm(target) {
	if(target == 'discovery')
		cleanDiscovery();
	else if(target == 'welcome')
		$('#welcome div.results').empty();
}

// Displays the no result indicator
function noResultDataForm(path) {
	$(path).prepend('<p class="no-results">' + _e("Sorry, but the server didn't return any result!") + '</p>');
}