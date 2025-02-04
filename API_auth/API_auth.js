const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const JwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const fs = require('fs');
const port = 3000;

function role_from_token(req)
{
    const authField = req.get('Authorization')
    console.log(authField)

    //console.log("split");
    const authStrs = authField.split(' ')
    console.log(authStrs);

    //console.log("just 1");
    console.log(authStrs[1]);

    //console.log("token decode");
    decodedToken = jwt.decode(authStrs[1]);
    
    console.log("role executing")
    console.log(decodedToken.role)
    return decodedToken.role
}

function check_valid_token(req, res)
{
    const authField = req.get('Authorization')
    console.log(authField)

    //console.log("split");
    const authStrs = authField.split(' ')
    //console.log(authStrs);

    //console.log("just 1");
    //console.log(authStrs[1]);
    token = authStrs[1]
    if(token == Valid_Acces_Token || token == Valid_Refresh_Token)
    {console.log("good")}
    else
    {
        console.log("error")
        res.status(404).json({ error: 'not found' })
    }
}

const MYSECRETJWTKEY = "mysecret";
Valid_Acces_Token = "void"
const REFRESHJWTKEY = "refreshcecret"
Valid_Refresh_Token = "void"

admin_name = "admin"
admin_password = "admin"

user_name = "hello";
user_password = "world";

var optiosForJwtValidation_refresh = {
    jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: REFRESHJWTKEY
};

passport.use("refresh_jwt_str", new JwtStrategy(optiosForJwtValidation_refresh, function (payload, done) {
    console.log("refresh payload:", payload);
    done(null, payload);
}));

var optiosForJwtValidation_user = {
    jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: MYSECRETJWTKEY
};

passport.use("user_jwt_str", new JwtStrategy(optiosForJwtValidation_user, function (payload, done) {
    console.log("User payload:", payload);
    done(null, payload);
}));

passport.use(new BasicStrategy(function (username, password, done) {
    console.log('Basic strategy executing');
    console.log('username: ' + username);
    console.log('password: ' + password);

    if (username === user_name && password === user_password)
    {
        done(null, { user: username, role: 'user' });
    } 
    else if (username === admin_name && password === admin_password)
    {
        done(null, { user: username, role: 'admin' });
    } 
    else
    {
        done(null, false);
    }
}));

app.get('/signin', passport.authenticate('basic', { session: false }), (req, res) => {

    if (req.user.role === 'admin')
    {
        const accessToken = jwt.sign({ role: 'admin' }, MYSECRETJWTKEY, { expiresIn: '15m' });
        refreshToken = jwt.sign({ role: 'admin' }, REFRESHJWTKEY, { expiresIn: '7d' });
        Valid_Acces_Token = accessToken
        Valid_Refresh_Token = refreshToken
        res.json({
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } 
    else if (req.user.role === 'user')
    {
        const accessToken = jwt.sign({ role: 'user' }, MYSECRETJWTKEY, { expiresIn: '15m' });
        refreshToken = jwt.sign({ role: 'user' }, REFRESHJWTKEY, { expiresIn: '7d' });
        Valid_Acces_Token = accessToken
        Valid_Refresh_Token = refreshToken
        res.json({
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } 
    else 
    {
        res.status(500).json({ error: 'Not found' });
    }
});

app.post('/refresh',passport.authenticate('refresh_jwt_str', { session: false }), (req, res) => {//_________________________________________________________________needs (only) refresh jwt(can get neww accesstoken with expired one)
   
    check_valid_token(req, res)

    if(role_from_token(req) == 'admin')
    {
        const accesToken = jwt.sign({ role: 'admin' },MYSECRETJWTKEY ,{ expiresIn: '15m' });
        Valid_Acces_Token = accesToken
        res.json({ accessToken: accesToken });
    }
    else if(role_from_token(req) == 'user')
    {
        const accesToken = jwt.sign({ role: 'user' },MYSECRETJWTKEY ,{ expiresIn: '15m' });
        Valid_Acces_Token = accesToken
        res.json({ accessToken: accesToken });
    }
    else
    {
        res.status(404).json({ error: 'not found' });
    }
});

app.post('/logout',(req, res) => { //________________________________________________________________needs (only) refresh jwt(can log out with expired acces token)
    
    Valid_Acces_Token = "void"
    Valid_Refresh_Token = "void"
    res.json({ message: 'Logged out' });
  
});

app.post('/post', passport.authenticate('user_jwt_str', { session: false }), (req, res) => {//_________only admin

    check_valid_token(req, res)
    if(role_from_token(req) === "admin")
    {
        fs.readFile('data.json', 'utf8', (err, data) => 
        {
            if (err) {
                return res.status(500).json({ error: 'file error' })
            }
    
            jsonData = JSON.parse(data);
            new_data = req.get("array");
    
            jsonData.array.push(new_data);
            console.log(new_data);
            fs.writeFile('data.json', JSON.stringify(jsonData, null, 4), (err) => {
                if (err) {
                    return res.status(500).json({ error: 'file error' })
                }
                res.json({ message: "Sentence added " + new_data });
            });
        });
    }
    else
    {
        res.status(404).json({ error: 'not found' });
    }
    
});

app.get('/post', passport.authenticate('user_jwt_str', { session: false }), (req, res) => {
    
    check_valid_token(req, res)

    fs.readFile('data.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'file error' });;
        }

        const jsonData = JSON.parse(data);
        res.json(jsonData.array);
    });
});

app.listen(port, () => {
    console.log(`Running on ${port}`);
});
