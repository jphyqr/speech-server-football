//export GOOGLE_APPLICATION_CREDENTIALS="/Users/johnhashem/Downloads/football-267615-0a4afecaad39.json"

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");

const port = process.env.PORT || 4001;
const index = require("./routes/index");
var  {SCALE_PX_YARDS, FIELD_DIMENSIONS} = require("./constants")
const {updateObjectWithCalculations, swapAndScaleBoundaries} = require("./helpers")

const app = express();
app.use(index);

const formations = {
  base: {
    QB: { _width: 0, _length: -1 },
    C: { _width: 0, _length: 0 },
    RG: {_width:1, _length:0 },
    RT: {_width:2, _length:0 },
    LG: {_width:-1, _length:0 },
    LT: {_width:-2, _length:0 },
    LR: { _width: -10, _length: 0 },
    RR: { _width: 20, _length: 0 }
  },
  spread: {
    QB: { _width: 0, _length: -5 },
    C: { _width: 0, _length: 0 },
    LR: { _width: -20, _length: 0 },
    RR: { _width: 40, _length: 0 }
  }
};

const landmarks = {

    "NFL" : {
        LEFT_HASH: 23.58,
        RIGHT_HASH:   29.92
    },
    "CFL" : {
        LEFT_HASH: 24,
        RIGHT_HASH: 41
    }
}

let gameState = {
  width: landmarks["NFL"].LEFT_HASH,
  length: 35,
  league: "NFL",
  view: "east",
  formation: "base",
  playerAlignments: formations["base"],
  landmarks : landmarks["NFL"]
};


const updatePlayerAlignmentsByFormationAroundBall = gameState => {
 
  let { playerAlignments , view, yardPxScale} = gameState;
  let updatedPlayerAlignments = {};

  let formation = formations[`${gameState.formation}`];

  Object.keys(playerAlignments).map(function(key, index) {
    let currentAlignemnts = playerAlignments[`${key}`]

    let updateLocation = {};

let yCalc, xCalc;
yCalc = xCalc = 0;

    switch(view){

      case "west" :

        yCalc = -formation[`${key}`]._width + gameState.width;
        xCalc = formation[`${key}`]._length + gameState.length
        updateLocation.Y_ABSOLUTE = yCalc*yardPxScale;
        updateLocation.X_ABSOLUTE = (Math.abs(xCalc-100))*yardPxScale;

        

        updatedPlayerAlignments[`${key}`] = Object.assign(currentAlignemnts, updateLocation);
      
      break;


case "east" :

  yCalc = formation[`${key}`]._width + gameState.width;
  xCalc = formation[`${key}`]._length + gameState.length
  updateLocation.Y_ABSOLUTE = yCalc*yardPxScale;
  updateLocation.X_ABSOLUTE = xCalc*yardPxScale;
  updatedPlayerAlignments[`${key}`] = Object.assign(currentAlignemnts, updateLocation);

break;


case "end zone" :



  xCalc = formation[`${key}`]._width + gameState.width;
  yCalc = formation[`${key}`]._length + gameState.length
  updateLocation.Y_ABSOLUTE = (Math.abs(yCalc-100))*yardPxScale;
  updateLocation.X_ABSOLUTE = xCalc*yardPxScale;
  updatedPlayerAlignments[`${key}`] = Object.assign(currentAlignemnts, updateLocation);

break;
default:

    }



  });


  
  return updatedPlayerAlignments;
};





//heiarchy: Field Commands -> Ball Commads -> Alignment Commands -> Assignment Commands

//Ball update: Update Ball, then update Alignments around ball

//Alignment Commands: update alignment around ball


const route = {
  out : [{_l:5,_o:0}, {_l:0, _o:10}],
  fly: [{_l:20,_o:0}]

}

const concept = {
    "all go" : {
      //  LR: route.fly,
        RR: route.fly
    },
    "scorpion" : {
       LR: route.out,
        RR: route.out
    }
}


