const sp = require('../index.js')

test('REGISTER with Authorization header', () => {
	var s = `REGISTER sip:alice@atlanta.com SIP/2.0
Via: SIP/2.0/UDP 10.255.255.199:6061;rport;branch=z9hG4bKPjb169c16c-892f-4680-93a6-f4adb80bb477
Max-Forwards: 70
From: <sip:alice@atlanta.com>;tag=1928301774
To: <sip:alice@atlanta.com>
Call-ID: 9816c895-2655-4587-94fd-63a71b6dbbd5
CSeq: 33558 REGISTER
Contact: <sip:alice@10.255.255.199:6061>
Expires: 0
P-Home-Nebula: Eagle
Authorization: Digest username="alice", realm="philolaus", algorithm="MD5-sess" nonce="YwlawmMJWZYy5SvWK0BKihxsDkQusC+y", nc=00000001, uri="sip:strategy.com", response="3a3095e91d9e8c2dcabef86695efd5"
Content-Length:  0

`
	s = s.replace(/\n/g, "\r\n")

	var p = sp.parse(s)

    expect(p.$mt).toBe(1)
    expect(p.$ml).toBe(s.length)
	expect(p.$rz).toBe("sip")
	expect(p.$rU).toBe("alice")
	expect(p.$ru).toBe("sip:alice@atlanta.com")
	expect(p['$hdr(From)']).toBe('<sip:alice@atlanta.com>;tag=1928301774')
	expect(p['$(hdrcnt(Via))']).toBe(1)
	expect(p['$(hdrcnt(v))']).toBe(1)
	expect(p['$hdr(v)']).toBe('SIP/2.0/UDP 10.255.255.199:6061;rport;branch=z9hG4bKPjb169c16c-892f-4680-93a6-f4adb80bb477')
    expect(p.$cs).toBe(33558)
	expect(p.$cl).toBe('0')
	expect(p.$rb).toBe(undefined)
    expect(p.$adu).toBe('sip:strategy.com')
    expect(p.$aa).toBe("MD5-sess")
    expect(p.$ar).toBe("philolaus")
    expect(p.$au).toBe("alice")
    expect(p.$ad).toBe(undefined)
    expect(p.$an).toBe('YwlawmMJWZYy5SvWK0BKihxsDkQusC+y')
    expect(p['$auth.resp']).toBe('3a3095e91d9e8c2dcabef86695efd5')
    expect(p['$auth.nonce']).toBe('YwlawmMJWZYy5SvWK0BKihxsDkQusC+y')
    expect(p['$auth.opaque']).toBe(undefined)
    expect(p['$auth.alg']).toBe("MD5-sess")
    expect(p['$auth.qop']).toBe(undefined)
    expect(p['$auth.nc']).toBe('00000001')
    expect(p.$aU).toBe("alice")
    expect(p.$rv).toBe('SIP/2.0')
    expect(p.$rs).toBe(undefined)
    expect(p.$rr).toBe(undefined)

    expect(p.hdr_max_FORWARDS).toBe("70")
    expect(p.hdr_P_home_NeBuLa).toBe("Eagle")
})

