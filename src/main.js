const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const url = require('url');
let request = require('request');

const app = express();
const routes = express.Router();

const apiUrl = "<apiUrl>";
const apiKey = "<apiKey>";
const port = 8080;

request = request.defaults({
    jar: true,
    'x-api-key': apiKey
});

function isSuccess(response) {
    return response.statusCode === 200;
}

routes.get('/user', (req, res) => {
    request.get(`${apiUrl}/workspace/v3/current-session`, (err, response, body) => {
        if(err) {
            console.error(err);
            res.send(err);
        }
        else if(isSuccess(response)) {
            res.send(body);
        }
        else {
            res.redirect(401, '/login');
        }        
    });
});

routes.get('/login', (req, res) => {
    const code = req.query.code;
    const redirectUri = `${req.protocol}://${req.hostname}:${port}${req.path}`;
    if(code) {
        request.get(`${apiUrl}/workspace/v3/login?redirect_uri=${redirectUri}&code=${code}`, (err, response, body) => {
            if(err) {
                console.error(err);
                res.send(err);
            }
            else if(isSuccess(response)) {
                console.log(body);
                res.redirect('/user');
            }
            else {
                res.send(body);
            }
        });
    }    
    else {
        res.redirect(`${apiUrl}/workspace/v3/login?redirect_uri=${redirectUri}`);
    }
});

routes.get('/*', (req, res) => {
   res.redirect('/user'); 
});

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes);

app.listen(port, () => {
    console.info('Server started at ', port);
});