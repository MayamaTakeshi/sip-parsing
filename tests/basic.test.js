const sp = require('../index.js')

test('request', () => {
	var s = `INVITE sip:bob@biloxi.com SIP/2.0
Via: SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1
Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1
Max-Forwards: 70
To: Bob <sip:bob@biloxi.com>
From: Alice <sip:alice@atlanta.com>;tag=1928301774
Call-ID: a84b4c76e66710
CSeq: 314159 INVITE
USER-AGENT: SomeUA 123.0
Contact: <sip:alice@pc33.atlanta.com>
Content-Type: application/sdp
cONTENT-lENGTH: 142

v=0
o=root 123 456 IN IP4 1.2.3.4
a=rtpmap:0 pcmu/8000
a=sendrecv`

	s = s.replace(/\n/g, "\r\n")

	var p = sp.parse(s)

	expect(p.$rU).toBe("bob")
	expect(p.$ru).toBe("sip:bob@biloxi.com")
	expect(p['$hdr(From)']).toBe('Alice <sip:alice@atlanta.com>;tag=1928301774')
	expect(p['$(hdrcnt(Via))']).toBe(2)
	expect(p['$hdr(v)']).toBe('SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
	expect(p['$(hdrcnt(Via))']).toBe(2)
	expect(p['$(hdr(v)[0])']).toBe('SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
	expect(p['$(hdr(v)[1])']).toBe('SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1')
	expect(p['$(hdr(v)[-1])']).toBe('SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1')
	expect(p['$(hdr(v)[*])']).toBe(p['$(hdr(v)[0])'] + ',' + p['$(hdr(v)[1])'])
	expect(p['$(hdr(v)[3])']).toBe(null)
    expect(p.$cs).toBe(314159)
	expect(p.$ua).toBe('SomeUA 123.0')
	expect(p.$ci).toBe('a84b4c76e66710')
	expect(p.$cT).toBe('application/sdp')
	expect(p.$cl).toBe('142')
	expect(p.$rb).toBe('v=0\r\no=root 123 456 IN IP4 1.2.3.4\r\na=rtpmap:0 pcmu/8000\r\na=sendrecv')

    expect(p.$rs).toBe(null)
    expect(p.$rr).toBe(null)
})


test('response', () => {
	var s = `SIP/2.0    180    I'm coming
Via: SIP/2.0/UDP server10.biloxi.com;branch=z9hG4bK4b43c2ff8.1;received=192.0.2.3
Via: SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1;received=192.0.2.2
Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1
To: Bob <sip:bob@biloxi.com>;tag=a6c85cf
From: Alice <sip:alice@atlanta.com>;tag=1928301774
Call-ID: a84b4c76e66710
Contact: <sip:bob@192.0.2.4>
CSeq: 314159 INVITE
User-Agent: SuperSIP
Content-Length: 0
`

	s = s.replace(/\n/g, "\r\n")

	var p = sp.parse(s)

	expect(p.$rs).toBe("180")
	expect(p.$rr).toBe("I'm coming")
	expect(p.$fU).toBe("alice")
	expect(p.$fn).toBe('Alice')
	expect(p.$tU).toBe("bob")
	expect(p['$hdr(From)']).toBe('Alice <sip:alice@atlanta.com>;tag=1928301774')
	expect(p['$(hdrcnt(Via))']).toBe(3)
	expect(p['$hdr(v)']).toBe('SIP/2.0/UDP server10.biloxi.com;branch=z9hG4bK4b43c2ff8.1;received=192.0.2.3')
	expect(p.$ua).toBe('SuperSIP')
	expect(p.$cl).toBe('0')

    expect(p.$cs).toBe(314159)
    expect(p.$rm).toBe('INVITE')
})


test('compact headers', () => {
	var s = `INVITE sip:bob@biloxi.com SIP/2.0
v: SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1
v: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1
Max-Forwards: 70
t: Bob <sip:bob@biloxi.com>
f: Alice <sip:alice@atlanta.com>;tag=1928301774
i: a84b4c76e66710
CSeq: 314159 INVITE
USER-AGENT: SomeUA
m: <sip:alice@pc33.atlanta.com>
c:    application/sdp
l: 142

[Alice's SDP not shown]`

	s = s.replace(/\n/g, "\r\n")

	var p = sp.parse(s)

	expect(p.$rU).toBe("bob")
	expect(p.$ru).toBe("sip:bob@biloxi.com")
	expect(p['$hdr(From)']).toBe('Alice <sip:alice@atlanta.com>;tag=1928301774')
	expect(p['$(hdrcnt(Via))']).toBe(2)
	expect(p['$hdr(v)']).toBe('SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
	expect(p['$(hdrcnt(Via))']).toBe(2)
	expect(p['$(hdr(v)[0])']).toBe('SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
	expect(p['$(hdr(v)[1])']).toBe('SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1')
	expect(p.$ua).toBe('SomeUA')
	expect(p.$ci).toBe('a84b4c76e66710')
	expect(p.$cT).toBe('application/sdp')
	expect(p.$cl).toBe('142')
})


