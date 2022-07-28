try {
    var jQuery = jQuery.noConflict();
    var username = 'daggieblanqx';
    var appURL = window.location.origin;
    var phoneNumberLength = 0;
    var currentlyOnCall = false;
    var gradientifyPresets = {
        element: document.body, // Main element where gradients will appear
        fixed: false, // Position of the gradients, if true - overflow of the main element will be hidden to prevent gradients from escaping the element
        delay: 0, // Delay between gradient transitions
        interval: 5000, // How often the gradients will be changed
    };
    var ATConfig = async () => {
        var response = await fetch('/capability-token', {
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            method: 'POST',
            body: JSON.stringify({
                clientname: 'browser1',
            }),
        });
        var data = await response.json();
        var token = data.token;
        return new Africastalking.Client(token, {
            sounds: {
                dialing: `${appURL}/sounds/dial.mp3`,
                ringing: `${appURL}/sounds/ring.mp3`,
            },
        });
    };

    /**
     * START OF: UI Scripts
     *
     *
     *
     */

    var uiChange_callInProgress = () => {
        new Gradientify({
            ...gradientifyPresets,
            gradients: [
                `linear-gradient(60deg, rgb(50, 234, 22), rgb(195, 168, 21))`,
                `linear-gradient(10deg, rgb(28, 190, 24), rgb(43, 188, 24))`,
                `radial-gradient(rgb(28, 190, 24), rgb(43, 188, 24))`,
            ],
        });

        jQuery('.keypadHolder').hide();
        jQuery('#status').text('Call In Progress...');
        jQuery('#call').css('background-color', 'red');
        currentlyOnCall = true;
    };

    var uiChange_callEnded = () => {
        new Gradientify({
            ...gradientifyPresets,
            gradients: [
                `linear-gradient(60deg, rgb(255, 0, 0), rgb(255, 64, 8))`,
                `linear-gradient(10deg, rgb(255, 32, 4), rgb(255, 96, 12))`,
                `radial-gradient(rgb(255, 128, 16), red)`,
            ],
        });

        jQuery('#status').text('Call Ended');
        jQuery('#call').css('background-color', 'grey');
        setTimeout(() => uiChange_callReadyIdlePhone(), 10000);
        currentlyOnCall = false;
        jQuery('.keypadHolder').show();
    };

    var uiChange_callReadyIdlePhone = () => {
        new Gradientify({
            ...gradientifyPresets,
            gradients: [
                `linear-gradient(60deg, rgb(180, 109, 227), rgb( 47, 109, 227))`,
                `linear-gradient(10deg, rgb( 43, 121, 198), rgb(50, 97, 255))`,
                `radial-gradient(rgb(0, 255, 61), red)`,
            ],
        });

        jQuery('#status').text('Ready To Make A Call');
        jQuery('#call').css('background-color', 'green');
    };

    jQuery('.digit').on('click', function (e) {
        e.preventDefault();
        var num = jQuery(this).clone().children().remove().end().text();
        if (phoneNumberLength < 11) {
            currentlyOnCall
                ? null
                : jQuery('#output').append('<span>' + num.trim() + '</span>');
            phoneNumberLength++;
        }
    });

    jQuery('.fa-long-arrow-left').on('click', function (e) {
        e.preventDefault();
        jQuery('#output span:last-child').remove();
        phoneNumberLength--;
    });
    /**
     *
     *
     * END OF: UI Scripts
     */

    /**
     * START OF: Call Logic
     *
     *
     *
     */
    ATConfig()
        .then((ATClient) => {
            window.ATClient = ATClient;

            jQuery('#call').on('click', function (e) {
                e.preventDefault();
                var numberOnKeypad = jQuery('#output').text().trim();
                currentlyOnCall
                    ? ATClient.hangup()
                    : ATClient.call(numberOnKeypad);
            });

            ATClient.on(
                'calling',
                function (o) {
                    console.log({ o });
                    uiChange_callInProgress();
                },
                false
            );

            ATClient.on(
                'hangup',
                function () {
                    console.log('Call ended');
                    uiChange_callEnded();
                },
                false
            );

            ATClient.on(
                'incomingcall',
                function (incomingcallLog) {
                    var from = incomingcallLog.from;
                    console.log({ incomingcallLog });
                    uiChange_callIncoming(from);

                    jQuery('#call').hide();
                    jQuery('#receive').show();
                    jQuery('#receive').css('background-color', 'green');

                    // EMIT INCOMINGCALL EVENT TO SERVER

                    jQuery('#receive').on('click', function (e) {
                        e.preventDefault();
                        ATClient.answer();
                    });

                    setTimeout(() => ATClient.hangup(), 15000);
                },
                false
            );

            ATClient.on(
                'missedcall',
                function () {
                    console.log({
                        CounterpartNum: ATClient.getCounterpartNum(),
                    });
                    console.log(
                        'Missed call from ' +
                            ATClient.getCounterpartNum().replace(
                                `${username}.`,
                                ''
                            )
                    );
                },
                false
            );

            ATClient.on(
                'offline',
                function () {
                    console.log({
                        CounterpartNum: ATClient.getCounterpartNum(),
                    });

                    console.log('Token expired, refresh page');
                    window.location.reload();
                },
                false
            );

            ATClient.on(
                'closed',
                function () {
                    console.log('connection closed, refresh page');
                    window.location.reload();
                },
                false
            );

            ATClient.on(
                'ready',
                function () {
                    uiChange_callReadyIdlePhone();
                },
                false
            );

            ATClient.on(
                'notready',
                function () {
                    console.log('not ready');
                },
                false
            );

            ATClient.on(
                'callaccepted',
                function () {
                    console.log({
                        CounterpartNum: ATClient.getCounterpartNum(),
                    });
                    console.log(
                        'In conversation with ' +
                            ATClient.getCounterpartNum().replace(
                                `${username}.`,
                                ''
                            )
                    );
                },
                false
            );
        })
        .catch((err) => console.log({ err }));

    /**
     *
     *
     *
     * END OF: Call Logic
     */
} catch (baddErr) {
    console.log({ baddErr });
}
