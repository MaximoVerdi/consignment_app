import { use, useState } from "react";
import { Link } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    setIsSubmitting(true);
    try {

      e.preventDefault();
      setError("");
      setSuccess("");
      
      try {
        const res = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify( {
            username: formData.username,
            password: formData.password,
          }),
        });
        
        const text = await res.text();
        
        if (!res.ok) {
          throw new Error(text || "Error en el registro");
        }
        
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("El servidor no envió una respuesta válida");
        }
        
        setSuccess(data.message || "Usuario registrado con éxito ✅");
      } catch (error) {
        setError("El correo ya pertence a un usuario");
      }
    } catch(error) {
      setError(error.message)
    }
  };

  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 bg-white rounded-lg shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Registrarse</h2>
        {error && <p className="text-red-600 text-xs my-2">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Usuario"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}  // Ahora coincide con el estado
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
            minLength={6}

          />
          <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded mb-8" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrarse"}
          </button>
          <Link to="/login" className="text-blue-900">Have already an account? <span className="underline">Login Here</span></Link> 
        </form>
      </div>
    </div>
  );
};

export { Signup };
