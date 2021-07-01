const express = require('express');
const session = require('express-session');
const Seneca = require('seneca');
const Web = require('seneca-web');

const seneca = Seneca();
const { ExpressOIDC } = require('@okta/oidc-middleware');

const path = require('path');
const bodyParser = require('body-parser');

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
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());

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