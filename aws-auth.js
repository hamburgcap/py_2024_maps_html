// Configuração do Cognito
const poolData = {
    UserPoolId: "sa-east-1_tW0Zi7DqZ", // Substitua pelo seu User Pool ID
    ClientId: "2r49otmmrc51fli3lk2r8s4n18" // Substitua pelo seu App Client ID
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
// Definir antes de qualquer uso
let isLogin = true;

// Função para alternar entre Login e Cadastro
// Função para alternar entre Login e Cadastro
function toggleForm() {
    isLogin = !isLogin; // Toggle between Login and Cadastro
    console.log("toggleForm() executed, isLogin:", isLogin);

    document.getElementById('form-title').innerText = isLogin ? 'Rota do Arremate - Login' : 'Rota do Arremate - Cadastro';
    document.getElementById('form-button').innerText = isLogin ? 'Entrar' : 'Cadastrar gratuitamente';
    document.getElementById('toggle-message').innerHTML = isLogin
        ? 'Não tem uma conta? <a href="#" onclick="toggleForm()">Cadastrar</a>'
        : 'Já tem uma conta? <a href="#" onclick="toggleForm()">Entrar</a>';

    let extraFields = document.getElementById('extraFields');
    if (!extraFields) {
        console.error("❌ ERROR: 'extraFields' not found in DOM!");
        return;
    }

    // ✅ Toggle the display state of extra fields
    extraFields.style.display = isLogin ? "none" : "block";

    console.log("extraFields display set to:", extraFields.style.display);
}


// Função para lidar com o formulário de Login ou Cadastro
function handleForm() {
    if (isLogin) {
        login();
    } else {
        register();
    }
}

function loginUser(email, password) {
    console.log("🔐 Attempting login with email:", email);

    const authenticationData = {
        Username: email,
        Password: password,
    };

    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    const userData = {
        Username: email,
        Pool: userPool,
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log("✅ Login successful!");

            // Store authentication tokens in sessionStorage
            sessionStorage.setItem("idToken", result.getIdToken().getJwtToken());
            sessionStorage.setItem("accessToken", result.getAccessToken().getJwtToken());

            console.log("🔍 Session retrieved. Fetching user group...");

            // Fetch user group
            fetchUserGroup();
        },

        onFailure: function (err) {
            console.error("❌ Login failed:", err.message);
            alert("Erro ao entrar: " + err.message);
        }
    });
}


// Função de login
function login() {
  var authenticationData = {
      Username: document.getElementById("email").value,
      Password: document.getElementById("password").value
  };

  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

  var userData = {
      Username: authenticationData.Username,
      Pool: userPool
  };

  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
          console.log("✅ Login successful!");
          sessionStorage.setItem("idToken", result.getIdToken().getJwtToken());
          sessionStorage.setItem("accessToken", result.getAccessToken().getJwtToken());

          setTimeout(fetchUserGroup, 2000);  // Fetch group 2 seconds after login
      },

      onFailure: function (err) {
          console.error("❌ Login failed:", err);
          alert("Login failed: " + err.message);
      }
  });
}


function confirmAccount() {
    const email = document.getElementById('email').value;
    const confirmationCode = document.getElementById('confirmationCode').value;

    if (!email || !confirmationCode) {
        alert("Please enter your email and confirmation code.");
        return;
    }

    const userData = { Username: email, Pool: userPool };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.confirmRegistration(confirmationCode, true, function (err, result) {
        if (err) {
            alert("Error confirming account: " + err.message);
            return;
        }
        alert("Account confirmed successfully! You can now log in.");
        document.getElementById('confirmationSection').style.display = "none";
    });
}

