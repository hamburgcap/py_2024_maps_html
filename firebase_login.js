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

// Inicializa o serviço de autenticação
const auth = firebase.auth();

// Exporta o objeto `auth` para ser usado em outros arquivos
export { auth };
