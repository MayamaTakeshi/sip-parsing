const sp = require('../index.js')

test('parse_displayname_and_uri', () => {
    expect(sp.parse_displayname_and_uri('sip:fluffy@cisco.com')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('sip:fluffy@cisco.com;color=black')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com',
        params: {
            color: 'black',
        },
    })

    expect(sp.parse_displayname_and_uri('<sip:fluffy@cisco.com>')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('<sip:fluffy@cisco.com>;origin=secret')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:fluffy@cisco.com',
        params: {
            origin: 'secret',
        },
    })

    expect(sp.parse_displayname_and_uri('"Cullen Jennings" <sip:fluffy@cisco.com>')).toStrictEqual({
        displayname: "Cullen Jennings",
        uri: 'sip:fluffy@cisco.com',
        params: {},
    })

    expect(sp.parse_displayname_and_uri('<sip:12345227101@sip.domain.de;user=phone>')).toStrictEqual({
        displayname: undefined,
        uri: 'sip:12345227101@sip.domain.de',
        params: {user: 'phone'},
    })

    expect(sp.parse_displayname_and_uri('Mickey <sip:123123@disney.com;origin=fantasia;color=red>')).toStrictEqual({
        displayname: "Mickey" ,
        uri: 'sip:123123@disney.com',
        params: {
            origin: 'fantasia',
            color: 'red',
        },
    })

    expect(sp.parse_displayname_and_uri('Goofy<sip:123123@disney.com;origin=fault;color=blue>')).toStrictEqual({
        displayname: "Goofy" ,
        uri: 'sip:123123@disney.com',
        params: {
            origin: 'fault',
            color: 'blue',
        },
    })

    expect(sp.parse_displayname_and_uri('Minnie<sip:123123@disney.com;origin=shadow;color=green>;location=secret;team=apricot')).toStrictEqual({
        displayname: "Minnie" ,
        uri: 'sip:123123@disney.com',
        params: {
            origin: 'shadow',
            color: 'green',
            location: 'secret',
            team: 'apricot',
        },
    })
})
