import { display } from './modal.js';

const form = document.forms.login;

form.addEventListener('input', (evt) => {
    // Reset validity on input
    evt.target.setCustomValidity('');
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

    // Save token & redirect to game if OK
    if (res.ok) {
        sessionStorage.setItem('token', data.access);
        location.href = '/index.html';
    }

    if ('detail' in data) {
        // Display the error in a modal
        display(data.detail);
    } else {
        // Show the error(s) in the form
        for (key in data) {
            form.elements[key].setCustomValidity(data[key]);
            if (key == 'password')
                repeat_password.setCustomValidity(data[key]);
        }
        form.reportValidity();
    }
});
