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

// Função de inicialização do Firebase
function initializeFirebase() {
    // Configuração do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAwVI2G9I_2ThVcHPCFiqVQfYNYZvfPgvg",
        authDomain: "rotadosleiloes.firebaseapp.com",
        projectId: "rotadosleiloes",
        storageBucket: "rotadosleiloes.firebasestorage.app",
        messagingSenderId: "1022316924185",
        appId: "1:1022316924185:web:72194a4fe18508c104c988",
        measurementId: "G-D5NQPEWTZQ"
    };

    // Inicializa o Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    // Verifica se o usuário está autenticado
    auth.onAuthStateChanged(user => {
        if (!user) {
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = '../login.html'; // Redireciona para a página de login
        }
    });

    // Função para logout
    function logout() {
        auth.signOut().then(() => {
            alert('Você saiu com sucesso.');
            window.location.href = '../login.html'; // Redireciona para a página de login
        });
    }

    // Disponibiliza a função logout globalmente
    window.logout = logout;
}
