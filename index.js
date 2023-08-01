
// Express 

const express = require("express");
const app = express();
const session = require('express-session');
const passport = require('passport');
const Strategy = require('passport-discord').Strategy;
const url = require('url');
const MongoStore = require('connect-mongo');
const chalk = require('chalk');
const mongoose = require('mongoose');
const country = require('ip-country');
const lookup = require('country-code-lookup')

// String Tools By Me

const { string } = require('@alg-mapper/string-tools');
const tools = string();

// Discord 

const discord = require('discord.js');
const client = new discord.Client({ intents: 32767 });

// Others 

const moment = require('moment');
const server = require('http').createServer(app);
const { db , domain, client_id, client_secret, token } = require('./settings/configs');

mongoose.connect(db, {
useNewUrlParser: true,
useUnifiedTopology: true
}).then(() => console.log(chalk.cyan(`Connected to Mongoose!`)));

let links = require(`./models/links.js`);

client.on('ready', async () => {
console.log(chalk.green(client.user.tag + ' is ready'));
});

app.use(express.urlencoded({ extended: false }));
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/assets'));

// Login 

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(new Strategy({
    clientID: client_id,
    clientSecret: client_secret,
    callbackURL: `${domain}/auth`,
    scope: ['identify']
},
    (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
    }));

app.use(session({
    store: MongoStore.create({
    mongoUrl: db
    }),
    secret: 'clientsessiosabayrosecret123123123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 604800000 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.locals.domain = `${domain}`

app.get('/login', (req, res, next) => {
    if (req.session.backURL) {
        req.session.backURL = domain + '/auth';
    } else if (req.headers.referer) {
        const parsed = url.parse(req.headers.referer);
        if (parsed.hostname === app.locals.domain) {
            req.session.backURL = parsed.path;
        }
    } else {
        req.session.backURL = '/';
    }
    next();
},

passport.authenticate('discord'));
app.get('/auth', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    if (req.session.backURL) {
        const backURL = req.session.backURL;
        req.session.backURL = null;
        res.redirect(backURL);
    } else {
        res.redirect('/');
    }
});

app.get("/logout", function(req, res, next) {

    req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
    });

});

app.get('/', function(req, res) {

    let flag = `https://ipdata.co/flags/${country.country(req.socket.remoteAddress).toLowerCase() || 'jo' }.png`;
    let countryCode = country.country(req.socket.remoteAddress).toLowerCase() || 'jo';

    res.render('index', { user: req.user, country: flag, countryCode: countryCode });

});

app.get('/new', function(req, res) {

    if(req.user) {

    let flag = `https://ipdata.co/flags/${country.country(req.socket.remoteAddress).toLowerCase() || 'jo'}.png`;
    let countryCode = country.country(req.socket.remoteAddress).toLowerCase() || 'jo';

    res.render('new', { user: req.user, country: flag, countryCode: countryCode })
    
    } else {
    
    res.render('authorize')
    
    } 
});

app.post('/new', async function(req, res) {

    let body = req.body;
    let linkID = '';

    // Thanks to Daveo.

    let expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
    let regex = new RegExp(expression);

    let generatedID = tools.generateUniqueString(7, { caps: true, ignoreLengthError: true }).value;

    let availablePrivacys = ["public", "private"];

    let data = {
    title: body.title,
    privacy: body.privacy,
    value: body.value,
    maxUsage: body.maxUsage,
    description: body.description,
    }

    if(!data.title && !data.privacy && !data.value && !data.value && !data.maxUsage && !data.description) return res.send({ message: 'Missing Field(s)!', status: 'error' });
    if(data.title.replace(/\s/g, '').length === 0 || data.privacy.replace(/\s/g, '').length === 0 || data.value.replace(/\s/g, '').length === 0 || data.maxUsage.replace(/\s/g, '').length === 0 || data.description.replace(/\s/g, '').length === 0) return res.send({ message: 'Missing Field(s)!', status: 'error' });

    if(data.title.length > 40) return res.send({ message: 'Field must not be less than 40 characters: [Title]', status: 'error' });
    if(!data.value.match(regex)) return res.send({ message: 'Field must be a valid link: [Value]', status: 'error' });
    if(data.description.length < 20) return res.send({ message: 'Field must be more than 20 characters: [Description]', status: 'error' });
    if(data.description.length > 200) return res.send({ message: 'Field must be less than 200 characters: [Description]', status: 'error' });
   
    if(!availablePrivacys.includes(data.privacy)) data.privacy = availablePrivacys[0];
    if(isNaN(data.maxUsage)) data.maxUsage = 0;
    if(data.maxUsage > 99) data.maxUsage = 99;
    if(data.maxUsage < 0) data.maxUsage = 0;

    linkID = generatedID;

    let dataOfLinks = await links.findOne({ id: linkID});
    if(dataOfLinks) linkID = tools.generateUniqueString(7, { caps: true, ignoreLengthError: true }).value;

    let newLink = new links({
    title: data.title,
    link: data.value,
    code: linkID,
    author: req.user.id,
    visitors: [],
    history: [{ action: "Link has been registered by", special: req.user.username, time: Date.now() }],
    password: data.password || "",
    uses: 0,
    maxUses: data.maxUsage,
    privacy: data.privacy,
    time: Date.now(),
    description: data.description
    });
    newLink.save();

    res.send({ message: 'Successfully registered your link!', status: 'success', link: { code: linkID }});

});

app.get('/link/:id', async function(req, res) {

    let id = req.params.id;

    let linkData = await links.findOne({ code: id });

    if(!id || !linkData || !req.user || linkData.author !== req.user.id) {

    res.render('404');

    } else {

    let flag = `https://ipdata.co/flags/${country.country(req.socket.remoteAddress).toLowerCase() || 'jo'}.png`;
    let countryCode = country.country(req.socket.remoteAddress).toLowerCase() || 'jo';

    res.render('link', { user: req.user, country: flag, countryCode: countryCode, data: linkData, moment: moment });
}

});

app.get('/:id', async function(req, res) {

let id = req.params.id;

let findLink = await links.findOne({ code: id });
if(!findLink) return res.redirect('/');
if(findLink.code !== id) return res.redirect('/');

if(findLink.visitors.includes(req.socket.remoteAddress)) {

findLink.save();
res.redirect(findLink.link);

} else {
    
// this is only used to check if the ip address visited the link

findLink.visitors.push(req.socket.remoteAddress)

findLink.history.push({ action: "Someone visited link from", special: lookup.byFips(country.country(req.socket.remoteAddress).toLowerCase()).country || 'unknown', time: Date.now() });
findLink.uses += 1;

findLink.save();

res.redirect(findLink.link);
}


});

app.use(function(req, res) {
res.status(403).render(`404`);
});

var listeners = server.listen(57056, function() {
console.log(chalk.blue("Your app is listening on port " + listeners.address().port));
});

client.login(token);