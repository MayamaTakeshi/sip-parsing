const sip_compact_headers = require('./sip_compact_headers')

const _ = require('lodash')

const parse_request_line = (msg) => {
	var a = msg.first_line.split(/\s+/)
	var method = a[0]
	var uri = a[1]
	msg['$rm'] = method
	msg['$ru'] = uri
	var udp = parse_username_domain_port(uri)
	msg['$rU'] = udp.username
	msg['$rd'] = udp.domain
	msg['$rp'] = udp.port
}

const parse_status_line = (msg) => {
	var a = msg.first_line.split(/\s+/)
	msg['$rs'] = a[1]
	msg['$rr'] = a[2]
}

const basic_parse = (msg) => {
	var a = msg.str.split("\r\n\r\n")

	if(a[1] == "") {
		msg.body = null
	} else {
		msg.body = a[1]
	}

	var lines = a[0].split(/\r\n/)
	msg.first_line = lines[0]

	var header_lines = lines.splice(1)

	// headers may spread over several lines
	msg.headers = _.map(header_lines, line => {
		var colon_pos = line.indexOf(":")
		var name = line.substring(0,colon_pos).trim().toLowerCase()
		if(sip_compact_headers[name]) {
			name = sip_compact_headers[name]
		}
		var value = line.substring(colon_pos+1).trim()
		return [name, value]
	})
}

const get_header = (name, msg) => {
	var item = _.find(msg.headers, name_value => {
		return name.toLowerCase() == name_value[0]
	})

	if(item) return item[1]

	return null
}

const get_header_by_index = (name, index, msg) => {
	var item = _.filter(msg.headers, name_value => {
		return name.toLowerCase() == name_value[0]
	})[index]

	if(item) return item[1]

	return null
}

const remove_angle_brackets = uri => {
	if(uri[0] == "<" && uri[uri.length - 1] == ">") {
		return uri[1, uri.length - 1]
	}
	return uri
}

const parse_displayname_and_uri = (displayname_uri) => {
	var separation_point = null

	var double_quote_pos = displayname_uri.indexOf('"')

	if(double_quote_pos > 0) {
		var closing_double_quote_pos = displayname_uri.indexOf('"', double_quote_pos+1)
		if(closing_double_quote_pos > 0) {
			separation_point = closing_double_quote_pos
		}
	}

	if(!separation_point) {
		var space_pos = displayname_uri.indexOf(" ")
		if(space_pos > 0) {
			separation_point = space_pos
		} else {
			var open_bracket_pos = displayname_uri.indexOf("<")
			if(open_bracket_pos) {
				separation_point = open_bracket_pos-1
			}	
		}	
	}

	var displayname
	var uri

	if(separation_point) {
		displayname = displayname_uri[0, separation_point].trim()
		uri = displayname_uri.substring(separation_point+1)
	} else {
		displayname = ""
		uri = displayname_uri.trim()
	}	

	uri = remove_angle_brackets(uri)
	return {displayname: displayname, uri: uri}
}

const parse_username_domain_port = (uri) => {
	var colon_pos = uri.indexOf(":")
	var at_pos = uri.indexOf('@')

	var username = uri.substring(colon_pos+1, at_pos)

	var domain_port = uri.substring(at_pos + 1).split(":")

	var domain = domain_port[0]
	var port = domain_port[1]

	return {username: username, domain: domain, port: port}
}

const parse_displayname_uri_username_domain = (header, msg) => {
	var value = get_header(header, msg)
	if(!value) return null

	var displayname_uri
	var semi_colon_pos = value.indexOf(";") 
	if(semi_colon_pos > 0) {
		displayname_uri = value.substring(0, semi_colon_pos)
	} else {
		displayname_uri = value
	}

	var du = parse_displayname_and_uri(displayname_uri)
	var udp = parse_username_domain_port(du.uri)

	if(header == 'from') {
		msg['$fu'] = du.uri
		msg['$fn'] = du.displayname
		msg['$fU'] = udp.username
		msg['$fd'] = udp.domain
	} else if(header == 'to') {
		msg['$tu'] = du.uri
		msg['$tn'] = du.displayname
		msg['$tU'] = udp.username
		msg['$td'] = udp.domain
	} else if(header == 'p-preferred-identity') {
		msg['$pu'] = du.uri
		msg['$pn'] = du.displayname
		msg['$pU'] = udp.username
		msg['$pd'] = udp.domain
	} else if(header == 'p-asserted-identity') {
		msg['$ai'] = uri
	} else if(header == 'diversion') {
		msg['$di'] = uri
	} else if(header == 'remote-party-id') {
		msg['$re'] = uri
	} else if(header == 'refer-to') {
		msg['$rt'] = uri
	}

	return {displayname: du.display_name, uri: du.uri, username: udp.username, domain: udp.domain}
}

