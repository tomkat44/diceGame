import { display } from './modal.js';

const form = document.forms.register;

const errTooShort = 'The password is too short!';
const errMismatch = 'The passwords do not match!';

zxcvbnts.core.zxcvbnOptions.setOptions({ maxLength: 128 });

form.elements.password.addEventListener('keyup', (evt) => {
    const bar = document.getElementById('progress');
    const pwd = evt.target.value;
    // Reset if password length is zero
    if (pwd.length === 0) {
        bar.value = 0;
        bar.classList.value = '';
        delete bar.parentElement.dataset.tooltip;
        return;
    }

    // Length must be at least 8 chars
    if (pwd.length < 8) {
        bar.value = 20; // pwd.length;
        bar.classList.value = 'very-weak';
        bar.parentElement.dataset.tooltip = errTooShort;
        return;
    }

    // Check password strength
    const inputs = Array.from(document.querySelectorAll('.user-input'), e => e.value);
    const score = zxcvbnts.core.zxcvbn(pwd, inputs).score;
    const strength = {
        0: 'very weak',
        1: 'weak',
        2: 'moderate',
        3: 'strong',
        4: 'very strong'
    };
    bar.value = score * 20 + 20;
    bar.classList.value = strength[score].replace(' ', '-');
    bar.parentElement.dataset.tooltip = 'Password strength: ' + strength[score];
});

form.addEventListener('input', (evt) => {
    // Reset validity on input
    evt.target.setCustomValidity('');
    if (evt.target.name == 'password')
        form.elements.repeat_password.setCustomValidity('');
    if (evt.target.name == 'repeat_password')
        form.elements.password.setCustomValidity('');
});

form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    evt.stopPropagation();

    const { password, repeat_password } = form.elements;
    if (password.value.length < 8) {
        // Password is too short
        password.setCustomValidity(errTooShort);
        repeat_password.setCustomValidity(errTooShort);
        form.reportValidity();
    } else if (password.value != repeat_password.value) {
        // Passwords don't match
        password.setCustomValidity(errMismatch);
        repeat_password.setCustomValidity(errMismatch);
        form.reportValidity();
    } else {
        // Submit AJAX request
        const body = new URLSearchParams(new FormData(form));
        const res = await fetch(form.action, {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        // Redirect to login page if OK
        if (res.ok) location.href = 'login.html';

        // Report errors if not OK
        const err = await res.json();
        if ('detail' in err) {
            display(err.detail);
        } else {
            for (const key in err) {
                form.elements[key].setCustomValidity(err[key]);
                if (key == 'password')
                    repeat_password.setCustomValidity(err[key]);
            }
            form.reportValidity();
        }
    }
});
