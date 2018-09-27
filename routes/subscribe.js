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

router.post('/', function (req, res, next) {
    var getClient = redis.createClient({ host: redisAuth.host, port: redisAuth.port, password: redisAuth.password });
    var setClient = redis.createClient({ host: redisAuth.host, port: redisAuth.port, password: redisAuth.password });
    var userPushArray;

    var pushPromise = new Promise((resolve, reject) => {
        getClient.get(keyPrefij + req.body.user_id, function (err, pushId) {
            if (err) {
                reject(false);
            }
            console.log("pushId: " + pushId);
            if (pushId == null) {
                resolve(false);
            }
            else {
                let keyData = JSON.parse(pushId);
                userPushArray = keyData;

                setClient.del(keyPrefij + req.body.user_id);
                userPushArray.push_id[userPushArray.push_id.length] = req.body.push_id;
                setClient.set(keyPrefij + req.body.user_id, JSON.stringify(userPushArray));

                resolve(true);
            }
        });
    });

    pushPromise.then((isThereId) => {
        userPushArray = {
            user_id: req.body.user_id,
            push_id: [req.body.push_id]
        };

        if (isThereId == false) {
            setClient.set(keyPrefij + req.body.user_id, JSON.stringify(userPushArray));
        }

        res.status(200).json({ message: "Successfully subscribed!" })
    }).catch((err) => {
        console.log(err);
        res.status(200).json({ message: "Successfully subscribed!" })
    });
});

module.exports = router;
