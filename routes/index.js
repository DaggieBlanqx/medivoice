'use strict';
const router = require('express').Router();
const ElarianCore = require('elarian');
const { VoiceHelper } = require('../utils/IVR_helpers');

let AT_apiKey = process.env.AT_APP_APIKEY,
    AT_username = process.env.AT_APP_USERNAME,
    AT_virtualNumber = process.env.AT_VIRTUAL_NUMBER;

const ATVoice = new VoiceHelper({
    AT_apiKey,
    AT_username,
    AT_virtualNumber,
});

const CustomerSession = new Map();

let Elarian = new ElarianCore.Elarian({
    appId: process.env.elarianAPP_ID,
    orgId: process.env.elarianORG_ID,
    apiKey: process.env.elarianAPI_KEY,
});

let FWpaymentLink = 'https://flutterwave.com/pay/uqvzbuxv9tyt';
let applink = 'https://medivoice.herokuapp.com/';

router.post('/callback_url', async (req, res) => {
    try {
        let clientDialedNumber = req.body.clientDialedNumber;
        let callActions, responseAction, redirectUrl, lastRegisteredClient;
        let callerNumber = req.body.callerNumber;
        let destinationNumber = req.body.destinationNumber;

        if (clientDialedNumber) {
            // assumes a browser tried to make a call to either virtualNumber(Dequeue) or a customer number(outgoing call)

            if (clientDialedNumber === AT_virtualNumber) {
                // Browser wants to dequeue a call - ignore this logic for now
            } else {
                // Browser wants to make a call to a customer number
                callActions = ATVoice.converseViaBrowser({
                    role: 'VCC_TO_CUSTOMER',
                    customerNumber: clientDialedNumber,
                });
            }
        } else {
            // Here we assume the call is incoming from a customer to the hospital
            // Lead customer to survey form: DTMF
            callActions = ATVoice.saySomething({
                speech: 'Hello world!',
            });
        }

        responseAction = `<?xml version="1.0" encoding="UTF-8"?><Response>${callActions}</Response>`;
        console.log({ responseAction });
        return res.send(responseAction);
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
    ct.status === 'successful'
        ? res.json({ ...ct.data })
        : res.json({ failed: true });
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
