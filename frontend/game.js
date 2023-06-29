import { display } from './modal.js';

// Redirect to the login page if the token doesn't exist
if (!('token' in sessionStorage))
    location.pathname = '/login.html';

const rollButton = document.getElementById('roll-button');
const rollResult = document.getElementById('roll-result');

const clientImg = document.getElementById('client-roll-img');
const serverImg = document.getElementById('server-roll-img');

const clientSentHr = document.getElementById('client-sent-hr');
const clientChosenR = document.getElementById('client-chosen-r');
const clientReceivedR = document.getElementById('client-received-r');

const serverSentHr = document.getElementById('server-sent-hr');
const serverChosenR = document.getElementById('server-chosen-r');
const serverReceivedR = document.getElementById('server-received-r');

const clientResult = document.getElementById('client-result');
const serverResult = document.getElementById('server-result');

/**
 * Compares two integers.
 * @param {number} a the first integer
 * @param {number} b the second integer
 * @returns {number} `-1`, `0`, or `1`
 */
const cmp = (a, b) => (a > b) - (a < b);

/**
 * Computes a dice roll from two numbers via XOR.
 * @param {BigInt} ra the first number
 * @param {string} rb the second number (as a string)
 * @returns {number} a value from 1~6
 */
const compute = (ra, rb) => Number((ra ^ BigInt(rb)) % 6n) + 1;

/**
 * Contatenates and hashes two numbers with SHA3-256.
 * @param {string} ra the first number (as a string)
 * @param {string} rb the second number (as a string)
 */
const hash = async (ra, rb) => hashwasm.sha3(ra + rb, 256);

/**
 * Show errors in a modal.
 * @param {any} data the error data
 */
function showErrors(data) {
    rollButton.setAttribute('aria-busy', false);
    rollResult.textContent = 'An error occurred';
    if ('detail' in data) {
        display(data.detail);
    } else if ('messages' in data) {
        const nodes = Array.from(data.messages, (msg) =>
            Object.assign(document.createElement('div'), { textContent: msg }));
        display(nodes);
    } else {
        const nodes = []
        for (const [key, val] of Object.entries(data)) {
            const div = document.createElement('div');
            const b = document.createElement('b');
            b.textContent = key + ':';
            div.append(b, ' ' + val);
            nodes.push(div);
        }
        display(nodes);
    }
}

document.getElementById('logout').addEventListener('click', () => {
    delete sessionStorage.token;
});

rollButton.addEventListener('click', async () => {
    // Start the dice roll
    rollButton.setAttribute('aria-busy', true);
    clientImg.previousElementSibling.classList.add('hide');
    serverImg.previousElementSibling.classList.add('hide');
    rollResult.textContent = 'Rolling\u2026';
    const rollAnimation = setInterval(() => {
        const rand = () => Math.round(Math.random() * 5) + 1;
        clientImg.src = `/dice_images/dice-${rand()}.png`;
        serverImg.src = `/dice_images/dice-${rand()}.png`;
    }, 100);

    // Generate two random 64-bit integers and hash them with SHA3-256
    const [rand1, rand2] = crypto.getRandomValues(new BigUint64Array(2));
    const clientHash = await hash(rand1.toString(), rand2.toString());

    // Send the hash to the server (commit)
    const base = 'https://backend.localhost/api/game'
    const headers = {
        'Authorization': `Bearer ${sessionStorage.token}`,
        'Content-Type': 'application/json'
    };
    let body = JSON.stringify({ client_hash: clientHash });
    let res = await fetch(`${base}/commit/`, {
        method: 'POST', headers: headers, body: body
    });
    // FIXME: can't read the response body for some reason
    if (res.status === 401) {
        clearInterval(rollAnimation);
        showErrors({ details: 'Unauthorized. Please login or register.' });
        delete sessionStorage.token;
        return;
    }
    let data = await res.json();

    // Display an error if it failed
    if (!res.ok) {
        clearInterval(rollAnimation);
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
    res = await fetch(`${base}/reveal/`, {
        method: 'POST', headers: headers, body: body
    });
    data = await res.json();
    // Display an error if it failed
    if (!res.ok) {
        clearInterval(rollAnimation);
        showErrors(data);
        return;
    }
    const { client: clientInt, server: serverInt } = data.server_integers;

    // Verify the server's hash
    const checkHash = await hash(clientInt, serverInt);
    if (checkHash != serverHash) {
        clearInterval(rollAnimation);
        showErrors({ details: 'The hashes don\'t match!' });
        console.error(`Computed hash: ${checkHash}`);
        return;
    }

    // Compute the dice rolles
    const clientRoll = compute(rand1, clientInt);
    const serverRoll = compute(rand2, serverInt);

    setTimeout(() => {
        rollButton.setAttribute('aria-busy', false);
        clearInterval(rollAnimation);

        // Display the result
        clientImg.previousElementSibling.classList.remove('hide');
        serverImg.previousElementSibling.classList.remove('hide');
        clientImg.src = `/dice_images/dice-${clientRoll}.png`;
        serverImg.src = `/dice_images/dice-${serverRoll}.png`;
        const u = document.createElement('u');
        switch (cmp(clientRoll, serverRoll)) {
            case -1:
                u.textContent = 'lost';
                rollResult.replaceChildren('You ', u, '!');
                break;
            case 1:
                u.textContent = 'won';
                rollResult.replaceChildren('You ', u, '!');
                break;
            case 0:
                u.textContent = 'tie';
                rollResult.replaceChildren('It\'s a ', u, '!');
                break;
        }

        // Display the details
        clientChosenR.textContent = rand1;
        clientReceivedR.textContent = clientInt;
        serverChosenR.textContent = serverInt;
        serverReceivedR.textContent = rand2;
        clientSentHr.textContent = clientHash;
        serverSentHr.textContent = serverHash;
        clientResult.textContent = String.fromCharCode(0x267F + clientRoll);
        serverResult.textContent = String.fromCharCode(0x267F + serverRoll);
    }, 500);
});