const base_pseudovar_accessors = {
	$rm: (msg) => { parse_request_line(msg); return msg.$rm },
	$ru: (msg) => { parse_request_line(msg); return msg.$ru },
	$rU: (msg) => { parse_request_line(msg); return msg.$rU },
	$rd: (msg) => { parse_request_line(msg); return msg.$rd },
	$rp: (msg) => { parse_request_line(msg); return msg.$rp },

	$rs: (msg) => { parse_status_line(msg); return msg.$rs },
	$rr: (msg) => { parse_status_line(msg); return msg.$rr },

	$fn: (msg) => { parse_displayname_uri_username_domain("from", msg); return msg.$fn },
	$fu: (msg) => { parse_displayname_uri_username_domain("from", msg); return msg.$fu },
	$fU: (msg) => { parse_displayname_uri_username_domain("from", msg); return msg.$fU },
	$fd: (msg) => { parse_displayname_uri_username_domain("from", msg); return msg.$fd },

	$tn: (msg) => { parse_displayname_uri_username_domain("to", msg); return msg.$tn },
	$tu: (msg) => { parse_displayname_uri_username_domain("to", msg); return msg.$tu },
	$tU: (msg) => { parse_displayname_uri_username_domain("to", msg); return msg.$tU },
	$td: (msg) => { parse_displayname_uri_username_domain("to", msg); return msg.$td },

	$pn: (msg) => { parse_displayname_uri_username_domain("p-preferred-identity", msg); return msg.$pn }, 
	$pu: (msg) => { parse_displayname_uri_username_domain("p-preferred-identity", msg); return msg.$pu },
	$pU: (msg) => { parse_displayname_uri_username_domain("p-preferred-identity", msg); return msg.$pU },
	$pd: (msg) => { parse_displayname_uri_username_domain("p-preferred-identity", msg); return msg.$pd },

	$di: (msg) => { parse_displayname_uri_username_domain("diversion", msg); return msg.$di },

	$re: (msg) => { parse_displayname_uri_username_domain("pemote-party-id", msg); return msg.$re },

	$rt: (msg) => { parse_displayname_uri_username_domain("refer-to", msg); return msg.$rt },

	$rb: (msg) => { return msg.body },

	$ua: (msg) => { return msg.headers['user-agent'] },

	$ci: (msg) => { return msg.headers['call-id'] },

	$cl: (msg) => { return msg.headers['content-length'] },

	$cT: (msg) => { return msg.headers['content-type'] },
}

const get_hdr = (spec, msg) => {
	// if hdr is like $hdr(header_name), then get the specified header	

	var re = /^\$hdr\(([^\)]+)\)$/

	var name = spec.match(re)[1]

	if(name) {
		return get_header(name, msg) 
	}
	return null
}

const get_hdr_with_index = (spec, msg) => {
	// if hdr is like $(hdr(header_name)[index]), then get the specified header at that index

	var re = /^\$\(hdr\(([^\)]+)\)\[([0-9]+)\]\)$/

	var m = spec.match(re)
	if(m && m[1] && m[2]) {
		var name = m[1]
		var index = parseInt(m[2])
		return get_header_by_index(name, index, msg) 
	}
	return null
}

module.exports = {
	gen_parser: (msg_payload) => {
		var msg = {
			str: msg_payload
		}

		basic_parse(msg)
		
		var parser = new Proxy(msg, {
			get: function (target, key, receiver) {
				if (target.hasOwnProperty(key)){
					return Reflect.get(target, key, receiver);
				}

				if(base_pseudovar_accessors[key]) {
					return base_pseudovar_accessors[key](target)
				}

				var match = null

				var re_hdr = /^\$hdr\(([^\)]+)\)$/
				match = key.toString().match(re_hdr)
				if(match) {
					var name = match[1]
					target[key] = get_header(name, target) 
					return target[key]
				}

				var re_hdr_with_index = /^\$\(hdr\(([^\)]+)\)\[([0-9]+)\]\)$/
				match = key.toString().match(re_hdr_with_index)
				if(match) {
					var name = match[1]
					var index = parseInt(match[2])
					target[key] = get_header_by_index(name, index, target) 
					return target[key]
				}

				return null
			},
		})

		return parser
	},
}