// Função de cadastro
function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const givenName = document.getElementById('givenName').value;
    const familyName = document.getElementById('familyName').value;

    const preferredUsername = email.split('@')[0]; // Generate username from email

    const attributeList = [
        new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: email }),
        new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "given_name", Value: givenName }),
        new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "family_name", Value: familyName }),
        new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "preferred_username", Value: preferredUsername }) // ✅ Add this
    ];

    userPool.signUp(email, password, attributeList, null, function (err, result) {
        if (err) {
            alert("Error registering: " + err.message);
            return;
        }
        alert("Registration successful! A confirmation code has been sent to your email.");
        document.getElementById('confirmationSection').style.display = "block"; // Show confirmation input
    });
}

function confirmNewPassword() {
    const resetCode = document.getElementById("resetCode").value;
    const newPassword = document.getElementById("newPassword").value;

    if (!resetCode || !newPassword) {
        alert("Por favor, preencha o código e a nova senha.");
        return;
    }

    if (!window.currentCognitoUser) {
        alert("Erro interno: usuário não encontrado. Tente redefinir a senha novamente.");
        return;
    }

    window.currentCognitoUser.confirmPassword(resetCode, newPassword, {
        onSuccess: function () {
            alert("Senha redefinida com sucesso! Agora você pode fazer login.");
            document.getElementById("resetPasswordSection").style.display = "none";
        },
        onFailure: function (err) {
            alert("Erro ao redefinir senha: " + err.message);
        }
    });
}

// Função de redefinição de senha
function resetPassword() {
    const email = document.getElementById('email').value;
    if (!email) {
        alert("Por favor, insira seu e-mail para redefinir a senha.");
        return;
    }
    const userData = { Username: email, Pool: userPool };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.forgotPassword({
        onSuccess: function () {
            alert("Código enviado para o seu e-mail. Digite-o abaixo junto com a nova senha.");
            document.getElementById("resetPasswordSection").style.display = "block"; // Show reset password form
        },
        onFailure: function (err) {
            alert("Erro ao solicitar redefinição de senha: " + err.message);
        }
    });

    // Store the Cognito user globally so we can access it in confirmNewPassword()
    window.currentCognitoUser = cognitoUser;
}

function logout() {
    const currentPath = window.location.pathname;
    const hostname = window.location.hostname;
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.signOut();
    }

    sessionStorage.clear();
    alert("Você saiu com sucesso!");
    if (hostname === "localhost"){
    // ✅ Correct logout redirection
    redirectTo("/login_aws.html");
    }
    else{redirectTo("py_2024_maps_html/login_aws.html")}
}

function checkAuthentication() {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
        console.warn("⚠️ No authenticated user found.");
        sessionStorage.removeItem("loggedInUser");
        sessionStorage.removeItem("userGroup");
        redirectTo("/mapa/index_aws.html");
        return;
    }

    cognitoUser.getSession((err, session) => {
        if (err || !session.isValid()) {
            console.warn("⚠️ Session expired. Trying to renew...");

            cognitoUser.refreshSession(session.getRefreshToken(), (err, newSession) => {
                if (err) {
                    console.error("❌ Session renewal failed:", err);
                    sessionStorage.removeItem("loggedInUser");
                    sessionStorage.removeItem("userGroup");
                    redirectTo("/mapa/index_aws.html");
                } else {
                    console.log("✅ Session renewed!");
                    sessionStorage.setItem("idToken", newSession.getIdToken().getJwtToken());

                    fetchUserGroup();  // ✅ Ensure we fetch the group after renewal

                    setTimeout(() => {
                        console.log("✅ After delay: userGroup =", sessionStorage.getItem("userGroup"));
                    }, 1500);
                }
            });
        } else {
            console.log("✅ Active session for:", cognitoUser.getUsername());
            sessionStorage.setItem("idToken", session.getIdToken().getJwtToken());
            sessionStorage.setItem("loggedInUser", cognitoUser.getUsername());

            fetchUserGroup();  // ✅ Ensure we fetch the group here too

            setTimeout(() => {
                console.log("✅ After delay: userGroup =", sessionStorage.getItem("userGroup"));
            }, 1500);
        }
    });
}

