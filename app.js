const express = require('express');
const fs = require('fs');
const port = 3000;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cookieParser = require('cookie-parser');
let session = require('express-session');
const { randomBytes } = require('crypto');
const app = express();
app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:false}));
const sessionTime = 1000*60*60*24
app.use(session({
    secret: "fefeefefefefe",
    saveUninitialized: true,
    cookie:{maxAge:sessionTime},
    resave: false
}))
// const csrf = (req, res, next) =>{
//     req.session.csrf = randomBytes(100).toString('base64');
//     next();
// }

// app.use(csrf);
app.use(cookieParser())

app.get("/",(req, res)=>{
    if(req.session.csrf === undefined){
        req.session.csrf = randomBytes(100).toString('base64');
    }
    res.render('home',{csrf_token:req.session.csrf});
})

app.post("/postdata",(req, res)=>{
    if(!req.body.csrf){
        res.send('CSRF is not there')
    }
    else if(req.body.csrf!== req.session.csrf){
        res.send('CSRF not match')
    }
    else{
    let data1 = fs.readFileSync('login.json');
    let data = JSON.parse(data1);
    // console.log(data)
    let login_data = data.filter(dt=> dt.email === req.body.email);
    // console.log(login_data);
    if(login_data[0]){
        if(bcrypt.compareSync(req.body.password, login_data[0].password)){
                session = req.session;
                session.email = req.body.email
                res.redirect("/dashboard")
            }
            else{
                res.send("password doesn't match")
            }
}
else{
    res.send("Invalid Email")
}
    }
})

app.get("/dashboard", (req, res)=>{
    session = req.session;
    if(session.email){
        res.render("dash",{email:session.email});
    }
    else{
        res.redirect("/");
    }
})
app.get('/register', (req,res)=>{
    res.render('register',{csrf_token:req.session.csrf});
})

app.post('/regdata',(req, res)=>{
    // console.log(req.session.csrf);
    // console.log(req.body.csrf);
    if(!req.body.csrf){
        res.send('CSRF is not there')
    }
    else if(req.body.csrf!== req.session.csrf){
        res.send('CSRF not match')
    }
    else{
    const password = 'aaaa';
    let data = JSON.parse(fs.readFileSync('login.json'));
    const hashPassword = bcrypt.hashSync(req.body.password, saltRounds)
    let reg_data = {email:req.body.email, password:hashPassword, id: data.length + 1};
    data.push(reg_data);
    fs.writeFileSync('login.json', JSON.stringify(data));
    // if(bcrypt.compareSync(password, hashPassword)){
    //     res.send("Password matching")
    // }
    // else{
    //     res.send("password doesn't match")
    // }
    res.redirect("/")
    }
})
app.get("/logout", (req, res)=>{
    req.session.destroy();
    res.redirect("/");
})
app.listen(port,(err)=>{
    if(err) throw err;
    console.log(`Working on ${port}`);
})