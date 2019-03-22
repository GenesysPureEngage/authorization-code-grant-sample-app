const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const workspace = require('genesys-workspace-client-js');
const app = express();
const routes = express.Router();

const workspaceApiUrl = "<workspaceApiUrl>";
const authApiUrl = "<authApiUrl>";
const apiKey = "<apiKey>";
const clientId = "<clientId>";
const port = 8080;

const state = {
    current: 'Logged out'
};

const workspaceClient = new workspace(apiKey, workspaceApiUrl);

routes.get('/info', (req, res) => {
    const user = workspaceClient.user;
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
    workspaceClient.initialize({code: code, redirectUri: state.redirectUri}).then(() => {
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

    const authLoginPage = `${authApiUrl}/auth/v3/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    res.redirect(authLoginPage);
});

routes.post('/logout', (req, res) => {
    state.current = 'Logged out';
    workspaceClient.destroy();
});

routes.get('/*', (req, res) => {
    res.redirect('/');
});

app.use(express.static('public', {
    extensions: ['html', 'htm']
}));

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(routes);

app.listen(port, () => {
    console.info('Server started at ', port);
});
