const sp = require('../index.js')

test('parse_displayname_and_uri', () => {
    expect(sp.parse_displayname_and_uri('sip:fluffy@cisco.com')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('sip:fluffy@cisco.com;carrierid=1234')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com;carrierid=1234',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('sip:fluffy@cisco.com;carrierid=1234;cacode=1')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com;carrierid=1234;cacode=1',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('<sip:fluffy@cisco.com>')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('<sip:fluffy@cisco.com;carrierid=1234;cacode=1>')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com;carrierid=1234;cacode=1',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('<sip:fluffy@cisco.com>;origin=secret')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com',
        params: {
            origin: 'secret',
        },
    })

    expect(sp.parse_displayname_and_uri('<sip:fluffy@cisco.com;cacode=1234>;origin=secret')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com;cacode=1234',
        params: {
            origin: 'secret',
        },
    })

    expect(sp.parse_displayname_and_uri('<sip:fluffy@cisco.com;carrierid=1234;cacode=1>;origin=secret')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com;carrierid=1234;cacode=1',
        params: {
            origin: 'secret',
        },
    })

    expect(sp.parse_displayname_and_uri('"Cullen Jennings" <sip:fluffy@cisco.com>')).toStrictEqual({
        displayname: "Cullen Jennings",
        uri: 'sip:fluffy@cisco.com',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('"Cullen Jennings" <sip:fluffy@cisco.com;carrierid=1234>')).toStrictEqual({
        displayname: "Cullen Jennings",
        uri: 'sip:fluffy@cisco.com;carrierid=1234',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('"Cullen Jennings" <sip:fluffy@cisco.com;carrierid=1234;cacode=1>')).toStrictEqual({
        displayname: "Cullen Jennings",
        uri: 'sip:fluffy@cisco.com;carrierid=1234;cacode=1',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('"Cullen Jennings" <sip:fluffy@cisco.com;carrierid=1234;cacode=1>;origin=secret')).toStrictEqual({
        displayname: "Cullen Jennings",
        uri: 'sip:fluffy@cisco.com;carrierid=1234;cacode=1',
        params: {
            origin: 'secret'
        },
    })

    expect(sp.parse_displayname_and_uri('"Cullen Jennings" <sip:fluffy@cisco.com;carrierid=1234;cacode=1>;origin=secret;color=blue')).toStrictEqual({
        displayname: "Cullen Jennings",
        uri: 'sip:fluffy@cisco.com;carrierid=1234;cacode=1',
        params: {
            origin: 'secret',
            color: 'blue',
        },
    })

    expect(sp.parse_displayname_and_uri('Mickey <sip:123123@disney.com;carrierid=1234;cacode=1>;origin=fantasia;color=red')).toStrictEqual({
        displayname: "Mickey" ,
        uri: 'sip:123123@disney.com;carrierid=1234;cacode=1',
        params: {
            origin: 'fantasia',
            color: 'red',
        },
    })

    expect(sp.parse_displayname_and_uri('Zod<sip:123123@dc.com;carrierid=1234;cacode=1>;origin=negative-zone;color=blue')).toStrictEqual({
        displayname: "Zod" ,
        uri: 'sip:123123@dc.com;carrierid=1234;cacode=1',
        params: {
            origin: 'negative-zone',
            color: 'blue',
        },
    })
})
