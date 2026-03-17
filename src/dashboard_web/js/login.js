import { API } from "./config.js";

document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = document.getElementById("usuario").value.trim();
    const contrasena = document.getElementById("password").value.trim();

    if (!correo || !contrasena) {
        alert("Por favor completa los campos");
        return;
    }

    try {
        const res = await fetch(`${API}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ correo, contrasena }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Error al iniciar sesión");
            return;
        }

        // Guardamos el token
        const token = data.token;
        localStorage.setItem("token", token);

        // Guardamos también el usuario completo 👈
        localStorage.setItem("user", JSON.stringify(data.user));

        // Decodificar payload del JWT (opcional si ya guardas user)
        const payloadBase64 = token.split(".")[1];
        const decoded = JSON.parse(atob(payloadBase64));

        console.log("Payload del token:", decoded);

        // Redirigir según rol
        switch (decoded.role) {
            case "admin":
                window.location.href = "admin/dashboard.html";
                break;

            case "psicologo":
                window.location.href = "psicologo/panel-psicologo.html";
                break;
        }

    } catch (error) {
        console.error("Error en login:", error);
        alert("Error en el servidor");
    }
});

