'use strict';
const router = require('express').Router();
const { VoiceHelper } = require('../utils/IVR_helpers');

let AT_apiKey = process.env.AT_APP_APIKEY,
    AT_username = process.env.AT_APP_USERNAME,
    AT_virtualNumber = process.env.AT_VIRTUAL_NUMBER,
    APP_URL = process.env.APP_URL;

const ATVoice = new VoiceHelper({
    AT_apiKey,
    AT_username,
    AT_virtualNumber,
});

const CustomerSession = new Map();

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
            callActions = ATVoice.survey({
                textPrompt: `Welcome to A T hospital. Press 1 to record your symptoms. Press 2 to speak to Doctor Michael. After selecting your option, press the hash key`,
                finishOnKey: '#',
                timeout: 7,
                callbackUrl: `${APP_URL}/survey`,
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

router.post('/survey', (req, res) => {
    let callActions,
        responseAction,
        done = false,
        pressedKey = req.body.dtmfDigits;

    if (!isNaN(pressedKey)) {
        console.log(`Pressed ${pressedKey}`);
        if (pressedKey == 1) {
            callActions = ATVoice.partialRecord({
                introductionText: `Our doctor is currently seeing another patient. He will attend to you shortly, In the meantime, tell us how you are feeling and then press the hashkey.`,
            });
            done = true;
        } else if (pressedKey == 2) {
            callActions = ATVoice.linkCustomerToOfflineAgent({
                offline_phone: '+254773841221',
            });
            done = true;
        }
    }

    if (!done) {
        callActions = ATVoice.saySomething({
            speech: 'Sorry, you did not press 1 nor 2. Goodbye.',
        });
    }

    console.log(`[post]: for survey`);
    console.log({
        surveyBody: pressedKey,
    });

    responseAction = `<?xml version="1.0" encoding="UTF-8"?><Response>${callActions}</Response>`;
    return res.send(responseAction);
});

module.exports = router;
