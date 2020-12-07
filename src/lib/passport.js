const passport = require('passport');
const LocalStrategy =require('passport-local');
const pool = require('../database');
const helpers = require('../lib/helpers')

passport.use('local.signin', new LocalStrategy({
    usernameField: 'username',
    passwordField : 'password',
    passReqToCallback : true
},async(req,username, password, done) => {
    console.log(req.body);
    const rows = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if(rows.length > 0) {
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);
        if(validPassword) {
            done(null, user, req.flash('success', 'Welcome' + user.username));
        } else {
            done( null, false, req.flash('message','Contraseña incorrecta'))
        }
    } else {
        return done(null, false, req.flash('message','el nombre de usuario no existe'))
    }
}))
passport.use('local.signup', new LocalStrategy({
    usernameField : 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    const {fullname} = req.body;
    const newUser = {
        username,
        password,
        fullname
    };
    newUser.password = await helpers.encryptPassword(password);
    const result = await pool.query('INSERT INTO users SET ?', [newUser]);
    newUser.id = result.insertId;
    return done(null, newUser);

}));

//guardando desde el id
passport.serializeUser((user, done) => {
    done(null, user.id);
});

//tomando por el id para obtener los datos
passport.deserializeUser(async (id, done) => {
    const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
});