test('INVITE with Proxy-Authorization header', () => {
	var s = `INVITE tel:0011223344@biloxi.com;carrierid=1234;cacode=1 SIP/2.0
Via: SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1
Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1
Max-Forwards: 70
To: Bob <sip:bob@biloxi.com>
From: Alice <sip:alice@atlanta.com;color=blue>;tag=1928301774
Call-ID: a84b4c76e66710
CSeq: 314159 INVITE
USER-AGENT: SomeUA 123.0
Contact: <sip:alice@pc33.atlanta.com>
Content-Type: application/sdp
Proxy-Authorization: Digest username="alice@atlanta.com", realm="trapezoid", algorithm="MD5", opaque="someopaque", qop="someqop", nonce="YwlawmMJWZYy5SvWK0BKihxsDkQusC+y", uri="sip:0011223344@biloxi.com", response="3a3095e91d9e8c2dcabef86695efd5"
Route: <sip:192.168.2.198:9060;lr;r2=on;ftag=2d20cea8;did=a57.05>
Route: <sip:192.168.2.198;lr;r2=on;ftag=2d20cea8-527ddsf;did=a57.05>
Diversion: <sip:11223344@test.com>;reason=user-busy;counter=1;privacy=full
cONTENT-lENGTH: 142

v=0
o=root 123 456 IN IP4 1.2.3.4
a=rtpmap:0 pcmu/8000
a=sendrecv`

	s = s.replace(/\n/g, "\r\n")

	var p = sp.parse(s)

    expect(p.$mt).toBe(1)
    expect(p.$ml).toBe(s.length)
	expect(p.$rz).toBe("tel")
	expect(p.$rU).toBe("0011223344")
	expect(p.$ru).toBe("tel:0011223344@biloxi.com;carrierid=1234;cacode=1")
	expect(p['$hdr(From)']).toBe('Alice <sip:alice@atlanta.com;color=blue>;tag=1928301774')
	expect(p['$(hdrcnt(Via))']).toBe(2)
	expect(p['$hdr(v)']).toBe('SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
	expect(p['$(hdr(v)[0])']).toBe('SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
	expect(p['$(hdr(v)[1])']).toBe('SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1')
	expect(p['$(hdr(v)[-1])']).toBe('SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1')
	expect(p['$(hdr(v)[*])']).toBe(p['$(hdr(v)[0])'] + ',' + p['$(hdr(v)[1])'])
	expect(p['$(hdr(v)[3])']).toBe(undefined)
    expect(p.$cs).toBe(314159)
	expect(p.$ua).toBe('SomeUA 123.0')
	expect(p.$ci).toBe('a84b4c76e66710')
	expect(p.$cT).toBe('application/sdp')
	expect(p.$cl).toBe('142')
	expect(p.$rb).toBe('v=0\r\no=root 123 456 IN IP4 1.2.3.4\r\na=rtpmap:0 pcmu/8000\r\na=sendrecv')
    expect(p.$adu).toBe('sip:0011223344@biloxi.com')
    expect(p.$aa).toBe('MD5')
    expect(p.$ar).toBe("trapezoid")
    expect(p.$au).toBe("alice")
    expect(p.$ad).toBe("atlanta.com")
    expect(p.$aU).toBe("alice@atlanta.com")
    expect(p['$auth.resp']).toBe('3a3095e91d9e8c2dcabef86695efd5')
    expect(p['$auth.nonce']).toBe('YwlawmMJWZYy5SvWK0BKihxsDkQusC+y')
    expect(p['$auth.opaque']).toBe('someopaque')
    expect(p['$auth.alg']).toBe("MD5")
    expect(p['$auth.qop']).toBe('someqop')
    expect(p.$di).toBe('sip:11223344@test.com')
    expect(p.$dip).toBe('full')
    expect(p.$dir).toBe('user-busy')
    expect(p.$rv).toBe('SIP/2.0')
    expect(p.$rs).toBe(undefined)
    expect(p.$rr).toBe(undefined)
    expect(p.$route_uri).toBe('sip:192.168.2.198:9060;lr;r2=on;ftag=2d20cea8;did=a57.05')
    expect(p.$ft).toBe('1928301774')
})


test('Response', () => {
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

    expect(p.$mt).toBe(2)
    expect(p.$ml).toBe(s.length)
    expect(p.$rz).toBe(undefined)
	expect(p.$rs).toBe("180")
	expect(p.$rr).toBe("I'm coming")
	expect(p.$fU).toBe("alice")
	expect(p.$fUl).toBe("alice".length)
	expect(p.$fn).toBe('Alice')
	expect(p.$tU).toBe("bob")
	expect(p['$hdr(From)']).toBe('Alice <sip:alice@atlanta.com>;tag=1928301774')
	expect(p['$(hdrcnt(Via))']).toBe(3)
	expect(p['$hdr(v)']).toBe('SIP/2.0/UDP server10.biloxi.com;branch=z9hG4bK4b43c2ff8.1;received=192.0.2.3')
	expect(p.$ua).toBe('SuperSIP')
	expect(p.$cl).toBe('0')
    expect(p.$rv).toBe('SIP/2.0')
    expect(p.$cs).toBe(314159)
    expect(p.$rm).toBe('INVITE')
})


test('compact headers', () => {
	var s = `INVITE sips:bob@biloxi.com SIP/2.0
v: SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1
v: SIP/2.0/TLS pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1
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

	expect(p.$mt).toBe(1)
	expect(p.$rz).toBe("sips")
	expect(p.$rU).toBe("bob")
	expect(p.$ru).toBe("sips:bob@biloxi.com")
	expect(p['$hdr(From)']).toBe('Alice <sip:alice@atlanta.com>;tag=1928301774')
	expect(p['$(hdrcnt(Via))']).toBe(2)
	expect(p['$hdr(v)']).toBe('SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
	expect(p['$(hdrcnt(Via))']).toBe(2)
	expect(p['$(hdr(v)[0])']).toBe('SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
	expect(p['$(hdr(v)[1])']).toBe('SIP/2.0/TLS pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1')
	expect(p.$ua).toBe('SomeUA')
	expect(p.$ci).toBe('a84b4c76e66710')
	expect(p.$cT).toBe('application/sdp')
	expect(p.$cl).toBe('142')
    expect(p.hdr_v).toBe('SIP/2.0/UDP bigbox3.site3.atlanta.com;branch=z9hG4bK77ef4c2312983.1')
    expect(p.hdr_l).toBe('142')
})

test('P-Identity headers', () => {
	var s = `INVITE tel:0011223344@biloxi.com SIP/2.0
Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8;received=192.0.2.1
Max-Forwards: 70
To: Bob <sip:bob@biloxi.com>
From: Alice <sip:alice@atlanta.com>;tag=1928301774
Call-ID: a84b4c76e66710
CSeq: 314159 INVITE
Contact: <sip:alice@pc33.atlanta.com>
Content-Type: application/sdp
P-Asserted-Identity: <sip:12345227101@sip.domain.de;user=phone>
P-Preferred-Identity: <sip:123452270@sip.domain.de:5060>
Route: <sip:192.168.2.198;lr;r2=on;ftag=2d20cea8-527ddsf;did=a57.05>
Diversion: <sip:11223344@test.com>;reason=user-busy;counter=1;privacy=full
content-length: 142

v=0
o=root 123 456 IN IP4 1.2.3.4
a=rtpmap:0 pcmu/8000
a=sendrecv`

	s = s.replace(/\n/g, "\r\n")

	var p = sp.parse(s)

    expect(p.$mt).toBe(1)
    expect(p.$ml).toBe(s.length)
	expect(p.$rz).toBe("tel")
	expect(p.$pn).toBe(undefined)
	expect(p.$pU).toBe("123452270")
	expect(p.$pd).toBe("sip.domain.de")
	expect(p.$pu).toBe("sip:123452270@sip.domain.de:5060")
	expect(p.$ai).toBe("sip:12345227101@sip.domain.de;user=phone")
    expect(p.$di).toBe('sip:11223344@test.com')
    expect(p.$dip).toBe('full')
    expect(p.$dir).toBe('user-busy')
})

