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
    msg['$msg.is_request'] = msg.is_request ? 1 : 0
    msg['$msg.type'] = msg.is_request ? 'request' : 'reply'

    var a = msg.str.split("\r\n\r\n")

    if(a[1] != "") {
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

    return undefined;
}

const get_header_by_index = (name, index, msg) => {
    var items = _.filter(msg.headers, name_value => {
        return name.toLowerCase() == name_value[0]
    })

    if(items.length == 0) return undefined;

    var item = undefined;
    
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

    return undefined;
}

const remove_angle_brackets = uri => {
    if(uri[0] == "<" && uri[uri.length - 1] == ">") {
        return uri.substring(1, uri.length - 1)
    }
    return uri
}

const gen_params = (s) => {
    return _.chain(s)
        .split(";")
        .map(x => { return x.split("=") })
        .fromPairs()
        .value()
}

const parse_displayname_and_uri = (displayname_uri) => {
    var start_of_next = 0

    var displayname
    var uri
    var params = {}

    var double_quote_pos = displayname_uri.indexOf('"')
    if(double_quote_pos >= 0) {
        var closing_double_quote_pos = displayname_uri.indexOf('"', double_quote_pos+1)
        if(closing_double_quote_pos >= 0) {
            displayname = displayname_uri.slice(double_quote_pos+1, closing_double_quote_pos)
            start_of_next = closing_double_quote_pos+1
        } else {
            // malformed
            return {}
        }
    } else {
        // It could be:
        // From: <sip:alice@atlanta.com>;tag=1928301774
        // or
        // From: Alice <sip:alice@atlanta.com>;tag=1928301774
        var pos = displayname_uri.indexOf('<')
        if(pos >= 0) {
            displayname = displayname_uri.slice(0, pos).trim()
            start_of_next = pos
        } else  {
            displayname = undefined
        }
    }

    var uri_and_params = displayname_uri.slice(start_of_next).trim()
    if(uri_and_params[0] == '<') {
        var end_bracket_pos = uri_and_params.indexOf('>')
        if(end_bracket_pos >= 0) {
            uri = uri_and_params.slice(1, end_bracket_pos)
            var pos = uri_and_params.indexOf(';', end_bracket_pos)
            if(pos >= 0) {
                start_of_next = pos + 1
            } else {
                start_of_next = -1
            }
        } else {
            // malformed
            return {}
        }
    } else {
        uri = uri_and_params
        start_of_next = -1
    }

    if(start_of_next >= 0) {
        params = gen_params(uri_and_params.slice(start_of_next))
    }

    if(displayname == "") displayname = undefined

    return {displayname, uri, params}
}

const parse_scheme_username_domain_port = (uri) => {
    var semicolon_pos = uri.indexOf(";")
    if(semicolon_pos >= 0){ 
        uri = uri.slice(0, semicolon_pos)
    }

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
    if(!value) return undefined

    var du = parse_displayname_and_uri(value)
    var sudp = parse_scheme_username_domain_port(du.uri)

    if(header == 'from') {
        msg.$fu = du.uri
        msg.$fn = du.displayname
        msg.$fU = sudp.username
        msg.$fd = sudp.domain
        msg.$fUl = sudp.username.length
        msg.$ft = du.params.tag
    } else if(header == 'to') {
        msg.$tu = du.uri
        msg.$tn = du.displayname
        msg.$tU = sudp.username
        msg.$td = sudp.domain
        msg.$tt = du.params.tag
    } else if(header == 'p-preferred-identity') {
        msg.$pu = du.uri
        msg.$pn = du.displayname
        msg.$pU = sudp.username
        msg.$pd = sudp.domain
    } else if(header == 'p-asserted-identity') {
        msg.$ai = du.uri
    } else if(header == 'diversion') {
        msg.$di = du.uri
        msg.$dip = du.params.privacy
        msg.$dir = du.params.reason
    } else if(header == 'remote-party-id') {
        msg.$re = du.uri
    } else if(header == 'refer-to') {
        msg.$rt = du.uri
    }

    return {displayname: du.display_name, uri: du.uri, username: sudp.username, domain: sudp.domain}
}

const parse_cseq = (msg) => {
    var cseq = get_header('cseq', msg)
    if(!cseq) return undefined

    cseq = cseq.trim().split(/\W+/)

    var seq = parseInt(cseq[0])
    msg.$cs = seq

    if(!msg.$rm) {
        msg.$rm = cseq[1]
    }
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
            .map(x => { return [x[0], x[1] ? x[1].replace(/^"|"$/g, '') : undefined] }) // remove double quotes from values
            .fromPairs() // covert key/value pairs to object
            .value()
    } else {
        msg.auth = {}
    }

    var user_and_domain = msg.auth.username ? msg.auth.username.split('@') : []

    msg.$adu = msg.auth.uri
    msg.$aa  = msg.auth.algorithm
    msg.$ar  = msg.auth.realm
    msg.$au  = user_and_domain[0]
    msg.$ad  = user_and_domain[1]
    msg.$aU  = msg.auth.username
    msg.$an  = msg.auth.nonce
    msg['$auth.nonce'] = msg.$an
    msg['$auth.resp'] = msg.auth.response
    msg['$auth.opaque'] = msg.auth.opaque
    msg['$auth.alg'] = msg.$aa
    msg['$auth.qop'] = msg.auth.qop
    msg['$auth.nc'] = msg.auth.nc
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
    $tt: (msg) => { return get(msg, parse_to, '$tt') },

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
    $an : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$an') },

    '$auth.nonce'  : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$auth.nonce') },
    '$auth.resp'   : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$auth.resp') },
    '$auth.opaque' : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$auth.opaque') },
    '$auth.alg'    : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$auth.alg') },
    '$auth.qop'    : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$auth.qop') },
    '$auth.nc'     : (msg) => { return get(msg, parse_authorization_or_proxy_authorization, '$auth.nc') },

    $ai: (msg) => { return get(msg, parse_pai, '$ai') },

    $di: (msg) => { return get(msg, parse_diversion, '$di') },
    $dip: (msg) => { return get(msg, parse_diversion, '$dip') },
    $dir: (msg) => { return get(msg, parse_diversion, '$dir') },

    $re: (msg) => { return get(msg, parse_rpi, '$re') },

    $rt: (msg) => { return get(msg, parse_refer_to, '$rt') },

    $cs: (msg) => { return get(msg, parse_cseq, '$cs') },

    $rb: (msg) => { return msg.body },

    $ua: (msg) => { return get_header('user-agent', msg) },

    $ci: (msg) => { return get_header('call-id', msg) },

    $cl: (msg) => { return get_header('content-length', msg) },

    $ct: (msg) => { return get_header('contact', msg) },

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

                var match = undefined

                if (key.startsWith("hdr_")) {
                    var name = key.slice(4).replace(/_/g, "-")
                    if(compact_headers[name]) {
                        name = compact_headers[name]
                    }

                    target[key] = get_header(name, target) 
                    return target[key]
                }

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

                return undefined
            },
        })

        return o
    },

    parse_displayname_and_uri,

    compact_headers,
}

