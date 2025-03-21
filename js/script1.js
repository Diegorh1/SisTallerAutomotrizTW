// Función para mostrar el formulario de inicio de sesión y ocultar el de registro
function showLoginForm() {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("registrationForm").classList.add("hidden");
}

// Función para mostrar el formulario de registro y ocultar el de inicio de sesión
function showRegistrationForm() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("registrationForm").classList.remove("hidden");
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
    event.preventDefault(); // Evita que la página se recargue

    const fullName = document.getElementById("fullName");
    const phoneNumber = document.getElementById("phoneNumber");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const nameError = document.getElementById("nameError");
    const phoneError = document.getElementById("phoneError");
    const emailError = document.getElementById("emailError");
    const registerPasswordError = document.getElementById("registerPasswordError"); // Fix en el ID
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    const successMessage = document.getElementById("successMessage");

    let isValid = true;

    // Validar nombre
    if (fullName.value.trim() === "") {
        nameError.classList.remove("hidden");
        isValid = false;
    } else {
        nameError.classList.add("hidden");
    }

    // Validar teléfono
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phoneNumber.value)) {
        phoneError.classList.remove("hidden");
        isValid = false;
    } else {
        phoneError.classList.add("hidden");
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        registerEmailError.classList.remove("hidden");
        isValid = false;
    } else {
        registerEmailError.classList.add("hidden");
    }

    // Validar contraseña
    if (password.value.length < 6) {
        registerPasswordError.classList.remove("hidden");
        isValid = false;
    } else {
        registerPasswordError.classList.add("hidden");
    }

    // Validar confirmación de contraseña
    if (password.value !== confirmPassword.value) {
        confirmPasswordError.classList.remove("hidden");
        isValid = false;
    } else {
        confirmPasswordError.classList.add("hidden");
    }

    // Si todo es válido, mostrar mensaje de éxito
    if (isValid) {
        successMessage.classList.remove("hidden");
        successMessage.textContent = "✅ Registro exitoso. Revisa tu correo para verificar tu cuenta.";

        // Limpiar el formulario después de 3 segundos
        setTimeout(() => {
            fullName.value = "";
            phoneNumber.value = "";
            email.value = "";
            password.value = "";
            confirmPassword.value = "";
            successMessage.classList.add("hidden");
        }, 3000);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const successMessage = document.getElementById("successMessage");

    if (!successMessage) {
        console.error("❌ Error: No se encontró el elemento con ID 'successMessage'");
    } else {
        console.log("✅ Elemento encontrado correctamente:", successMessage);
    }
});




