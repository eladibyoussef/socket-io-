const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const PORT = 8080;
const session = require("express-session");
const app = express();
const server = http.createServer(app);
const User = require("./models/user");
const bcrypt = require('bcrypt');
const { log } = require("console");
const path = require('path');


app.use(
  session({
    secret: "ejhvfshgdvs",
    resave: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    saveUninitialized: false,
  })
);


const isAuth = (req,res,next)=>{
  if( req.session.authenticated){
     return  next();
  }else{ 
    res.sendFile(path.join(__dirname,'/public/index.html'));
  }
}

app.get('/',isAuth, (req,res)=>{
  res.redirect('/dashboard')
})

const dbURI = "mongodb://localhost:27017/final-chat";
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// app.use(express.static("public"));
app.use( express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Add this configuration to your app.js
// app.set('view engine', 'ejs');
// app.set('views', './views');



const io = socketIo(server);
io.engine.use(  
  session({
  secret: "ejhvfshgdvs",
  resave: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
  saveUninitialized: false,
}));


app.post("/register", async (req, res) => {
  const { username, useremail, userpassword } = req.body;
  try {
    const user = await User.findOne({ email: useremail });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userpassword, salt);
      const newUser = new User({
        name : username,
        email: useremail,
        password: hashedPassword,
      });
     await newUser.save(); 
      req.session.authenticated = true;
      req.session.user = user;
      console.log(req.session);
      // res.redirect('/dashboard');
      // res.render('./views/chat.ejs');

      console.log('user created ' ,newUser.name);
      res.status(201).json({message:`user created , welcome ${newUser.name}`})

    } else {
      res
        .status(400)
        .json({ message: "user already exists , please choose another email" });
        console.log('user already exist');
    }
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordsMatch = await bcrypt.compare(password, userData.password);
      if (passwordsMatch) {
        req.session.authenticated = true;
        req.session.user = userData;
        const userJson = JSON.stringify(userData);
        res.cookie('user', userJson, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
        // res.status(201).json({message:'connected successfully'})
        // res.redirect('/dashboard');
        res.status(201).json({message: 'connected successfully ', user: req.session.user})

        // io.on('connected', async (socket)=>{
        //   console.log(`the user ${req.session.user} is connected on socket ${socket.id}`);
        //   io.emit('username', req.session.user)
        // })


        console.log('connected');
      } else {
        res.status(400).json({ message: "Invalid email or password" });
      }
    } else {
      res.status(404).json({ message: "user not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
});

app.get('/dashboard',isAuth,(req,res)=>{

  // const user = { user: req.session.user };
  // console.log(user);
  const user = {
    id: req.session.user._id,
    name: req.session.user.name,
    email: req.session.user.email
  }
  const userJson = JSON.stringify(user);
  res.cookie('message' , userJson, {maxAge: 24 * 60 * 60 * 1000 });
  res.sendFile(path.join(__dirname,'/public/chat.html'));
})


let socketsConected = new Set()

io.on('connection', onConnected)

function onConnected(socket ) {

  const session = socket.request.session;
// console.log('socket:',session);
  console.log(` socket id :  ${socket.id}`)
  socketsConected.add(socket.id)
  io.emit('clients-total', socketsConected.size )

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id)
    socketsConected.delete(socket.id)
    io.emit('clients-total', socketsConected.size)
  })

  socket.on('message', (data , receiver) => {
    console.log(data)
    // console.log(receiver)
 if (receiver == ''){
  socket.broadcast.emit('chat-message', data);
 }else {
  socket.to(receiver).emit('chat-message', data);
 }

  })

  socket.on('feedback', (data) => {
    socket.broadcast.emit('feedback', data)
  })
}


server.listen(PORT ,() => console.log(`http://localhost:${PORT}`));
