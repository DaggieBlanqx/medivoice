'use strict';
const axios = require('axios');
const AfricasTalking = require('africastalking');

class VoiceHelper {
    constructor({ AT_apiKey, AT_username, AT_virtualNumber }) {
        if (!AT_apiKey || !AT_username || !AT_virtualNumber) {
            throw new Error(
                'Missing required parameters: AT_apiKey,AT_username,AT_virtualNumber,'
            );
        }

        this.AT_apiKey = AT_apiKey;
        this.AT_username = AT_username;
        this.AT_virtualNumber = AT_virtualNumber;
        this.ATVOICE = AfricasTalking({
            apiKey: this.AT_apiKey,
            username: this.AT_username,
        }).VOICE;
    }

    generateATClientName({ isForInitialization, firstName }) {
        if (isForInitialization) {
            return `elariandemo-${firstName}`;
        } else {
            return `${this.AT_username}.elariandemo-${firstName}`;
        }
    }

    async generateCapabilityToken({ callRepresentativeName }) {
        if (!callRepresentativeName) {
            throw new Error(`Provide a "callRepresentativeName"`);
        }

        const url =
            'https://webrtc.africastalking.com/capability-token/request';

        let data = {
            username: this.AT_username,
            phoneNumber: this.AT_virtualNumber,
            clientName: callRepresentativeName,
            incoming: 'true',
            outgoing: 'true',
            expire: `${3 * 60 * 60}s`,
        };

        if (data.username && data.clientName && data.phoneNumber) {
            // add apiKey here
            axios.defaults.headers.common['APIKEY'] = this.AT_apiKey;
            axios.defaults.headers.post['Content-Type'] = 'application/json';

            return await axios({
                method: 'post',
                url,
                data,
            })
                .then((response) => {
                    let responseData = response.data;
                    return {
                        status: 'successful',
                        data: responseData,
                    };
                })
                .catch((error) => {
                    console.log({ error });
                    return {
                        status: 'failure',
                        data: null,
                        error,
                    };
                });
        }
    }

    saySomething({ speech }) {
        if (!speech) {
            throw new Error(`Provide a "speech"`);
        }
        let neuralNetVoice = 'en-US-Wavenet-C' || 'en-GB-Neural2-A';
        let callActions = `<Say  playBeep="true" voice="${neuralNetVoice}"><speak>${speech}</speak></Say>`;
        return callActions;
    }

    playAudioFile({ introductionText, audioFileUrl }) {
        let callActions;
        if (!audioFileUrl) {
            throw new Error(`Provide a "audioFileUrl"`);
        }
        if (introductionText) {
            callActions = `<Say>${introductionText}</Say><Play url="${audioFileUrl}"/>`;
            return callActions;
        } else {
            callActions = `<Play url="${audioFileUrl}"/>`;
            return callActions;
        }
    }

    converseViaBrowser({ role, lastRegisteredClient, customerNumber }) {
        let callActions;

        if (role === 'VCC_TO_CUSTOMER' && customerNumber) {
            callActions = `<Dial phoneNumbers="${customerNumber}"  record="true"/>`;
        } else if (role === 'CUSTOMER_TO_VCC' && lastRegisteredClient) {
            callActions = `<Dial phoneNumbers="${this.AT_virtualNumber},${lastRegisteredClient}"/>`;
        } else {
            let error = {
                status: 'failure',
                errorList: [
                    {
                        message: 'Not able to converse via browser',
                        code: 'CONVERSE_VIA_BROWSER_FAILED',
                        advise: `The role "VCC_TO_CUSTOMER" requires "customerNumber", while the role ""CUSTOMER_TO_VCC" requires "lastRegisteredClient" to be provided.`,
                    },
                ],
            };
            signale.error(error);
            throw new Error('Invalid parameters.');
        }
        return callActions;
    }

    partialRecord({
        introductionText,
        audioProcessingUrl,
        maxDuration,
        maxTimeout,
    }) {
        if (!introductionText) {
            throw new Error(`Provide "introductionText"`);
        }

        maxDuration = maxDuration && maxDuration < 10 ? maxDuration : 10;
        maxTimeout = maxTimeout && maxTimeout < 10 ? maxTimeout : 10;

        let callActions = `<Record finishOnKey="#" maxLength="${maxDuration}" timeout="${maxTimeout}" trimSilence="true" playBeep="true"  callbackUrl="${audioProcessingUrl}"><Say>${introductionText}</Say></Record>`;

        return callActions;
    }

    linkCustomerToOfflineAgent({ offline_phone, ringbackTone }) {
        let callAction;
        if (!offline_phone) {
            throw new Error(`Missing: "offline_phone"`);
        }
        if (!ringbackTone) {
            throw new Error(`Missing: "ringbackTone"`);
        }

        callAction = `<Dial phoneNumbers="${offline_phone},${this.AT_virtualNumber}" ringbackTone="${ringbackTone}" record="true"  sequential="true" />`;
        return callAction;
    }

    survey({
        textPrompt,
        audioPrompt,
        timeout,
        fallbackNotice,
        finishOnKey,
        callbackUrl,
    }) {
        if (!textPrompt && !audioPrompt) {
            throw new Error(
                `Provide atleast one: "textPrompt" or "audioPrompt"`
            );
        }

        if (!callbackUrl) {
            throw new Error(`Provide "callbackUrl" for survey`);
        }
        timeout = timeout || 10;
        fallbackNotice =
            fallbackNotice || 'Sorry, we did not get your feedback. Goodbye.';

        let callAction = `<GetDigits timeout="${timeout}" finishOnKey="${finishOnKey}" callbackUrl="${callbackUrl}">`;

        if (textPrompt) {
            callAction += `<Say>${textPrompt}</Say>`;
        } else if (audioPrompt) {
            callAction += `<Play>${audioPrompt}</Play>`;
        }

        callAction += `</GetDigits><Say>${fallbackNotice}</Say>`;

        return callAction;
    }
}

module.exports = {
    VoiceHelper,
};
