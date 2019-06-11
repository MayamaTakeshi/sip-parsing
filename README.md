# sip-parsing
Parses SIP messages and allows access using using opensips/kamailio/openser pseudo-variables syntax.

Sample usage:
```
const sip_parsing = require('sip-parsing')
const assert = require('assert')

var s = `INVITE sip:bob@biloxi.com SIP/2.0
Via: SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1
Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1
Max-Forwards: 70
To: Bob <sip:bob@biloxi.com>
From: Alice <sip:alice@atlanta.com>;tag=1928301774
Call-ID: a84b4c76e66710
CSeq: 314159 INVITE
USER-AGENT: SomeUA
Contact: <sip:alice@pc33.atlanta.com>
Content-Type: application/sdp
cONTENT-lENGTH: 142

v=0
o=root 123 456 IN IP4 1.2.3.4
a=rtpmap:0 pcmu/8000
a=sendrecv`

s = s.replace(/\n/g, "\r\n")

var msg = sp.parse(s)

assert(msg.$rU == "bob")
assert(msg.$ru == "sip:bob@biloxi.com")
assert(msg['$hdr(From)'] == 'Alice <sip:alice@atlanta.com>;tag=1928301774')
assert(msg['$(hdrcnt(Via))'] == 2)
assert(msg['$hdr(v)'] == 'SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
assert(msg['$(hdr(v)[0])'] == 'SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
assert(msg['$(hdr(v)[1])'] == 'SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1')
assert(msg.$ua == 'SomeUA')
assert(msg.$ci == 'a84b4c76e66710')
assert(msg.$cT == 'application/sdp')
assert(msg.$cl == '142')
assert(msg.$rb == 'v=0\r\no=root 123 456 IN IP4 1.2.3.4\r\na=rtpmap:0 pcmu/8000\r\na=sendrecv')

```
