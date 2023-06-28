var resultFlag = false;

function firstLoad(){
  var clientImage = document.getElementById("client-dice-img");
  clientImage.setAttribute("height", "200");
  clientImage.setAttribute("width", "200");
  clientImage.src = "dice_images/dice-0.png";
  
  var serverImage = document.getElementById("server-dice-img");
  serverImage.setAttribute("height", "200");
  serverImage.setAttribute("width", "200");
  serverImage.src = "dice_images/dice-0.png";

  var resultField = document.getElementById("result-field");
  resultField.textContent = "Ready to Roll."
}

function clientSendHashes() {
  var resultField = document.getElementById("result-field");
  resultField.textContent = "Rolling....";

    //Client to Server Unhashed
    var clientToServerUnhashed = generateRandom256BitDecimal();
    localStorage.setItem("clientToServerUnhashed", clientToServerUnhashed);   
    
    //Client to Server Hashed 
    var clientToServerHashedValue = sha256(clientToServerUnhashed.toString());
    localStorage.setItem("clientToServerHash", clientToServerHashedValue);
   
    //Client to Client Unhashed
    var clientToClientUnhashed = generateRandom256BitDecimal();
    localStorage.setItem("clientToClientUnhashed", clientToClientUnhashed);   
    
    //Client to Client Hashed        
    var clientToClientHashedValue = sha256(clientToClientUnhashed.toString());
    localStorage.setItem("clientToClientHash", clientToClientHashedValue);
    
    if(true){
      serverToClientUnhash = generateRandom256BitDecimal();
      localStorage.setItem("serverToCLientUnhashed", serverToClientUnhash);
      serverToClientHash = sha256(serverToClientUnhash.toString());
      localStorage.setItem("serverToCLientHash", serverToClientHash);
      //alert(serverToClientHash);
      serverToServerUnhash = generateRandom256BitDecimal();
      localStorage.setItem("serverToServerUnhashed", serverToServerUnhash);
      serverToServerHash = sha256(serverToServerUnhash.toString());
      localStorage.setItem("serverToServerHash", serverToServerHash);

      clientSendUnhashes();
    }
}

function clientSendUnhashes(){
    var serverToClientHash = localStorage.getItem("serverToClientHash");
    var serverToServerHash = localStorage.getItem("serverToServerHash");
    
    clientToServerUnhashed = localStorage.getItem("clientToServerUnhashed");
    clientToClientUnhashed = localStorage.getItem("clientToClientUnhashed");
    

    var clientDiceNumber = Math.floor(Math.random() * 6) + 1;
    var serverDiceNumber = Math.floor(Math.random() * 6) + 1;
    changeDiceImage(clientDiceNumber, serverDiceNumber);
    //document.getElementById('submit-button2').click();
}


function changeDiceImage(clientDiceNumber, serverDiceNumber) {
    
  var clientImage = document.getElementById("client-dice-img");
  clientImage.setAttribute("height", "200");
  clientImage.setAttribute("width", "200");
  displayDice(15, clientImage, clientDiceNumber);
  clientImage.src = "dice_images/dice-" + clientDiceNumber + ".png";

  
  var serverImage = document.getElementById("server-dice-img");
  serverImage.setAttribute("height", "200");
  serverImage.setAttribute("width", "200");
  displayDice(15, serverImage, serverDiceNumber);
  serverImage.src = "dice_images/dice-" + serverDiceNumber + ".png";
  
  
  //printResults();
  

  setTimeout(function () {
    totalResult(clientDiceNumber, serverDiceNumber);
}, 1800);

  }

function totalResult(clientDiceNumber, serverDiceNumber){
    var resultField = document.getElementById("result-field");
    if (clientDiceNumber > serverDiceNumber){
      resultField.textContent = "You WIN!";
    } else if (clientDiceNumber < serverDiceNumber){
      resultField.textContent = "You LOST";
    } else{
      resultField.textContent = "DRAW";
    }
  }


