'use strict';

require('dotenv').config();
const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const cors = require('cors');
const dns = require('dns');
const CONNECTION_URL = process.env.CONNECTION_URL;
mongoose.connect(CONNECTION_URL, {
  dbName: 'test',
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
/** this project needs to parse POST bodies **/
// Basic Configuration 
var port = process.env.PORT || 443;
let urlShortenerSchema = new mongoose.Schema(
  {
    original_url: String,
    short_url: Number
  }
);
let UrlModel = mongoose.model('UrlModel', urlShortenerSchema );
/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", async (req, res) => {
  let host;
  if(req.body.url.indexOf('http://www') !== -1){
    host = req.body.url.substring(11, req.body.url.length);
  } else if(req.body.url.indexOf('https://www') !== -1){
    host = req.body.url.substring(12, req.body.url.length);
  } else {
    return res.json({"error":"invalid URL"});
  }
  dns.lookup(host, (err, addresses) => {
    if(err){
      return res.json({"error":"invalid URL"});
    } else if(addresses) {
      let urlObj = {original_url: req.body.url};
      // Find the document
      UrlModel.find(urlObj, (err, result) => { 
        if(err) return res.status(500).send('Something broke!'+err);
        if(result.length === 0){
          urlObj.short_url = urlObj.original_url.hashCode()
          UrlModel.create(urlObj, (err, result) => {
            if(err) return res.status(500).send('Something broke!'+err);
            return res.json({"original_url":result.original_url,"short_url":result.short_url})
          });
        } else {
          return res.json({"original_url":result[0].original_url,"short_url":result[0].short_url})
        }
      })
    }
  });
});

app.get("/api/shorturl/:id", (req, res) => {
  let urlObj = {short_url: Number(req.params.id)};
  UrlModel.find(urlObj, (err, result) => {
    if(err || result.length === 0){
      return res.json({"error":"No short url found for given input"});
    } else {
      return res.redirect(result[0].original_url);
    }
  })
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});