/* Magic Mirror
 * Module: MMM-PetFinder
 *
 * By Mykle1
 * Updated By PhantomOffKanagawa
 * 
 */

const NodeHelper = require('node_helper');
const request = require('request');



module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting node_helper for: " + this.name);
    },

    getPetFinder: function(json) {
        request({
            headers: {
                Authorization: 'Bearer ' + json.token,
            },
            url: json.url,
            method: 'GET'
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(body);
                // var result = response;
                this.sendSocketNotification('ANIMALS', result);
            }
        });
    },

    getToken: function(json) {
        request({
            url: json.url,
            // body: {'msg': "grant_type=client_credentials&client_id=" + json.clientID + "&client_secret=" + json.clientSecret},
            form: {
                grant_type: 'client_credentials',
                client_id: json.clientID,
                client_secret: json.clientSecret
            },
            method: 'POST'
        }, (error, response, body) => {
            // if (!error && response.statusCode == 401) {
                var result = JSON.parse(body).access_token;
                this.sendSocketNotification('TOKEN', result);
            // }
        });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'TOKEN') {
            this.getToken(payload);
        }
        if (notification === 'GET_PETFINDER') {
            this.getPetFinder(payload);
        }
    }
});
