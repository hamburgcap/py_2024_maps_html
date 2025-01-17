// Função para carregar scripts dinamicamente
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = function () {
        console.error(`Erro ao carregar o script: ${src}`);
    };
    document.head.appendChild(script);
}

// URLs dos scripts do Firebase
const firebaseAppURL = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
const firebaseAuthURL = "https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js";

// Carrega os scripts do Firebase dinamicamente
loadScript(firebaseAppURL, () => {
    loadScript(firebaseAuthURL, initializeFirebase);
});
