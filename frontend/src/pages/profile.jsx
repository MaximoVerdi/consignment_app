import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const Profile = () => {
  const [countries, setCountries] = useState([]);
  const [user, setUser] = useState({
    username: "",
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
    split: "",
    storeCredit: "",
    consignorCredit: "",
    rewardsCredit: "",
  });

  const [newData, setNewData] = useState({
    email: "",
    phone: "",
    password: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
  });

  const [emailError, setEmailError] = useState("");

  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.user_id;
    } catch (error) {
      console.error("Error decodificando el token:", error);
      return null;
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = getUserIdFromToken();
      if (!token || !userId) return;
  
      const response = await axios.get(`http://localhost:5000/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Datos del perfil recibidos:", response.data);
  
      const userData = response.data.data;
      setUser({
        username: userData.username || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        firstName: response.data.first_name || "",
        lastName: response.data.last_name || "",
        password: "",
        address: response.data.address || "",
        city: response.data.city || "",
        state: response.data.state || "",
        postcode: response.data.postal_code || "",
        country: response.data.country || "",
      });

      setNewData({
        email: userData.email || "",
        phone: userData.phone || "",
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
        password: "",
        address: userData.address || "",
        city: userData.city || "",
        state: userData.state || "",
        postcode: userData.postal_code || "",
        country: userData.country || "",
        split: userData.role || "Consignador",
      })
    } catch (error) {
      console.error("Error obteniendo datos:", {
        error: error.response?.data || error.message,
        status: error.response?.status
      });
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const isValidEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const handleEmailChange = (e) => {
    const { value } = e.target;
    setNewData(prev => ({ ...prev, email: value }));
    // Limpia el error mientras escribe
    if (emailError && value === "") setEmailError("");
  };

  const handleEmailBlur = (e) => {
    const { value } = e.target;
    if (value && !isValidEmail(value)) {
      setEmailError("Por favor ingresa un correo electrónico válido");
    } else {
      setEmailError("");
    }
  };

  const handleUpdate = async () => {
    if (newData.email && !isValidEmail(newData.email)) {
      setEmailError("Correo no válido");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const userId = getUserIdFromToken();
      
      if (!token || !userId) {
        alert("❌ No estás autenticado.");
        return;
      }
  
      const updatePayload = {
        user_id: userId,
        email: newData.email,
        phone: newData.phone,
        password: newData.password,
        firstName: newData.firstName,
        lastName: newData.lastName,
        address: newData.address,
        city: newData.city,
        state: newData.state,
        postcode: newData.postcode,
        country: newData.country
      };
  
      console.log("Enviando datos a la API:", updatePayload);
      
      const response = await fetch("http://localhost:5000/api/update-user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });
  
      const result = await response.json();
      console.log("Respuesta del servidor:", result);
      
      if (response.ok) {
        alert(result.message || "✅ Datos actualizados correctamente");
        fetchUserData();
      } else {
        throw new Error(result.message || "Error al actualizar");
      }
    } catch (error) {
      console.error("Error en la actualización:", error);
      alert(error.message || "Hubo un problema al actualizar los datos");
    }
  };
  
  const sanitizeInput = (name, value) => {
    switch (name) {
      case "email":
        return value;
  
      case "phone":
        return /^\d{0,15}$/.test(value) ? value : newData.phone;
  
      case "firstName":
      case "lastName":
        return /^[a-zA-ZÀ-ÿ\s]*$/.test(value) ? value : newData[name];
  
      case "address":
      case "city":
      case "state":
        return value; // Prueba sin sanitización primero
  
      case "postcode":
        return /^[a-zA-Z0-9\s-]*$/.test(value) ? value : newData.postcode;
  
      case "password":
        return value;
  
      default:
        return value.replace(/[^a-zA-Z0-9@._\- ]/g, ""); 
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(name, value);
    setNewData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get("https://restcountries.com/v3.1/all");
        const countryList = response.data.map((country) => country.name.common).sort();
        setCountries(countryList);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
  
    fetchCountries();
  }, []);

  

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="bg-[#bbccdb] px-4 py-2 rounded-t-md">
        <h2 className="text-xs font-bold text-[#182a39ee]">Summary</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6 bg-gray-50 rounded-b-md">
      <div>
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">First name</label>
          <input
            type="text"
            name="firstName"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={newData.firstName}
            onChange={handleChange}
          />

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Email</label>
          <input
            type="email"
            name="email"
            className={`w-full lg:w-60 p-[7px] border rounded-md mb-1 text-xs ${
              emailError ? "border-red-500" : ""
            }`}
            value={newData.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
          />

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">User name</label>
          <p className="mb-3 text-xs">{user.username || "N/A"}</p>

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Split</label>
          <p className="mb-3 text-xs">{user.role || "Consignacion"}</p>

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Store Credit</label>
          <p className="text-xs">{user.storeCredit || "0.00"}</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Last name</label>
          <input
            type="text"
            name="lastName"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={newData.lastName}
            onChange={handleChange}
          />

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Phone</label>
          <input
            type="text"
            name="phone"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={newData.phone}
            onChange={handleChange}
          />

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Password</label>
          <input
            type="password"
            name="password"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={newData.password}
            onChange={handleChange}
          />

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Consignor Credit</label>
          <p className="mb-3 text-xs">{user.consignorCredit || "0.00"}</p>

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Rewards Credit</label>
          <p className="text-xs">{user.rewardsCredit || "0.00"}</p>
        </div>

        <div>
        <label className="block text-xs font-bold text-[#182a39ee] mb-1">Address</label>
          <input
            type="text"
            name="address"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={newData.address}
            onChange={handleChange}
          />
            
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">City</label>
          <input
            type="text"
            name="city"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={newData.city}
            onChange={handleChange}
          />
            
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">State</label>
          <input
            type="text"
            name="state"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={newData.state}
            onChange={handleChange}
          />
            
            <label className="block text-xs font-bold text-[#182a39ee] mb-1">Postcode</label>
            <input
              type="text"
              name="postcode"
              className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
              value={newData.postcode}
              onChange={handleChange}
            />
            
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Country</label>
          <select
            name="country"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={newData.country}
            onChange={handleChange}
          >
            <option value="">Select a country</option>
            {countries.map((country, index) => (
            <option key={index} value={country}>{country}</option>
            ))}
          </select>
        </div>
        
      </div>

      <div className="p-4 flex justify-end bg-gray-50">
        <button className="bg-[#6eb163] text-white px-4 py-2 rounded hover:bg-[#4e8745]" onClick={handleUpdate}>
          Update
        </button>
      </div>
    </div>
  );
};

export { Profile };
