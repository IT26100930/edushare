// EduShare - dark mode toggle + dynamic watermark layers
(function () {
    var saved = null;
    try { saved = localStorage.getItem('edushare-theme'); } catch (e) { /* ignore */ }
    if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        saved = 'dark';
    }
    document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');
})();

function toggleTheme() {
    var root = document.documentElement;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('edushare-theme', next); } catch (e) { /* ignore */ }
    var btn = document.getElementById('themeBtn');
    if (btn) { btn.textContent = next === 'dark' ? '☀' : '☾'; }
}

document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('themeBtn');
    if (btn) {
        btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀' : '☾';
    }
    // Fill every watermark layer with the logged-in user's watermark text.
    document.querySelectorAll('.watermark-layer').forEach(function (layer) {
        var text = layer.getAttribute('data-wm') || 'EDUSHARE';
        for (var i = 0; i < 90; i++) {
            var s = document.createElement('span');
            s.textContent = text;
            layer.appendChild(s);
        }
    });
});