const allCommands = {
  "left hash": "setBall",
  "right hash": "setBall",
  "yard line": "setBall",
  "1st": "setBall",
  "2nd": "setBall",
  "3rd": "setBall",
  "4th": "setBall",
  "spread": "setFormation",
  "base": "setFormation",
  "all go" : "setFormation",
  "scorpion" : "setFormation",
  "end zone" : "setView",
  "east" : "setView",
  "zoom in" : "setZoom",
  "west" : "setView"
};

const formationMatches = {
  "spread": "setFormation",
  "base": "setFormation"
};


const leagueMatches = {
  
    "NFL" : "setLeague",
    "CFL" : "setLeague",
    "NCAA" : "setLeague"
  };


  const viewMatches = {
  
    "end zone" : "setView",
    "east" : "setView",
    "west": "setView"
  };

  const zoomMatches = {
  
    "zoom in" : "setZoom",
  };

  
  const conceptMatches = {
  
    "all go" : "setConcept",
    "scorpion" : "setConcept"
  };


const transformForCanvas = (gameState) =>{
   let updatedGameState = gameState;
   const {screenType, view, league, zoomIn} = gameState;

   let scale = SCALE_PX_YARDS[`${screenType}`]

  if(zoomIn)
  scale=scale*3
  
   updatedGameState.yardPxScale = scale
   let dimensions = FIELD_DIMENSIONS[`${gameState.league}`]
  
 const fieldScaledPx = swapAndScaleBoundaries(dimensions, view, scale, zoomIn)

//hashMarks



 //should swap what needs to be swapped, and only scale swapped values

updatedGameState = Object.assign(updatedGameState, fieldScaledPx)

 //hash marks







  //let updateObject = updateObjectWithCalculations(dimensions, scale)

  return updatedGameState
}

const server = http.createServer(app);

const io = socketIo(server); // < Interesting!

io.on("connection", socket => {


  socket.on("setScreenType", screenType => {
    gameState.screenType = screenType
    gameState = transformForCanvas(gameState)
   


    gameState.playerAlignments = updatePlayerAlignmentsByFormationAroundBall(
    gameState
  );

 // Object.assign(gameState, updateObject)
   socket.emit("updateGameState", gameState);
 });
  socket.on("disconnect", () => console.log("Client disconnected"));
  socket.emit("updateGameState", gameState);

  
 
});




server.listen(port, () => console.log(`Listening on port ${port}`));

//http
//  .createServer(function(req, res) {
// res.write("Hello World!"); //write a response to the client
// res.end(); //end the response

const recorder = require("node-record-lpcm16");

// Imports the Google Cloud client library
const speech = require("@google-cloud/speech");

// Creates a client
const client = new speech.SpeechClient();

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const encoding = "LINEAR16";
const sampleRateHertz = 16000;
const languageCode = "en-US";

const phrase = "left hash our 35";
const boost = 20.0;
const phrases = [];

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    enableWordConfidence: true,
    maxAlternatives: 3,
    speechContexts: [
      {
        phrases: [
          "left hash",
          "right hash",
          "yardline",
          "1st",
          "2nd",
          "3rd",
          "4th",
          "+",
          "-",
          "base",
          "end zone",
          "east",
          "west",
          "zoom",
          "all go"
        ],
        boost: 20
      },
      {
        phrases: ["four down", "cover 3"],
        boost: 2
      }
    ]
  },
  interimResults: false // If you want interim results, set this to true
};

