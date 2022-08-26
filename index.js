const compact_headers = require('./compact_headers')

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
	var a = msg.first_line.split(/ (.+)/)
	var b = a[1].trim().split(/ (.+)/)
	msg['$rs'] = b[0].trim()
	msg['$rr'] = b[1].trim()
}

const basic_parse = (msg) => {
    msg.is_request = !msg.str.startsWith('SIP/2.0')

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
		if(compact_headers[name]) {
			name = compact_headers[name]
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
	var items = _.filter(msg.headers, name_value => {
		return name.toLowerCase() == name_value[0]
	})

	if(items.length == 0) return null

	var item = null
	
	if(index == '-1') {
		item = items[items.length -1]
		if(item) return item[1]
	} else if(index == '*') {
		return _.chain(items).map(item => {
			return item[1]
		}).join(",").value()
	} else {
		index = parseInt(index)
		if(Number.isInteger(index) && index >= 0) {
			item = items[index]
			if(item) return item[1]
		}
	}	

	return null
}

const remove_angle_brackets = uri => {
	if(uri[0] == "<" && uri[uri.length - 1] == ">") {
		return uri.substring(1, uri.length - 1)
	}
	return uri
}

const parse_displayname_and_uri = (displayname_uri) => {
	var separation_point = null

	var double_quote_pos = displayname_uri.indexOf('"')

	if(double_quote_pos >= 0) {
		var closing_double_quote_pos = displayname_uri.indexOf('"', double_quote_pos+1)
		if(closing_double_quote_pos >= 0) {
			separation_point = closing_double_quote_pos
		}
	}

	if(!separation_point) {
		var space_pos = displayname_uri.indexOf(" ")
		if(space_pos >= 0) {
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

	if(separation_point > 0) {
		displayname = displayname_uri.substring(0, separation_point).trim()
		uri = displayname_uri.substring(separation_point+1).trim()
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

const parse_cseq = (msg) => {
    var cseq = get_header('cseq', msg)
    if(!cseq) return null

    cseq = cseq.trim().split(/\W+/)

    var seq = parseInt(cseq[0])
    msg.$cs = seq

    if(!msg.$rm) {
        msg.$rm = cseq[1]
    }
}

const get = (msg, parser, key) => {
    if(msg.hasOwnProperty(key)) return msg[key]

    parser(msg)
    return msg[key]
}

const partial = (fu, name) => {
    return (msg) => {
        return fu(name, msg)
    }
}

const request_method = (msg) => {
    if(msg.is_request) {
        parse_request_line(msg)
    } else {
        parse_cseq(msg)
    }
}

const status_or_reason = (msg) => {
    if(msg.is_request) {
        msg.$rs = null
        msg.$rr = null
        return
    }

    parse_status_line(msg)
}

const base_pseudovar_accessors = {
	$rm: (msg) => { return get(msg, request_method, '$rm') },
	$ru: (msg) => { return get(msg, parse_request_line, '$ru') },
	$rU: (msg) => { return get(msg, parse_request_line, '$rU') },
	$rd: (msg) => { return get(msg, parse_request_line, '$rd') },
	$rp: (msg) => { return get(msg, parse_request_line, '$rp') },

	$rs: (msg) => { return get(msg, status_or_reason, '$rs') },
	$rr: (msg) => { return get(msg, status_or_reason, '$rr') },

	$fn: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "from"), '$fn') },
	$fu: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "from"), '$fu') },
	$fU: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "from"), '$fU') },
	$fd: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "from"), '$fd') },

	$tn: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "to"), '$tn') },
	$tu: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "to"), '$tu') },
	$tU: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "to"), '$tU') },
	$td: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "to"), '$td') },

	$pn: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "p-preferred-identity"), '$pn') }, 
	$pu: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "p-preferred-identity"), '$pu') },
	$pU: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "p-preferred-identity"), '$pU') },
	$pd: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "p-preferred-identity"), '$pd') },

	$di: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "diversion"), '$di') },

	$re: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "remote-party-id"), '$re') },

	$rt: (msg) => { return get(msg, partial(parse_displayname_uri_username_domain, "refer-to"), '$rt') },

    $cs: (msg) => { return get(msg, parse_cseq, '$cs') },

	$rb: (msg) => { return msg.body },

	$ua: (msg) => { return get_header('user-agent', msg) },

	$ci: (msg) => { return get_header('call-id', msg) },

	$cl: (msg) => { return get_header('content-length', msg) },


	$cT: (msg) => { return get_header('content-type', msg) },
}


module.exports = {
	parse: (msg_payload) => {
		var msg = {
			str: msg_payload,
		}

		basic_parse(msg)
		
		var o = new Proxy(msg, {
			get: function (target, key, receiver) {
				if (target.hasOwnProperty(key)){
					return Reflect.get(target, key, receiver);
				}

				if(base_pseudovar_accessors[key]) {
					return base_pseudovar_accessors[key](target)
				}

				var key = key.toString()

				var match = null

				var re_hdr = /^\$hdr\(([^\)]+)\)$/
				match = key.match(re_hdr)
				if(match) {
					var name = match[1]
					if(compact_headers[name]) {
						name = compact_headers[name]
					}

					target[key] = get_header(name, target) 
					return target[key]
				}

				var re_hdr_with_index = /^\$\(hdr\(([^\)]+)\)\[(-1|[0-9]+|\*)\]\)$/
				match = key.match(re_hdr_with_index)
				if(match) {
					var name = match[1]
					if(compact_headers[name]) {
						name = compact_headers[name]
					}

					//var index = parseInt(match[2])
					var index = match[2]
					target[key] = get_header_by_index(name, index, target) 
					return target[key]
				}

				var re_hdrcnt = /^\$\(hdrcnt\(([^\)]+)\)\)$/
				match = key.match(re_hdrcnt)
				if(match) {
					var name = match[1].toLowerCase()
					if(compact_headers[name]) {
						name = compact_headers[name]
					}

					target[key] = _.reduce(target.headers, (acc, a) => {
						if(a[0] == name) return acc + 1
						return acc
					}, 0)
					return target[key]
				}

				return null
			},
		})

		return o
	},
}

