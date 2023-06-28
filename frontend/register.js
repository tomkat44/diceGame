import { display } from './modal.js';

const form = document.forms.register;

const errTooShort = 'The password is too short!';
const errMismatch = 'The passwords do not match!';

form.elements.password.addEventListener('keyup', (evt) => {
    const bar = document.getElementById('progress');
    const pwd = evt.target.value;
    // Reset if password length is zero
    if (pwd.length === 0) {
        bar.value = 0;
        bar.classList = '';
        delete bar.parentElement.dataset.tooltip;
        return;
    }

    // Length must be at least 8 chars
    if (pwd.length < 8) {
        bar.value = 20; // pwd.length;
        bar.classList = 'very-weak';
        bar.parentElement.dataset.tooltip = errTooShort;
        return;
    }

    // Check progress
    const prog = [/[$@$!%*#?&]/, /[A-Z]/, /[0-9]/, /[a-z]/]
        .reduce((memo, group) => memo + group.test(pwd) * 20, 20);
    const strength = {
        20: 'very weak',
        40: 'weak',
        60: 'moderate',
        80: 'strong',
        100: 'very strong'
    };

    bar.value = prog;
    bar.classList = strength[prog].replace(' ', '-');
    bar.parentElement.dataset.tooltip = 'Password strength: ' + strength[prog];
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
        if (res.ok) location.href = '/login.html';

        // Report errors if not OK
        const err = await res.json();
        if ('detail' in err) {
            display(err.detail);
        } else {
            for (key in err) {
                form.elements[key].setCustomValidity(err[key]);
                if (key == 'password')
                    repeat_password.setCustomValidity(err[key]);
            }
            form.reportValidity();
        }
    }
});
