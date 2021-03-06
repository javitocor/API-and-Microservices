require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const { body, validationResult } = require('express-validator');

const mongoose = require('mongoose')
var mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log("MongoDB database connection established successfully");
});
var Schema = mongoose.Schema;
var UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true }
  }
);
const User = mongoose.model("User", UserSchema);
var ExerciseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: new Date().toDateString() }
  }
);
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.post('/api/exercise/new-user', async function (req, res) {
  try {
    const username = req.body.username;
    let findOne = await User.findOne({
      username: username
    })
    if (findOne) {
      res.json({
        message: 'Username already taken'
      })
    } else {
      let user = new User({
        username: username
      });
      await user.save(function (err) {
        if (err) return console.error(err);
        res.json({
          username: user.username,
          _id: user._id
        })
      });
    }
  } catch (err) {
    console.error(err)
    res.status(500).json('Server erorr...')
  }
});
app.get('/api/exercise/users', async function (req, res) {
  try {
    let users = await User.find({}, 'username', function (err, users) {
      console.log(users)
      if (err) {
        console.log(err);
      } else {
        res.send(users);
      }
    });
  } catch (err) {
    console.error(err)
    res.status(500).json('Server erorr...')
  }
});
app.post('/api/exercise/add', async function (req, res) {
  try {
    const { userId, description, duration, date } = req.body;
    let user = await User.findOne({
      _id: userId
    })
    let exercise;
    if (user) {
      if (date) {
        exercise = new Exercise({
          userId: userId,
          description: description,
          duration: parseInt(duration),
          date: new Date(date).toDateString()
        });
      } else {
        exercise = new Exercise({
          userId: userId,
          description: description,
          duration: parseInt(duration)
        });
      }
      await exercise.save(function (err) {
        if (err) return console.error(err);
        res.json({
          _id: user._id,
          username: user.username,
          description: exercise.description,
          duration: exercise.duration,
          date: new Date(exercise.date).toDateString()
        })
      });
    } else {
      res.json({ error: 'The user does not exist' })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json('Server erorr...')
  }
});
app.get('/api/exercise/log', async function (req, res) {
  try {
    if (Object.keys(req.query).length !== 0 && req.query.userId != '') {
      let from = req.query.from;
      let to = req.query.to;
      let limit = parseInt(req.query.limit);
      let userId = req.query.userId;
      let user = await User.findOne({ _id: userId })
      if (!from && !to && !limit) {
        await Exercise.find({ userId: userId }, function (err, exercises) {
          if (err) return console.log(err);
          res.json({ 
            _id: user._id, 
            username: user.username,
            log: exercises, 
            count: exercises.length 
          })
        });
      } else if(!from && !to && limit) {
        await Exercise.find({userId: userId}).limit(limit).exec(function (err, exercises){
          if (err) {
            console.log(err);
          } else {
            res.json({
              _id:user._id,
              username: user.username,
              log: exercises,
              count: exercises.length
            });
          }
        })
      } else if(from && !to && !limit) {
        limit = 100000000;
        await Exercise.find({
          userId: userId,
          date: {
            $gte: new Date(new Date(from).setHours(00, 00, 00)),
            $lt: new Date(new Date(new Date(10000000000000)).setHours(23, 59, 59))
          }
        }).limit(limit).exec(function (err, exercises) {
          if (err) {
            console.log(err);
          } else {
            res.json({
              _id:user._id,
              username: user.username,
              From: new Date(from).toDateString(),
              log: exercises,
              count: exercises.length
            });
          }
        })
      } else if(!from && to && !limit) {
        limit = 100000000;
        await Exercise.find({
          userId: userId,
          date: {
            $gte: new Date(new Date(new Date(0)).setHours(00, 00, 00)),
            $lt: new Date(new Date(to).setHours(23, 59, 59))
          }
        }).limit(limit).exec(function (err, exercises) {
          if (err) {
            console.log(err);
          } else {
            res.json({
              _id:user._id,
              username: user.username,
              To: new Date(to).toDateString(),
              log: exercises,
              count: exercises.length
            });
          }
        })
      } else if(!from && !to && limit) {
        await Exercise.find({userId: userId}).limit(limit).exec(function (err, exercises){
          if (err) {
            console.log(err);
          } else {
            res.json({
              _id:user._id,
              username: user.username,
              log: exercises,
              count: exercises.length
            });
          }
        })
      } else if((from && !to && !limit)||(from&&!to&&limit)) {
        if(!limit){
          limit = 100000000;
        }
        await Exercise.find({
          userId: userId,
          date: {
            $gte: new Date(new Date(from).setHours(00, 00, 00)),
            $lt: new Date(new Date(new Date(10000000000000)).setHours(23, 59, 59))
          }
        }).limit(limit).exec(function (err, exercises) {
          if (err) {
            console.log(err);
          } else {
            res.json({
              _id:user._id,
              username: user.username,
              from: new Date(from).toDateString(),
              log: exercises,
              count: exercises.length
            });
          }
        })
      } else if((!from && to && !limit)||(!from&&to&&limit)) {
        if(!limit){
          limit = 100000000;
        }
        await Exercise.find({
          userId: userId,
          date: {
            $gte: new Date(new Date(new Date(0)).setHours(00, 00, 00)),
            $lt: new Date(new Date(to).setHours(23, 59, 59))
          }
        }).limit(limit).exec(function (err, exercises) {
          if (err) {
            console.log(err);
          } else {
            res.json({
              _id:user._id,
              username: user.username,
              to: new Date(to).toDateString(),
              log: exercises,
              count: exercises.length
            });
          }
        })
      } else {
        if (!from) {
          from = new Date(0);
        }
        if (!to) {
          to = new Date(10000000000000);
        }
        if(!limit){
          limit=10000000000;
        }
        await Exercise.find({
          userId: userId,
          date: {
            $gte: new Date(new Date(from).setHours(00, 00, 00)),
            $lt: new Date(new Date(to).setHours(23, 59, 59))
          }
        }).limit(limit).exec(function (err, exercises) {
          if (err) {
            console.log(err);
          } else {
            res.json({
              _id:user._id,
              username: user.username,
              from: new Date(from).toDateString(),
              to: new Date(to).toDateString(),
              log: exercises,
              count: exercises.length
            });
          }
        })
      }
    } else {
      res.send('No query or userId provided')
    }
  } catch (err) {
    console.error(err)
    res.status(500).json('Server erorr...')
  }
})
// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
})
// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
