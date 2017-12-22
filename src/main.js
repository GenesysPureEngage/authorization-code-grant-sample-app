const express = require('express');
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const url = require('url');
const workspace = require('genesys-workspace-client-js');
const authentication = require('genesys-authentication-client-js');

let request = require('request');

const app = express();
const routes = express.Router();

const apiUrl = "<apiUrl>";
const apiKey = "<apiKey>";
const clientId = "<clientId>";
const port = 8080;

const state = {
    current: 'Logged out'
};

const authClient = new authentication.ApiClient();
authClient.basePath = `${apiUrl}/auth/v3`;
authClient.defaultHeaders = {
  'x-api-key': apiKey
};

const workspaceApi = new workspace(apiKey, apiUrl);

routes.get('/info', (req, res) => {
    const user = workspaceApi.user;
    const value = {
        state: state.current,
        user: user
    };
    
    res.send(value);
});

routes.get('/initialize', (req, res) => {
    const code = req.query.code;
    
    state.current = 'Initializing';
    state.code = code;
    
    workspaceApi.initialize({code: code, redirectUri: state.redirectUri}).then( () => {
        state.current = 'Logged in';
    }).catch(err => {
        console.error(err);
        state.current = 'Error';
    });
    
    res.redirect('/');
});

routes.get('/login', (req, res) => {
    const redirectUri = `${req.protocol}://${req.hostname}:${port}/initialize`;
    state.redirectUri = redirectUri;
    
    const authLoginPage = `${apiUrl}/auth/v3/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    res.redirect(authLoginPage);
});

routes.post('/logout', (req, res) => {
    state.current = 'Logged out';
    workspaceApi.destroy();
});

routes.get('/*', (req, res) => {
   res.redirect('/');
});

app.use(express.static('public', {
    extensions: ['html', 'htm']
}));

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes);

app.listen(port, () => {
    console.info('Server started at ', port);
});