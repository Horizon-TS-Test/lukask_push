var express = require('express');
var router = express.Router();

var webpush = require('web-push');

var vapidKey = require('./../config/vapid-key');
var pushEmail = require('./../config/push-email');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * ////////USED TO FETCH SUBSCRIPTION ID IN REDIS SERVER:////////
 */
var redis = require('redis');
var redisAuth = require('../config/redis_auth');
var keyPrefij = "pushId-";
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/', function (req, res, next) {
    let notifReceiver = req.body.receivers;

    webpush.setVapidDetails('mailto:' + pushEmail.email, vapidKey.public_key, vapidKey.private_key);

    var getClient = redis.createClient({ host: redisAuth.host, port: redisAuth.port, password: redisAuth.password });
    var userPushArray;

    for (let user of notifReceiver) {
        console.log("User to push if exists: " + user);
        var pushPromise = new Promise((resolve, reject) => {
            getClient.get(keyPrefij + user.user_id, function (err, pushId) {
                if (err) {
                    reject(false);
                }
                console.log("pushId: " + pushId);
                if (pushId == null) {
                    resolve(pushId);
                }
                else {
                    let keyData = JSON.parse(pushId);
                    userPushArray = keyData.push_id;

                    for (let pushKey of userPushArray) {
                        let pushConfig = {
                            endpoint: pushKey.endpoint,
                            keys: {
                                auth: pushKey.keys.auth,
                                p256dh: pushKey.keys.p256dh
                            }
                        };

                        webpush.sendNotification(pushConfig, JSON.stringify({
                            icon_image: user.user_img,
                            title: user.title,
                            content: user.content,
                            open_url: user.open_url,
                            actions: user.actions
                        })).catch(function (err) {
                            console.log(err);
                        });
                    }

                    resolve(user.user_id);
                }
            });
        });

        pushPromise.then((pushedUser) => {
            console.log("Pushed User: " + pushedUser);
        }).catch((err) => {
            console.log(err);
        });
    }
    res.status(200).json({ message: "Successfully send push notifications to clients!" })
});

module.exports = router;
