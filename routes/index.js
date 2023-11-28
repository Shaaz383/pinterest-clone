var express = require('express');
var router = express.Router();

const userModel = require('./users');
const postModel = require('./post')
const passport = require('passport');
const localStrategy = require('passport-local')
const upload = require('./multer')

passport.use(new localStrategy(userModel.authenticate()))

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/feed', function(req, res, next) {
  res.render('feed')
});

//multer upload
router.post('/upload',isLoggedIn, upload.single("file"),async function(req, res, next) {
  if(!req.file){
   return res.status(404).send("no files uploaded")
  }
  const user = await userModel.findOne({username : req.session.passport.user})
  const postData = await postModel.create({
    image : req.file.filename,
    imageText : req.body.filecaption,
    user: user._id 
  })

  user.posts.push(postData._id);
  await user.save();
  res.redirect("/profile")

});


//Passport 

router.get('/profile' ,isLoggedIn,async function(req,res){
  const user = await userModel.findOne({
    username : req.session.passport.user
  })
  .populate('posts')
  console.log(user)
  console.log(user.fullname)
  res.render('profile' , {user})
})


router.post('/register' , function(req,res){
  var userdata = new userModel({
    username : req.body.username,
    fullname : req.body.fullname,
    email : req.body.email,
    
  })
  userModel.register(userdata , req.body.password)
    .then(function(registereduser){
      passport.authenticate('local')(req,res,function(){
        res.redirect('/profile')
      })
    })
})

router.get('/login', function(req, res, next) {
  // console.log(req.flash("error"))
  res.render('login' , {error : req.flash('error')})
});

router.post('/login',passport.authenticate("local" , {
  successRedirect:'/profile/' ,
  failureRedirect:"/login",
  failureFlash : true 
}) , function(req,res){

})

router.get('/logout' , function(req,res,next){
  req.logout(function(err){
    if(err) return next(err);
    res.redirect("/login")
  })
})


function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login')
}







module.exports = router;
