const express = require("express")
const mysql = require("mysql")
const path = require("path")
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
process = require("process")

const port = process.env.PORT

app = express()
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({secret: "mymynka"}));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

function mkuid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}



const db = mysql.createConnection({
    host:"containers-us-west-25.railway.app",
    user:"root",
    password:"gxaErxwKNgfZUhJifpB1",
    database:"railway",
    port:7436

})

db.query("SELECT * FROM users",(err,result)=>{
console.log(result)
})


app.get("/",(req,res)=>{
console.log(req.cookies["logged_in_as"])
if(req.query.page){
    page = Number(req.query.page)
}
else{
    page = 1
}

var uid = req.cookies["logged_in_as"]
    if(req.cookies["logged_in_as"] != undefined){
        var user = []
        db.query("SELECT * FROM users WHERE uid = ?",uid,(err,result)=>{
            if(result){
            user = result[0]
            }
            const query = "SELECT * FROM ".concat(user["uid"]," WHERE id < ",page *10 ," AND id > ",page *10 -10)

            db.query(query,(err,result) =>{
                if(err){
                    console.log(err)
                }
                const questions = result
                console.log(questions)
                res.render("index",{user,questions:questions})
            })

            
        })
    }
    else{
        res.render("redirect",{redirect_to:"./login"})
    }
})

app.get("/register",(req,res)=>{
    console.log(req.cookies["logged_in_as"])
res.render("register",{return_msg:""})

})
app.get("/login",(req,res)=>{
    console.log(req.cookies["logged_in_as"])
    
if(req.cookies["logged_in_as"] != undefined){
res.render("redirect",{redirect_to:"./"})
}
else{
    res.render("login",)
}

})

app.post("/register",(req,res)=>{
    const username = req.body["username"]
    const password = req.body["password"]
    const password_repeat = req.body["password_repeat"]

    if(password != password_repeat){
        res.render("register",{return_msg:"Hesla maji byt stejna!"})
    }

    if([username+password+password_repeat][0].includes("'")){
        res.render("register",{return_msg:"Tvoje udaje obsahuji zakazany znaky"})

    }

    if(password.length < 8){
        res.render("register",{return_msg:"Heslo ma mit aspon 8 znaku!"})
    }

    db.query("SELECT * FROM USERS WHERE username = ?",username,(err,result)=>{
        if(result == undefined){

            var uid = mkuid(14)
            console.log(uid)


            db.query("INSERT INTO users(uid,username,password) VALUES(?,?,?)",[uid,username,password])
            const query = "CREATE TABLE " + uid + "(id int NOT NULL AUTO_INCREMENT,uid text,question text,answer text,PRIMARY KEY (id))"
            db.query(query)

            res.cookie("logged_in_as",uid,{maxAge: 2.62974383 * Math.pow(10,9)})

            res.render("redirect",{redirect_to:"./"})
        }
        else{
            res.render("register",{return_msg:"Tento uzivatel uz existuje"})
        }
    })

})

app.post("/login",(req,res)=>{
    const username = req.body["username"]
    const password = req.body["password"]
    
    console.log(username)
    console.log(password)
    
    db.query("SELECT * FROM users WHERE username = ? AND password = ?",[username,password],(err,result)=>{
        console.log(result)
        if(result[0] != null){
            res.cookie("logged_in_as",result[0]["uid"],{maxAge: 2.62974383 * Math.pow(10,9)})
            res.render("redirect",{redirect_to:"./"})
        }
        else{
            res.render("login_failed")
        }
    })

})

app.get("/logout",(req,res)=>{
        res.clearCookie("logged_in_as")
        res.render("redirect",{redirect_to:"./login"})

    })

app.get("/user",(req,res)=>{
    const username = req.query["username"]
    console.log(username)
    db.query("SELECT * FROM users WHERE username = ?",username,(err,result)=>
    {
        if(result[0]){
            user = result[0]
        

        if(req.cookies["logged_in_as"] == user["uid"]){
            res.render("redirect",{redirect_to:"./"})
        }
        else {
        db.query("SELECT * FROM " + user["uid"],(err,result)=>  {
            res.render("user",{user:user,questions:result})

        })}

    }

else{
    res.send("Neexsituje")
}

    }
    )
    
})

app.post("/ask",(req,res)=>{
    const uid = req.body["uid"]
    const question = req.body["question"]

    db.query("INSERT INTO " + uid + "(uid,question) VALUES(?,?)",[mkuid(14),question],(err,result)=>{
        if(err){
            res.send("Error")
        }
    })

    db.query("SELECT * FROM users WHERE uid = ?",uid,(err,result)=>{
    const username = result[0]["username"]
    res.render("redirect",{redirect_to:"./user?username="+username})
    })

})

app.post("/answer",(req,res)=>{
    const user_uid = req.body["user"]
    const question_uid = req.body["uid"]
    const answer = req.body["answer"]

    db.query("UPDATE " + user_uid + " SET answer = ? WHERE uid = ?",[answer,question_uid],(err,result)=>{
        if(err){
            res.send("Error")
        }
        
    })
    res.render("redirect",{redirect_to:"./"})
})

app.listen(port)
