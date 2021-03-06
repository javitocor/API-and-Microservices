'use strict';
require('dotenv').config();
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var shortId = require('shortid');
var validUrl = require('valid-url');
var cors = require('cors');
var dns = require('dns');


var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
// mongoose.connect(process.env.DB_URI);
var mongoDB = process.env.DB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

var Schema = mongoose.Schema;
var UrlSchema = new Schema(
  {
    original_url: { type: String, required: true },
    short_url: { type: String, required: true }
  }
);
const Url = mongoose.model("Url", UrlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint... 
app.post("/api/shorturl/new", async function (req, res) {
  const input = req.body.url;
  const short = shortId.generate();

  if (!validUrl.isWebUri(input)) {
    res.status(401).json({
      error: 'invalid URL'
    })
  } else {
    try {
      let findOne = await Url.findOne({
        original_url: input
      })
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        let url = new Url({
          original_url: input,
          short_url: short
        });
        await url.save(function (err) {
          if (err) return console.error(err);
          res.json({
            original_url: url.original_url,
            short_url: url.short_url
          })
        });
      }
    } catch (err) {
      console.error(err)
      res.status(500).json('Server erorr...')
    }
  }
});

app.get("/api/shorturl/:short_url", async function (req, res) {
  try {
    const short = req.params.short_url;
    let findOne = await Url.findOne({
      short_url: short
    })
    if (findOne) {
      res.redirect(findOne.original_url)
    } else {
      res.status(404).json('No URL found')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json('Server error')
  }

});


app.listen(port, function () {
  console.log('Node.js listening ...');
});