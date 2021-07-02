require('dotenv').config();
const express = require('express');
const session = require('express-session');
const Seneca = require('seneca');
const Web = require('seneca-web');

const seneca = Seneca();
const { ExpressOIDC } = require('@okta/oidc-middleware');

const path = require('path');
const { response } = require('express');

// setup Seneca in Microservices

const senecaWebConfig = {
  context: express(),
  adapter: require('seneca-web-adapter-express'),
  options: { parseBody: false, includeRequest: true, includeResponse: true },
};
seneca.use(Web, senecaWebConfig)
  .client({ port: '10201', pin: 'role:restaurant' })
  .client({ port: '10202', pin: 'role:cart' })
  .client({ port: '10203', pin: 'role:payment' })
  .client({ port: '10204', pin: 'role:order' });
seneca.ready(() => {
  const app = seneca.export('web/context')();

  app.use(express.static('public'));
  app.use(express.json());
  app.use(express.urlencoded());

  app.set('views', path.join(__dirname, '../public/views'));
  app.set('view engine', 'pug');
});

const oktaSettings = {
  clientId: process.env.OKTA_CLIENTID,
  clientSecret: process.env.OKTA_CLIENTSECRET,
  url: process.env.OKTA_URL_BASE,
  appBaseUrl: process.env.OKTA_APP_BASE_URL,
};

const oidc = new ExpressOIDC({
  issuer: `${oktaSettings.url}/oauth2/default`,
  client_id: oktaSettings.clientId,
  client_secret: oktaSettings.clientSecret,
  appBaseUrl: oktaSettings.appBaseUrl,
  scope: 'openid profile',
  routes: {
    login: {
      path: '/users/login',
    },

    callback: {
      path: '/authorization-code/callback',
      defaultRedirect: '/',
    },
  },
});

app.use(
  session({
    session: 'ladhnsfolnjaerovklnoisag093q4jgpijbfimdposjg5904mbgomcpasjdg',
    resave: true,
    saveUninitialized: false,
  }),
);

app.use(oidc.router);

app.get('/', ensureAuthenticated, (req, res) => {
  let cart;
  let restaurants;
  const user = req.userContext.userinfo;
  const username = req.userContext.userinfo.preferred_username;

  seneca.act('role:restaurant', { cmd: 'get', userId: username }, (err, msg) => {
    restaurants = msg;
  }).act('role:cart', { cmd: 'get', userId: username }, (err, msg) => {
    cart = msg;
  }).ready(() => res.render('home', {
    user,
    restaurants,
    cart,
  }));
});

app.get('/login', (req, res) => res.render('login'));

app.get('/users/logout', (req, res, next) => {
  req.logout();
  res.redirect('/');
});

app.get('/cart', ensureAuthenticated, (req, res) => {
  const username = req.userContext.userinfo.preferred_username;
  const user = req.userContext.userinfo;

  seneca.act('role:cart', { cmd: 'get', userId: username }, (err, msg) => res.render('cart', {
    user,
    cart: msg,
  }));
});

app.post('/cart', ensureAuthenticated, (req, res) => {
  const username = req.userContext.userinfo.preferred_username;
  const { restaurantId } = req.body;
  const { itemId } = req.body;
  let val;

  seneca.act('role:restaurant', { cmd: 'item', itemId, restaurantId }, (err, msg) => { val = msg; })
    .ready(() => {
      seneca.act('role:cart',
        {
          cmd: 'add',
          userId: username,
          restaurantName: val.restaurant.name,
          itemName: val.item.name,
          itemPrice: val.item.price,
          itemId: val.item.itemId,
          restaurantId: val.item.restaurantId,
        }, (err, msg) => res.send(msg).statusCode(200));
    });
});

app.delete('/cart', ensureAuthenticated, (req, res) => {
  const username = req.userContext.userinfo.preferred_username;
  const { restaurantId } = req.body;
  const { itemId } = req.body;

  seneca.act('role:cart', {
    cmd: 'remove', userId: username, restaurantId, itemId,
  }, (err, msg) => res.send(msg).statusCode(200));
});

app.post('/order', ensureAuthenticated, (req, res) => {
  const username = req.userContext.userinfo.preferred_username;
  let total;
  let result;

  seneca.act('role:cart', { cmd: 'get', userId: username }, (err, msg) => {
    total = msg.total;
  });

  seneca
    .act('role: payment', { cmd: 'pay', total }, (err, msg) => {
      result = msg;
    })
    .ready(() => {
      if (result.success) {
        seneca
          .act('role: cart', { cmd: 'clear', userId: username }, () => res.redirect('/confirmation').send(302));
      } else {
        return res.send('Card Declined').send(200);
      }
    });
});

app.get('/confirmation', ensureAuthenticated, (req, res) => {
  const username = req.userContext.userinfo.preferred_username;
  const user = req.userContext.userinfo;

  seneca.act('role:cart', { cmd: 'get', userId: username }, (err, msg) => res.render('confirmation', {
    user,
    cart: msg,
  }));
});

app.listen(3000);

function ensureAuthenticated(req, res, next) {
  if (!req.userContext) {
    return res.status(401).redirect('../login');
  }
  next();
}
