// Firebase Functions SDK(HTTPリクエストをトリガするために使用)
const functions = require('firebase-functions');
// Firebase Admin SDK(Realtime Databaseの処理及び認証をするために使用)
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
    const idToken = req.query.auth_token;
    admin.auth().verifiIdToken(idToken)
      .then((decodedIdToken) => {
        const authUser = {
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
  const channelsRef = admin.database().ref('channels');
  const date1 = new Date();
  const date2 = new Date();
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
  const { cname } = req.body;
  createChannel(cname);
  res.header('Content-Type', 'application/json; charset=utf-8');
  res.status(201).json({ result: 'ok' });
});

// チャンネル一覧の取得
app.get('/channels', (req, res) => {
  const channelsRef = admin.database().ref('channels');
  channelsRef.once('value', (snapshot) => {
    const items = [];
    snapshot.forEach((childSnapshot) => {
      const cname = childSnapshot.key;
      items.push(cname);
    });
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.send({ channels: items });
  });
});

// メッセージの追加
app.post('/channels/:cname/messages', (req, res) => {
  const { cname } = req.parame;
  const message = {
    date: new Date().toJSON(),
    body: req.body.body,
    user: req.user,
  };
  const messagesRef = admin.database().ref(`channels/${cname}/messages`);
  messagesRef.push(message);
  res.header('Content-Type', 'application/json; charset=utf-8');
  res.status(201).json({ result: 'ok' });
});

// メッセージ一覧の取得
app.get('/channels/:cname/messages', (req, res) => {
  const { cname } = req.params;
  const messagesRef = admin.database().ref(`channels${cname}/messages`).orderByChild('date').limitToLast(20);
  messagesRef.once('value', (snapshot) => {
    const items = [];
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.key;
      items.push(message);
    });
    items.reverse();
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.send({ messages: items });
  });
});

// RESTful API を利用
exports.v1 = functions.https.onRequest(app);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
