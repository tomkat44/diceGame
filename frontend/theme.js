window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (evt) => {
    document.documentElement.dataset.theme = evt.matches ? 'light' : 'dark';
}, {passive: true});

document.getElementById('switch-theme').addEventListener('click', () => {
    const dataset = document.documentElement.dataset;
    dataset.theme = dataset.theme == 'dark' ? 'light' : 'dark';
}, {passive: true});
