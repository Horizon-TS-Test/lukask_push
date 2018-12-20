var express = require('express');
var router = express.Router();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * ////////USED TO STORE SUBSCRIPTION ID IN REDIS SERVER:////////
 */
var redis = require('redis');
var redisAuth = require('../config/redis_auth');
var keyPrefij = "pushId-";
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/subscribe', function (req, res, next) {
    var getClient = redis.createClient({ host: redisAuth.host, port: redisAuth.port, password: redisAuth.password });
    var setClient = redis.createClient({ host: redisAuth.host, port: redisAuth.port, password: redisAuth.password });
    var userPushArray;

    var pushPromise = new Promise((resolve, reject) => {
        getClient.get(keyPrefij + req.body.user_id, function (err, pushId) {
            if (err) {
                reject(false);
            }
            else if (pushId == null) {
                resolve(false);
            }
            else {
                let keyData = JSON.parse(pushId);
                userPushArray = keyData;

                setClient.del(keyPrefij + req.body.user_id);
                for (let i = 0; i < userPushArray.push_id.length; i++) {
                    if (userPushArray.push_id[i] != req.body.push_id) {
                        userPushArray.push_id[userPushArray.push_id.length] = req.body.push_id;
                        setClient.set(keyPrefij + req.body.user_id, JSON.stringify(userPushArray));
                    }
                }
                resolve(true);
            }
        });
    });

    pushPromise.then((isThereId) => {
        if (isThereId == false) {
            userPushArray = {
                user_id: req.body.user_id,
                push_id: [req.body.push_id]
            };
            setClient.set(keyPrefij + req.body.user_id, JSON.stringify(userPushArray));
        }

        res.status(200).json({ message: "Successfully subscribed!" })
    }).catch((err) => {
        console.log(err);
        res.status(200).json({ message: "Successfully subscribed!" })
    });
});

router.post('/unsubscribe', function (req, res, next) {
    var getClient = redis.createClient({ host: redisAuth.host, port: redisAuth.port, password: redisAuth.password });
    var setClient = redis.createClient({ host: redisAuth.host, port: redisAuth.port, password: redisAuth.password });

    var pushPromise = new Promise((resolve, reject) => {
        getClient.get(keyPrefij + req.body.user_id, function (err, pushId) {
            if (err) {
                reject(false);
            }
            else if (pushId == null) {
                resolve(false);
            }
            else {
                let userPushArray = JSON.parse(pushId);

                console.log("Before unsubscribing", userPushArray);
                for (let i = 0; i < userPushArray.push_id.length; i++) {
                    console.log("userPushArray.push_id[i]", userPushArray.push_id[i]);
                    console.log("req.body.push_id", req.body.push_id);
                    if (userPushArray.push_id[i] == req.body.push_id) {
                        userPushArray.push_id.splice(i, 1);
                        console.log("After unsubscribing", userPushArray);
                        i = userPushArray.push_id.length;
                        setClient.set(keyPrefij + req.body.user_id, JSON.stringify(userPushArray));
                    }
                }
                resolve(true);
            }
        });
    });

    pushPromise.then((isThereId) => {
        if (isThereId == false) {
            res.status(200).json({ message: "You're not subscribed yet!" })
        }

        res.status(200).json({ message: "Successfully unsubscribed!" })
    }).catch((err) => {
        console.log(err);
        res.status(200).json({ message: "We cannot unsubscribed your device!" })
    });
});

module.exports = router;
