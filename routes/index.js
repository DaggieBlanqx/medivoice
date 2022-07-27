'use strict';
const router = require('express').Router();
const ElarianCore = require('elarian');
const { VoiceHelper } = require('../utils/IVR_helpers');

const ATVoice = new VoiceHelper({
    AT_apiKey: process.env.AT_APP_APIKEY,
    AT_username: process.env.AT_APP_USERNAME,
    AT_virtualNumber: process.env.AT_VIRTUAL_NUMBER,
});

const CustomerSession = new Map();

let Elarian = new ElarianCore.Elarian({
    appId: process.env.elarianAPP_ID,
    orgId: process.env.elarianORG_ID,
    apiKey: process.env.elarianAPI_KEY,
});

let FWpaymentLink = 'https://flutterwave.com/pay/uqvzbuxv9tyt';
let applink = 'https://shoppichat.herokuapp.com/';

router.post('/callback', async (req, res) => {
    try {
    } catch (error) {
        console.error({ error });
        return res.sendStatus(500);
    }
});

router.get('/', async (req, res) => {
    let callRepresentativeName = ATVoice.generateATClientName({
        isForInitialization: true,
        firstName: 'doctor',
    });
    const ct = await ATVoice.generateCapabilityToken({
        callRepresentativeName,
    });

    res.json({ ct });
});

const handleDTMF = () => {};
const handleIncomingCall = () => {};
const generateCapabilityToken = () => {};

const runElarian = () => {
    Elarian.on('error', () => {
        console.error('Elarian app encountered an error');
        process.exit(1);
    })
        .on('connected', async () => {
            const customer = new Elarian.Customer({
                number: recipientPhone,
                provider: 'cellular',
            });

            customer.updateMetadata({
                name: 'Daggie',
                age: 25,
            });
        })
        .connect();
};

module.exports = router;
