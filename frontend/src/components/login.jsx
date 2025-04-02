import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
    
        try {
            const res = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
    
            const text = await res.text();
            console.log("Respuesta del servidor:", text);
    
            if (!res.ok) throw new Error(text || "Error desconocido en el servidor");
    
            const data = JSON.parse(text);
            localStorage.setItem("token", data.token);
            navigate("/");
        } catch (error) {
            console.error("Error en login:", error.message);
            alert("Credenciales incorrectas");
        }
    };
    

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="bg-white p-6 rounded shadow-md w-80">
                <h2 className="text-2xl font-bold mb-4">Login</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                    />
                    <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded mb-3">
                        Login
                    </button>
                    <Link to="/signup" className="text-blue-900">Don't you have an account? <span className="underline">Register</span></Link> 
                </form>
            </div>
        </div>
    );
}

export { Login };
