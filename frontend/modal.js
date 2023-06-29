/**
 * The modal element.
 * @type {HTMLDialogElement}
 */
const modal = document.getElementById('modal');

/** Toggles the `modal-is-open` class when the modal is opened or closed. */
const toggleClass = () =>
    document.documentElement.classList.toggle('modal-is-open');
modal.addEventListener('open', toggleClass);
modal.addEventListener('close', toggleClass);

// Close modal when the X is clicked
modal.querySelector('.close').addEventListener('click', () => modal.close());

/**
 * Displays a modal with the given body.
 *
 * @param {string | Node[]} body the content of the modal
 */
export function display(body) {
    if (typeof body === 'string') {
        modal.querySelector('.body').append(body);
    } else {
        modal.querySelector('.body').append(...body);
    }
    modal.showModal();
    toggleClass();
}

export default modal;
