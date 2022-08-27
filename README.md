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

var msg = sip_parsing.parse(s)

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

Here is the full list of supported pseudo-variables:

```
    $rm : request method ('INVITE', 'ACK', 'BYE' etc)

    $fn  : header From DisplayName
    $fu  : header From URI
    $fU  : header From UserName
    $fd  : header From Domain
    $ft: : header From parameter tag
    $fUl : header From UserName length

    $tn : header To DisplayName
    $tu : header To URI
    $tU : header To UserName
    $td : header To Domain
    $tt : headet To parameter tag

    $pn : header P-Preferred-Identity DisplayName
    $pu : header P-Preferred-Identity URI
    $pU : header P-Preferred-Identity UserName
    $pd : header P-Preferred-Identity Domain

    $adu: header Authorization or Proxy-Authorization uri
    $aa : header Authorization or Proxy-Authorization algorithm
    $ar : header Authorization or Proxy-Authorization realm
    $au : header Authorization or Proxy-Authorization user part of username
    $ad : header Authorization or Proxy-Authorization domain part of username
    $aU : header Authorization or Proxy-Authorization username
    $an : header Authorization or Proxy-Authorization nonce

    $ai : header P-Asserted-Identity URI

    $di  : header Diversion URI
    $dip : header Diversion parameter privacy
    $dir : header Diversion parametter reason

    $re : header Remote-Party-ID URI

    $rt : header Refer-To URI

    $cs : header CSeq seq
    
    $rb : msg body
    $ua : header User-Agent

    $ci : header Call-ID

    $cl : header Content-Length

    $cT : header Content-Type

    $ml : msg length

    $mt : msg type 1 (request) or 2 (reply)

    $route_uri: first Route header URI

    '$msg.is_request' : 1 (true) or 0 (false)
    '$msg.type' : 'request' or 'reply'

    '$auth.nonce'  : header Authorization or Proxy-Authorization nonce
    '$auth.resp'   : header Authorization or Proxy-Authorization response
    '$auth.opaque' : header Authorization or Proxy-Authorization opaque
    '$auth.alg'    : header Authorization or Proxy-Authorization algorithm
    '$auth.qop'    : header Authorization or Proxy-Authorization qop
```

Obs: some pseudo-variables are redundant but this is because we combined the pseudo-variables provided by openser/opensips/kamailio.

Also we support these special pseudo-variables defined by kamailio/opensips:
```
  '$(hdrcnt(HEADER_NAME))' : number of header with that name in the msg
  '$hdr(HEADER_NAME)' : gets the first header with HEADER_NAME in the msg
  '$(hdr(HEADER_NAME)[n])' : gets the nth header with name HEADER_NAME in the msg 
```

As an altenative to simplify specifying headers you can use:
```
  hdr_HEADER_NAME
or
  hdr_COMPACTNAME
```
Ex:
```
  assert(msg.hdr_max_forwards == '70')
  assert(msg.hdr_c == 'application/sdp')
```
Obs: you must replace dashes in the header names with underscores.


A few pseudo-variables are currently not supported (as I need more details to implement them):
```
$(rb[*]) - same as $rb

$(rb[n]) - the n-th body belonging to a multi-part body from the beginning of message, starting with index 0

$(rb[-n]) - the n-th body belonging to a multi-part body from the end of the message, starting with index -1 (the last contact instance)

$rb(application/sdp) - get the first SDP body part

$(rb(application/isup)[-1]) - get the last ISUP body part

$ru_q - reference to q value of the R-URI

```

Ref:

https://www.kamailio.org/wiki/cookbooks/5.4.x/pseudovariables

https://www.opensips.org/Documentation/Script-CoreVar-3-4
