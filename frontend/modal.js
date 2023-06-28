/**
 * The modal element.
 * @type {HTMLDialogElement}
 */
const modal = document.querySelector('dialog');

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
 * @param {string} body the text content of the modal
 */
export function display(body) {
    modal.querySelector('.body').textContent = body;
    modal.showModal();
    toggleClass();
}

export default modal;
