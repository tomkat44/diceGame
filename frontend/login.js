import { display } from './modal.js';

const form = document.forms.login;

form.lastElementChild.disabled =
    document.querySelectorAll('input:-webkit-autofill').length < 2;

form.addEventListener('input', (evt) => {
    // Reset validity on input
    evt.target.setCustomValidity('');
    const inputs = Array.from(form.elements);
    const button = inputs.pop();
    button.disabled = inputs.some(e => !e.validity.valid);
});

form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    // Submit AJAX request
    const body = new URLSearchParams(new FormData(form));
    const res = await fetch(form.action, {
        method: 'POST',
        body: body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    const data = await res.json();

    if (res.ok) {
        // Save the token to the session storage
        // NOTE: the session storage gets cleared on exit
        sessionStorage.setItem('token', data.access);
        // Manually clear the token when it expires
        setTimeout(() => sessionStorage.removeItem('token'), 3.6e6);
        // Redirect to the game
        location.href = 'index.html';
    }

    if ('detail' in data) {
        // Display the error in a modal
        display(data.detail);
    } else {
        // Show the error(s) in the form
        for (const key in data) {
            if (key in form.elements)
                form.elements[key].setCustomValidity(error);
            if (key == 'password')
                repeat_password.setCustomValidity(error);
        }
        form.reportValidity();
    }
});
