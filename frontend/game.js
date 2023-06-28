import {display} from './modal.js';

// Redirect to the login page if the token doesn't exist
if (!('token' in sessionStorage))
    location.pathname = '/login.html';

const result = document.getElementById('roll-result');
const clientImg = document.getElementById('client-roll-img');
const serverImg = document.getElementById('server-roll-img');

function printResults() {

    //Client Result
    var clientChooseX = document.getElementById('client-choose-x');
    clientChooseX.textContent = localStorage.getItem("clientToClientUnhashed");
    var clientChooseHx = document.getElementById('client-choose-hx');
    clientChooseHx.textContent = localStorage.getItem("clientToClientHash");
    var clientGiveX = document.getElementById('client-given-x');
    clientGiveX.textContent = localStorage.getItem("serverToClientUnhashed");
    var clientGiveHx = document.getElementById('client-given-hx');
    clientGiveHx.textContent = localStorage.getItem("serverToClientHash");


    var clientResult = ((parseInt(localStorage.getItem("clientToClientUnhashed")) ^ parseInt(localStorage.getItem("serverToClientUnhashed"))) % 6) + 1;
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

    const clientToServerUnhashed = localStorage.getItem("clientToServerUnhashed");

    const serverResult = (((serverToServerUnhash ^ clientToServerUnhashed) % 6) + 1);

    const serverDiceResult = document.getElementById('server-dice-result');
    serverDiceResult.textContent = serverResult;
}

/**
 * Compares two integers.
 * @param {number} a the first integer
 * @param {number} b the second integer
 * @returns {number} `-1`, `0`, or `1`
 */
const cmp = (a, b) => (a > b) - (a < b);

/**
 * Computes a die roll from two numbers via XOR.
 * @param {BigInt} ra the first number
 * @param {string} rb the second number (as a string)
 * @returns {number} a value from 1~6
 */
const compute = (ra, rb) => Number((ra ^ BigInt(rb)) % 6n) + 1;

/**
 * Show errors in a modal.
 * @param {any} data the error data
 */
function showErrors(data) {
    if ('detail' in data) {
        display(data.detail);
    } else if ('messages' in data) {
        const divs = Array.from(data.messages, (msg) => `<div>${msg}</div>`);
        display(divs.join('\n'));
    } else {
        const divs = Object.entries(data)
            .map(([key, val]) => `<div><b>${key}</b>: ${val}</div>`);
        display(divs.join('\n'));
    }
}

document.getElementById('roll-button').addEventListener('click', async (evt) => {
    // Start the dice roll
    evt.target.setAttribute('aria-busy', true);
    result.textContent = 'Rolling\u2026';
    const rollAnimation = setInterval(() => {
        const rand = () => (Math.round(Math.random() * 5) + 1);
        clientImg.src = `/dice_images/dice-${rand()}.png`;
        serverImg.src = `/dice_images/dice-${rand()}.png`;
    }, 100);

    // Generate two random 64-bit integers and hash them with SHA3-256
    const [rand1, rand2] = crypto.getRandomValues(new BigUint64Array(2));
    const hash = await hashwasm.sha3(rand1.toString() + rand2.toString(), 256);

    // Send the hash to the server (commit)
    const base = 'https://backend.localhost/api/game'
    const headers = {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };
    let body = JSON.stringify({ client_hash: hash });
    let res = await fetch(`${base}/commit/`, { method: 'POST', headers: headers, body: body });
    // FIXME: can't read the response body for some reason
    if (res.status === 401) {
        evt.target.setAttribute('aria-busy', false);
        result.textContent = 'An error occurred';
        display('Unauthorized. Please login or register.');
        return;
    }
    let data = await res.json();

    // Display an error if it failed
    if (!res.ok) {
        evt.target.setAttribute('aria-busy', false);
        result.textContent = 'An error occurred!';
        showErrors(data);
        return;
    }
    const serverHash = data.server_hash;

    // Send the integers to the server (reveal)
    body = JSON.stringify({
        client_integers: {
            client: rand1.toString(),
            server: rand2.toString()
        }
    });
    res = await fetch(`${base}/reveal/`, { method: 'POST', headers: headers, body: body });
    data = await res.json();
    // Display an error if it failed
    if (!res.ok) {
        evt.target.setAttribute('aria-busy', false);
        result.textContent = 'An error occurred!';
        showErrors(data);
        return;
    }

    // Compute the dice rolles
    const clientRoll = compute(rand1, data.server_integers.client);
    const serverRoll = compute(rand2, data.server_integers.server);

    // Display the winner
    const output = {
        '-1': 'You LOST!',
        '1': 'You WON!',
        '0': 'It\'s a tie!'
    };
    setTimeout(() => {
        evt.target.setAttribute('aria-busy', false);
        clearInterval(rollAnimation);
        clientImg.src = `/dice_images/dice-${clientRoll}.png`;
        serverImg.src = `/dice_images/dice-${serverRoll}.png`;
        result.textContent = output[cmp(clientRoll, serverRoll)];
    }, 1000);
});
