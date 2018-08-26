/*
  auth0Namespace is yuor domain in Auth0, e.g. https://yourcompany.auth0.com
  clientId, identifies your app (mosca) with Auth0
  clientSecret, is used to sign the JWT (and validate it when using JWT mode)
  connection identifies the user store you want to use in Auth0. It must be one that supports the 
  'Resource Owner' flow: Active Directory, database, etc.
*/
function AuthParaffin(authNamespace, masterKEY) {
    this.authNamespace = authNamespace;
    this.masterKEY = masterKEY;
}


/*
  Used when the device is sending credentials. 
  mqtt.username must correspond to the device username in the Auth0 connection
  mqtt.password must correspond to the device password
*/
AuthParaffin.prototype.authenticateWithCredentials = function () {

    var self = this;
    console.log("Authentication is starting...");

    return function (client, username, password, callback) {

        if (username !== 'IOK') {
            return callback("Invalid Credentials", false);
        }
        console.log('ClientID: ' + client.id);
        console.log('Username: ' + username);
        console.log('Password: ' + password);

        if (password.toString() === "") {
            console.log('Password is empty!');
            return callback("Invalid Credentials", false);
        }

        var data = {
            client_id: client.id, // {client-name}
            username: username,
            password: password.toString(),
            connection: self.connection,
            grant_type: "password",
            scope: 'IOK'
        };

        const query = new Parse.Query("Device");
        query.equalTo("clientID", client.id);
        query.find()
            .then((results) => {
                console.log("Results ID: " + results[0].get("clientID"));
                console.log("Results: " + results[0].get("password"));

                auth = results[0].get("password") !== data.password;
                if (auth) {
                    console.log('Password is not matched!');
                    return callback("Invalid Credentials", false);
                }
                console.log("Authentication is done truely!");
                return callback(null, true);
            })
            .catch(() => {
                console.log("Erorr in API authentication");
                return callback("Erorr in API authentication", false);
            });

        //  client.deviceProfile = profile; //profile attached to the client object
    }
}

AuthParaffin.prototype.authorizePublish = function () {
    return function (client, topic, payload, callback) {
        const query = new Parse.Query("Device");
        query.equalTo("clientID", client.id);
        query.find()
            .then((results) => {
                console.log("> Publish Results ID: " + results[0].get("clientID"));
                deviceProfile = results[0].get("deviceProfile");
                console.log(results[0].get("deviceProfile"));
                authPub = deviceProfile && deviceProfile.topics && deviceProfile.topics.indexOf(topic) > -1;
                console.log('###' + topic);
                console.log("*****" + deviceProfile.topics.indexOf(topic));
                if (!authPub) {
                    console.log('Publish is not allowed!');
                    return callback("Invalid Publish authorization", false);
                }
                console.log("Publish is done!");
                return callback(null, true);
            })
            .catch(() => {
                console.log("Erorr in API authorization");
                return callback("Erorr in API authentication", false);
            });

        //callback(null, client.deviceProfile && client.deviceProfile.topics && client.deviceProfile.topics.indexOf(topic) > -1);
    }
}

AuthParaffin.prototype.authorizeSubscribe = function () {
    return function (client, topic, callback) {
        callback(null, client.deviceProfile && client.deviceProfile.topics && client.deviceProfile.topics.indexOf(topic) > -1);
    }
}

module.exports = AuthParaffin;