function printResults(){
    
  //Client Result 
    var clientChooseX = document.getElementById('client-choose-x');
    clientChooseX.textContent = localStorage.getItem("clientToClientUnhashed");
    var clientChooseHx = document.getElementById('client-choose-hx');
    clientChooseHx.textContent = localStorage.getItem("clientToClientHash");
    var clientGiveX = document.getElementById('client-given-x');
    clientGiveX.textContent = localStorage.getItem("serverToClientUnhashed");
    var clientGiveHx = document.getElementById('client-given-hx');
    clientGiveHx.textContent = localStorage.getItem("serverToClientHash");
    
    
    var clientResult = ((parseInt(localStorage.getItem("clientToClientUnhashed")) ^ parseInt(localStorage.getItem("serverToClientUnhashed"))) % 6)+1;
    var clientDiceResult = document.getElementById('client-dice-result');
    clientDiceResult.textContent = clientResult;


    //Server Result 
    var serverChooseX = document.getElementById('server-choose-x');
    serverChooseX.textContent = localStorage.getItem("serverToServerUnhashed");
    var serverChooseHx = document.getElementById('server-choose-hx');
    serverChooseHx.textContent = localStorage.getItem("serverToServerHash");
    var serverGiveX = document.getElementById('server-given-x');
    serverGiveX.textContent = localStorage.getItem("clientToServerUnhashed");
    var serverGiveHx = document.getElementById('server-given-hx');
    serverGiveHx.textContent = localStorage.getItem("clientToServerHash");
    
    const serverToServerUnhash = localStorage.getItem("serverToServerUnhashed");
    alert(serverToServerUnhash);
    const clientToServerUnhashed = localStorage.getItem("clientToServerUnhashed");
    alert(clientToServerUnhashed);
    const serverResult = (((serverToServerUnhash ^ clientToServerUnhashed) % 6)+1);
    alert(typeof serverResult);
    const serverDiceResult = document.getElementById('server-dice-result');
    serverDiceResult.textContent = serverResult;
}

function sha256(input) {
    return CryptoJS.SHA256(input).toString();
}

// function rnd256() {
//     const bytes = new Uint8Array(32);
    
//     // load cryptographically random bytes into array
//     window.crypto.getRandomValues(bytes);
    
//     // convert byte array to hexademical representation
//     const bytesHex = bytes.reduce((o, v) => o + ('00' + v.toString(16)).slice(-2), '');
    
//     // convert hexademical value to a decimal string
//     return BigInt('0x' + bytesHex).toString(10);
//   }


function generateRandom256BitDecimal() {
    // Generate 8 random 32-bit integers (totaling 256 bits)
    var randomIntegers = [];
    for (var i = 0; i < 8; i++) {
        randomIntegers.push(Math.floor(Math.random() * Math.pow(2, 32)));
    }
    // Combine the random integers into a BigInt value
    var result = randomIntegers.reduce(function(acc, curr, index) {
        return acc + BigInt(curr) * (BigInt(2) ** (BigInt(32) * BigInt(index)));
    }, BigInt(0));

    return result;
    }


function displayDice(times, elem, final) {
      
      if (times > 1) {       
        elem.src = "dice_images/dice-"+(Math.round(Math.random() * 5) + 1)+".png";      
          setTimeout(function () {
              displayDice(times-1, elem, final);
          }, 100);
      } else {
        elem.src = "dice_images/dice-"+final+".png"; 
      }
        
    }


    // function generateTable() {
    //   // creates a <table> element and a <tbody> element
    //   const table = document.getElementById("detailTable");
      
    //     var tr = document.createElement('tr');   


    //     var td1 = document.createElement('td');
    //     var td2 = document.createElement('td');
    
    //     var text1 = document.getElementById("client-to-server-hashed-input");
    //     var text2 = document.getElementById("client-to-client-hashed-input");
    
    //     td1.appendChild(text1);
    //     td2.appendChild(text2);
    //     tr.appendChild(td1);
    //     tr.appendChild(td2);
    
    //     table.appendChild(tr);
    
      
    //   // sets the border attribute of tbl to '2'
    //   table.setAttribute("border", "2");
    // }

    


// $('#throw').click(function () {
//         alert("throw");
//         throwAnimatedDice( this, index );
// });

// function throwAnimatedDice(elem, spins) {
//     var value = Math.round(Math.random() * 5) + 1;
//     displayDice(10 + (spins*5), value, $(elem));

//     return value;
// }

// function displayDice(times, final, element) {
//     element.removeClass();
//     if (times > 1) {
//         element.addClass('/dice_images/dice-' + (Math.round(Math.random() * 5) + 1));
//         setTimeout(function () {
//             displayDice(times -1, final, element);
//         }, 100);
//     } else element.addClass('/dice_images/dice-' + final);
// }