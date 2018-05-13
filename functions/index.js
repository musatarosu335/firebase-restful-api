const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

const express = require('express');

const app = express();
const cors = require('cors')({ origin: true });

app.use(cors);

const anonymosUser = {
  id: 'anon',
  name: 'Anonymous',
  avatar: '',
};

// ユーザー情報の取得
const checkUser = (req, res, next) => {
  req.user = anonymosUser;
  if (req.query.auth_token !== undefined) {
    let idToken = req.query.auth_token;
    admin.auth().verifiIdToken(idToken)
      .then((decodedIdToken) => {
        let authUser = {
          id: decodedIdToken.user_id,
          name: decodedIdToken.name,
          avatar: decodedIdToken.picture,
        };
        req.user = authUser;
        next();
      })
      .catch(() => {
        next();
      });
  } else {
    next();
  }
};

app.use(checkUser);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
