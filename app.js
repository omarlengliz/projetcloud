const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const os = require('os');
const fs = require('fs');
const readline = require("readline");


const sdk = require("microsoft-cognitiveservices-speech-sdk");

// Configure SQL connection
const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql', // Specify the dialect of your SQL database
  host: 'projet.mysql.database.azure.com', // Specify your database host
  port: '3306', // Specify your database port
  username: 'userbd', // Specify your database username
  password: 'OmarLengliz@1234', // Specify your database password
  database: 'bd-projet' , // Specify your database name
});



function getHostname() {
    return os.hostname();
  }
// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Set up static files directory
app.use(express.static('public'));

// Middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function generateAudio(text, id) {
  const subscriptionKey = "1b434aef44834092b946d3c8e514b12b";
  const serviceRegion = "eastus"; // e.g., "westus"
  const region = "eastus";
  const endpoint = `https://${region}.tts.speech.microsoft.com/`;
  const audioFile = `./public/audio/${id}.mp3`;
  
  const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, region);
  speechConfig.speechSynthesisVoiceName = "af-ZA-AdriNeural";
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);
  
  var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
  
  synthesizer.speakTextAsync(text,
    function (result) {
  if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
    console.log("synthesis finished.");
  } else {
    console.error("Speech synthesis canceled, " + result.errorDetails +
        "\nDid you set the speech resource key and region values?");
  }
  synthesizer.close();
  synthesizer = null;
},
    function (err) {
  console.trace("err - " + err);
  synthesizer.close();
  synthesizer = null;
});
console.log("Now synthesizing to: " + audioFile);
 
  }


// Route to list quotes
// Route to list quotes
app.get('/', async (req, res) => {
    try {
      await sequelize.authenticate(); // Test the connection
      console.log('Connection has been established successfully.');
      const qoutes = await sequelize.query('SELECT * FROM `qoutes`', {
        type: Sequelize.QueryTypes.SELECT,
      });
      console.log(qoutes)
            const vmName = getHostname(); // Retrieve the
      res.render('index', { quotes: qoutes, vmName }); // Pass hostname to the view
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  app.get('/add', async (req, res) => {
    
  
    try {
    
  
      res.render('add-quote'); // Pass hostname to the view
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
// Route to add new quote
app.post('/add-quote', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).send('Title is required');
  }

  try {
    // Save the quote to the database
    const qoute = await sequelize.query(`INSERT INTO qoutes (title) VALUES ('${title}')`);
    console.log(qoute)
    console.log("jezjejzej")
    // Generate audio for the quote using Azure Text-to-Speech
    const audioPath = await generateAudio(title,qoute[0]);
    // Save the audio path to the database or do other processing
    // For now, just logging it
    console.log("Audio generated for quote:", audioPath);

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
