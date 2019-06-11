const sp = require('../index.js')

s = `INVITE sip:bob@biloxi.com SIP/2.0
Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bK776asdhds
Max-Forwards: 70
To: Bob <sip:bob@biloxi.com>
From: Alice <sip:alice@atlanta.com>;tag=1928301774
Call-ID: a84b4c76e66710@pc33.atlanta.com
CSeq: 314159 INVITE
Contact: <sip:alice@pc33.atlanta.com>
Content-Type: application/sdp
Content-Length: 142

(Alice's SDP not shown)
`
s = s.replace(/\n/g, "\r\n")

var p = sp.gen_parser(s)

console.dir(p)
console.log("$rU", p.$rU)
console.log("$ru", p.$ru)
console.log("$hdr(From)", p['$hdr(From)'])
console.dir(p)