function fetchUserGroup() {
    console.log("Fetching user group...");

    const idToken = sessionStorage.getItem("idToken");
    if (!idToken) {
        console.warn("⚠ No ID Token found. Ensure the user is logged in.");
        return;
    }

    // Decode JWT token
    const tokenPayload = JSON.parse(atob(idToken.split('.')[1]));
    console.log("Decoded Token Payload:", tokenPayload);

    let userGroup = "Basic";  // Default to Basic

    // Ensure Cognito groups exist before overwriting
    if (tokenPayload["cognito:groups"] && tokenPayload["cognito:groups"].length > 0) {
        userGroup = tokenPayload["cognito:groups"][0];  // Use the first group from Cognito
        console.log("✅ User belongs to group:", userGroup);
    } else {
        console.warn("⚠ No user group found. Assigning 'Basic' by default.");
    }

    // ✅ Store correct group
    sessionStorage.setItem("userGroup", userGroup);
    console.log("🔄 Stored user group in session:", sessionStorage.getItem("userGroup"));

    checkRedirection();
}



function storeUserGroup(idToken) {
    try {
        const payload = JSON.parse(atob(idToken.split(".")[1])); // Decode JWT payload
        console.log("Decoded ID Token:", payload);

        if (payload["cognito:groups"]) {
            const userGroup = payload["cognito:groups"][0]; // Assuming one group per user
            sessionStorage.setItem("userGroup", userGroup);
            console.log("User Group Stored:", userGroup);
        } else {
            console.warn("⚠ No user group found in ID Token.");
        }
    } catch (error) {
        console.error("Error parsing ID Token:", error);
    }
}

function handleLoginSuccess(session) {
    const idToken = session.getIdToken().getJwtToken();
    storeUserGroup(idToken);
    console.log("Login successful!");
    redirectTo("/mapa/index_aws.html");
}

function checkRedirection() {
    const userGroup = sessionStorage.getItem("userGroup");
    console.log("🔄 Checking redirection based on user group:", userGroup);

    const currentPath = window.location.pathname;

    setTimeout(() => {
        if (userGroup === "Basic") {
            console.log("🔄 Redirecting Basic user to dashboard...");
            if (!currentPath.endsWith("/mapa/index_aws.html")) {
                redirectTo("/mapa/index_aws.html");
            } else {
                console.log("✅ Already on /mapa/index_aws.html. No redirection needed.");
            }
        } else if (userGroup === "Premium") {
            console.log("🔄 Redirecting Premium user...");
            if (!currentPath.endsWith("/mapa/index_aws.html")) {
                redirectTo("/mapa/index_aws.html"); // ✅ Redirect to correct premium page
            } else {
                console.log("✅ Already on /mapa/index_aws.html. No redirection needed.");
            }
        } else {
            console.warn("⚠ User Group is missing or undefined. Ensure authentication is correct.");
        }
    }, 500);
}


function getBasePath() {
    const currentPath = window.location.pathname;
    const hostname = window.location.hostname;

    // ✅ If running on localhost, do NOT add /py_2024_maps_html/
    if (hostname === "localhost") {
        return "";
    }

    // ✅ In production, ensure /py_2024_maps_html/ is always included
    if (!currentPath.includes("/py_2024_maps_html/")) {
        return "/py_2024_maps_html";
    }

    return "";
}

function redirectTo(path) {
    let basePath = getBasePath();

    // ✅ Special case: If logging out, remove /mapa/
    if (path.includes("login_aws.html")) {
        basePath = "";
    }

    const fullPath = window.location.origin + basePath + path;
    console.log("🚀 Redirecting to:", fullPath, "| basePath:", basePath, "| target path:", path);
    window.location.href = fullPath;
}

console.log("User group stored in sessionStorage:", sessionStorage.getItem("userGroup"));

document.addEventListener("DOMContentLoaded", function () {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
            if (err || !session.isValid()) {
                console.error("Sessão inválida", err);
                return;
            }
            console.log("Usuário autenticado:", cognitoUser.getUsername());
        });
    }
});
