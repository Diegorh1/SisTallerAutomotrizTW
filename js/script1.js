// Función para mostrar el formulario de inicio de sesión y ocultar el de registro
function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden'); // Muestra el formulario de login
    document.getElementById('registrationForm').classList.add('hidden'); // Oculta el formulario de registro
}

// Función para mostrar el formulario de registro y ocultar el de inicio de sesión
function showRegistrationForm() {
    document.getElementById('loginForm').classList.add('hidden'); // Oculta el formulario de login
    document.getElementById('registrationForm').classList.remove('hidden'); // Muestra el formulario de registro
}

// Función para validar el inicio de sesión
function validateLogin(event) {
    event.preventDefault(); // Evita el envío del formulario

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const emailError = document.getElementById('loginEmailError'); // Asegurar que tenga un ID único en el HTML
    const passwordError = document.getElementById('loginPasswordError');

    let isValid = true;

    if (!email || !email.includes('@')) {
        emailError.classList.remove('hidden');
        isValid = false;
    } else {
        emailError.classList.add('hidden');
    }

    if (!password) {
        passwordError.classList.remove('hidden');
        isValid = false;
    } else {
        passwordError.classList.add('hidden');
    }

    if (isValid) {
        alert('Login successful!');
    }
}

// Evento que se ejecuta cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", function () {
    // Botones para cambiar entre formularios
    const loginButton = document.getElementById("loginButton");
    const registerSubmit = document.getElementById("registerSubmit");

    loginButton.addEventListener("click", validateLogin);
    registerSubmit.addEventListener("click", validateRegistration);
});

// Función para validar el formulario de registro
function validateRegistration(event) {
    event.preventDefault(); // Evita el envío si hay errores
    let isValid = true;

    const fullName = document.getElementById("fullName");
    const phoneNumber = document.getElementById("phoneNumber");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const nameError = document.getElementById("nameError");
    const phoneError = document.getElementById("phoneError");
    const emailError = document.getElementById("registerEmailError"); // Cambiar ID en el HTML
    const passwordError = document.getElementById("registerPasswordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");

    if (fullName.value.trim() === "") {
        nameError.classList.remove("hidden");
        isValid = false;
    } else {
        nameError.classList.add("hidden");
    }

    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phoneNumber.value)) {
        phoneError.classList.remove("hidden");
        isValid = false;
    } else {
        phoneError.classList.add("hidden");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        emailError.classList.remove("hidden");
        isValid = false;
    } else {
        emailError.classList.add("hidden");
    }

    if (password.value.length < 6) {
        passwordError.classList.remove("hidden");
        isValid = false;
    } else {
        passwordError.classList.add("hidden");
    }

    if (password.value !== confirmPassword.value) {
        confirmPasswordError.classList.remove("hidden");
        isValid = false;
    } else {
        confirmPasswordError.classList.add("hidden");
    }

    if (isValid) {
        alert("Registration successful! Please check your email to verify your account.");
    }
}
