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

// チャンネルの作成
const createChannel = (cname) => {
  let channelsRef = admin.database().ref('channels');
  let date1 = new Date();
  let date2 = new Date();
  date2.setSeconds(date2.getSeconds() + 1);
  const defaultDate = `{
    "messages": {
      "1": {
        "body": "Welcome to ${cname} channel!",
        "date": "${date1.toJSON()}",
        "user": {
          "avatar": "",
          "id": "robot",
          "name": "Robot"
        }
      },
      "2": {
        "body": "メッセージを投稿しよう",
        "date": "${date2.toJSON()}",
        "user": {
          "avatar": "",
          "id": "robot",
          "name": "Robot"
        }
      }
    }
  }`;
  channelsRef.child(cname).set(JSON.parse(defaultDate));
};

app.post('/channels', (req, res) => {
  let { cname } = req.body;
  createChannel(cname);
  res.header('Content-Type', 'application/json; charset=utf-8');
  res.status(201).json({ result: 'ok' });
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