// Create a recognize stream
const recognizeStream = client
  .streamingRecognize(request)
  .on("error", console.error)
  .on("data", data => {
    console.log("data.results", data.results[0].alternatives);
    const transcription = data.results
      .map(result => result.alternatives[0].transcript)
      .join("\n");
    // process.stdout.write(
    //   data.results[0] && data.results[0].alternatives[0]
    //     ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
    //     : `\n\nReached transcription time limit, press Ctrl+C\n`
    // )
    console.log(`Transcription: ${transcription}`);

    io.emit("newTranscription", transcription);

    Object.keys(zoomMatches).map(function(key, index) {
      if (transcription.includes(key)) {
        console.log("Zoom match", key);
        gameState.zoomIn = true;
        gameState.view="end zone"
        gameState = transformForCanvas(gameState)
       


    //    gameState.landmarks = landmarks[`${key}`];
    io.emit("updateGameState", gameState);
      }
    });




    Object.keys(leagueMatches).map(function(key, index) {
        if (transcription.includes(key)) {
          console.log("LEAGUE FORMATION", key);
          gameState.league = key;
          gameState = transformForCanvas(gameState)
         


      //    gameState.landmarks = landmarks[`${key}`];
      io.emit("updateGameState", gameState);
        }
      });


      Object.keys(viewMatches).map(function(key, index) {
        if (transcription.toLowerCase().includes(key)) {
          console.log("VIEW MATCH", key);
          gameState.view = key;
          gameState.zoomIn = false;
          gameState = transformForCanvas(gameState)
         
          io.emit("updateGameState", gameState);
        }
      });




    Object.keys(allCommands).map(function(key, index) {
      // console.log(allCommands2[key])
      if (transcription.toLowerCase().includes(key)) {
        // check if its a formation change



  


        Object.keys(formationMatches).map(function(key, index) {
          if (transcription.includes(key)) {
            console.log("FOUND FORMATION", key);
            gameState.formation = key;
          }
        });


        Object.keys(conceptMatches).map(function(key, index) {
            if (transcription.includes(key)) {
              console.log("FOUND CONCEPT", key);
           
     
              let alignments = formations[`${gameState.formation}`]
           
              Object.keys(alignments).map(positionKey=>{
                  console.log('alignments[positionkey]', alignments[`${positionKey}`])
                  console.log('concept[key]', concept[`${key}`])
                  console.log('concept[key]key', concept[`${key}`][`${positionKey}`])
                  let updatePlayerFormation = alignments[`${positionKey}`]
                  console.log({updatePlayerFormation})
                  updatePlayerFormation.route = concept[`${key}`][`${positionKey}`]
                  console.log(alignments[`${positionKey}`])
                  alignments[`${positionKey}`] = updatePlayerFormation
              })
              gameState.playerAlignments = alignments;

              console.log('qb alignments', alignments["QB"])
              console.log('final gameState', gameState)
            }
          });

        let updateObject = {};
        //determine hash

        if (transcription.includes("left")) {
          updateObject.width = landmarks[`${gameState.league}`].LEFT_HASH;
        }
        if (transcription.includes("right")) {
            updateObject.width = landmarks[`${gameState.league}`].RIGHT_HASH;
        }
        if (transcription.includes("yard line")) {
          transcription.replace("-", " ").split("yard line");

          let split = transcription.split("yard line");
          let prefix = split[0].trim();
          let preTerms = prefix.split(" ");
          let lastTerm = preTerms[preTerms.length - 1];
          updateObject.length = parseInt(lastTerm);
        }
        //determine down and distance
        console.log('gameState before spread', gameState)
        gameState = { ...gameState, ...updateObject };
        console.log('gameState after spread', gameState)
        gameState.playerAlignments = updatePlayerAlignmentsByFormationAroundBall(
          gameState
        );

        console.log('updateGameState')
        io.emit("updateGameState", gameState);
      }
    });

    console.log(`Word-Level-Confidence:`);
    const words = data.results.map(result => result.alternatives[0]);
    words[0].words.forEach(a => {
      console.log(` word: ${a.word}, confidence: ${a.confidence}`);
    });
  });

// Start recording and send the microphone input to the Speech API.
// Ensure SoX is installed, see https://www.npmjs.com/package/node-record-lpcm16#dependencies
recorder
  .record({
    sampleRateHertz: sampleRateHertz,
    threshold: 0,
    // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
    verbose: false,
    recordProgram: "rec", // Try also "arecord" or "sox"
    silence: "10.0"
  })
  .stream()
  .on("error", console.error)
  .pipe(recognizeStream);

//     console.log("Listening, press Ctrl+C to stop.");
//   })
//   .listen(8080); //the server object listens on port 8080
