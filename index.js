const compact_headers = require('./compact_headers')

const _ = require('lodash')

const parse_request_line = (msg) => {
    var a = msg.first_line.split(/\s+/)

    var method = a[0]
    var uri = a[1]
    var version = a[2]

    msg.$rm = method
    msg.$ru = uri
    msg.$rv = version

    var sudp = parse_scheme_username_domain_port(uri)
    msg.$rz = sudp.scheme
    msg.$rU = sudp.username
    msg.$rd = sudp.domain
    msg.$rp = sudp.port
}

const parse_status_line = (msg) => {
    var tokens = msg.first_line.split(/ (.+)/)
    var version = tokens[0].trim()
    msg.$rv = version
    var status_and_reason = tokens[1].trim().split(/ (.+)/)
    msg.$rs = status_and_reason[0].trim()
    msg.$rr = status_and_reason[1].trim()
}

const basic_parse = (msg) => {
    msg.is_request = !msg.str.startsWith('SIP/')
    msg.$ml = msg.str.length

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

    if(msg.is_request) {
        parse_request_line(msg)
        msg.$mt = 1
    } else {
        parse_status_line(msg)
        msg.$mt = 2
    }
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

const parse_scheme_username_domain_port = (uri) => {
    var colon_pos = uri.indexOf(":")
    var at_pos = uri.indexOf('@')

    var scheme = uri.substring(0, colon_pos)

    var username = uri.substring(colon_pos+1, at_pos)

    var domain_port = uri.substring(at_pos + 1).split(":")

    var domain = domain_port[0]
    var port = domain_port[1]

    return {scheme, username, domain, port}
}

const parse_displayname_uri_username_domain = (header, msg) => {
    var value = get_header(header, msg)
    if(!value) return null

    var params = {}

    var displayname_uri
    var semi_colon_pos = value.indexOf(";") 
    if(semi_colon_pos > 0) {
        displayname_uri = value.substring(0, semi_colon_pos)
        params = _.chain(value.substring(semi_colon_pos+1))
            .split(";")
            .map(x => { return x.split("=") })
            .fromPairs()
            .value()
    } else {
        displayname_uri = value
    }

    var du = parse_displayname_and_uri(displayname_uri)
    var sudp = parse_scheme_username_domain_port(du.uri)

    if(header == 'from') {
        msg.$fu = du.uri
        msg.$fn = du.displayname
        msg.$fU = sudp.username
        msg.$fd = sudp.domain
        msg.$fUl = sudp.username.length
        msg.$ft = params.tag
    } else if(header == 'to') {
        msg.$tu = du.uri
        msg.$tn = du.displayname
        msg.$tU = sudp.username
        msg.$td = sudp.domain
    } else if(header == 'p-preferred-identity') {
        msg.$pu = du.uri
        msg.$pn = du.displayname
        msg.$pU = sudp.username
        msg.$pd = sudp.domain
    } else if(header == 'p-asserted-identity') {
        msg.$ai = uri
    } else if(header == 'diversion') {
        msg.$di = uri
    } else if(header == 'remote-party-id') {
        msg.$re = uri
    } else if(header == 'refer-to') {
        msg.$rt = uri
    }

    return {displayname: du.display_name, uri: du.uri, username: sudp.username, domain: sudp.domain}
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

const ensure_null = (x) => {
    return x ? x : null
}

const parse_authorization_or_proxy_authorization = (msg) => {
    var value = get_header('authorization', msg)
    if(!value) {
        value = get_header('proxy-authorization', msg)
    }

    if(value) {
        msg.auth = _.chain(value)
            .trim()
            .split(/\s+/) // tokenize
            .drop(1) // drop the first token (like 'Digest')
            .map(x => { return x.replace(/,$/,'') } ) //remove comma at the end of tokens
            .map(x => { return x.split("=") } ) // generate key/value pairs
            .map(x => { return [x[0], x[1] ? x[1].replace(/^"|"$/g, '') : null] }) // remove double quotes from values
            .fromPairs() // covert key/value pairs to object
            .value()
    } else {
        msg.auth = {}
    }

    var user_and_domain = msg.auth.username ? msg.auth.username.split('@') : []

    msg.$adu = ensure_null(msg.auth.uri)
    msg.$aa  = ensure_null(msg.auth.algorithm)
    msg.$ar  = ensure_null(msg.auth.realm)
    msg.$au  = ensure_null(user_and_domain[0])
    msg.$ad  = ensure_null(user_and_domain[1])
    msg.$aU  = ensure_null(msg.auth.username)
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

const parse_from = partial(parse_displayname_uri_username_domain, "from")
const parse_to = partial(parse_displayname_uri_username_domain, "to")
const parse_ppi = partial(parse_displayname_uri_username_domain, "p-preferred-identity")
const parse_pai = partial(parse_displayname_uri_username_domain, "p-asserted-identity")
const parse_diversion = partial(parse_displayname_uri_username_domain, "diversion")
const parse_rpi = partial(parse_displayname_uri_username_domain, "remote-party-id")
const parse_refer_to = partial(parse_displayname_uri_username_domain, "refer-to")

const base_pseudovar_accessors = {
    $rm: (msg) => { return get(msg, parse_cseq, '$rm') },

    $fn:  (msg) => { return get(msg, parse_from, '$fn') },
    $fu:  (msg) => { return get(msg, parse_from, '$fu') },
    $fU:  (msg) => { return get(msg, parse_from, '$fU') },
    $fd:  (msg) => { return get(msg, parse_from, '$fd') },
    $ft: (msg) => { return get(msg, parse_from, '$ft') },
    $fUl: (msg) => { return get(msg, parse_from, '$fUl') },

    $tn: (msg) => { return get(msg, parse_to, '$tn') },
    $tu: (msg) => { return get(msg, parse_to, '$tu') },
    $tU: (msg) => { return get(msg, parse_to, '$tU') },
    $td: (msg) => { return get(msg, parse_to, '$td') },

    $pn: (msg) => { return get(msg, parse_ppi, '$pn') }, 
    $pu: (msg) => { return get(msg, parse_ppi, '$pu') },
    $pU: (msg) => { return get(msg, parse_ppi, '$pU') },
    $pd: (msg) => { return get(msg, parse_ppi, '$pd') },

    $adu: (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$adu') },
    $aa : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$aa') },
    $ar : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$ar') },
    $au : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$au') },
    $ad : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$ad') },
    $aU : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$aU') },

    $ai: (msg) => { return get(msg, parse_pai, '$ai') },

    $di: (msg) => { return get(msg, parse_diversion, '$di') },

    $re: (msg) => { return get(msg, parse_rpi, '$re') },

    $rt: (msg) => { return get(msg, parse_refer_to, '$rt') },

    $cs: (msg) => { return get(msg, parse_cseq, '$cs') },

    $rb: (msg) => { return msg.body },

    $ua: (msg) => { return get_header('user-agent', msg) },

    $ci: (msg) => { return get_header('call-id', msg) },

    $cl: (msg) => { return get_header('content-length', msg) },

    $cT: (msg) => { return get_header('content-type', msg) },

    $route_uri: (msg) => { return remove_angle_brackets(get_header('route', msg)) },
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

