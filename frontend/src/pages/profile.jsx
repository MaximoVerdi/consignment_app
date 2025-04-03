import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const Profile = () => {
  const [countries, setCountries] = useState([]);
  const [profileData, setProfileData] = useState({
    user: {
      username: "",
      email: "",
      phone: "",
      first_name: "",
      last_name: "", 
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      role: "Consignador",
      storeCredit: "0.00",
      consignorCredit: "0.00",
      rewardsCredit: "0.00"
    },
    editable: {
      email: "",
      phone: "",
      password: "",
      first_name: "",
      last_name: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: ""
    }
  });
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const getAuthData = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    try {
      const decoded = jwtDecode(token);
      return {
        userId: decoded.user_id,
        tenantId: decoded.tenant_id || 'default'
      };
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      setIsLoading(true);
      const authData = getAuthData();
      if (!authData) {
        console.error("No se encontraron datos de autenticación");
        return;
      }
  
      const response = await axios.get(
        `http://localhost:5000/api/profile/${authData.userId}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'x-tenant-id': authData.tenantId || 'default'
          }
        }
      );

      console.log("Respuesta del servidor:", response.data);
  
      if (!response.data) {
        throw new Error("Datos de usuario no recibidos");
      }

      const userData = response.data.data || response.data;
      const mappedData = {
        username: userData.username || "",
        email: userData.email || "",
        phone: userData.phone || "",
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        address: userData.address || "",
        city: userData.city || "",
        state: userData.state || "",
        postal_code: userData.postal_code || "", 
        country: userData.country || "",
        role: userData.role || "Consignador",
        storeCredit: userData.store_credit || "0.00",
        consignorCredit: userData.consignor_credit || "0.00",
        rewardsCredit: userData.rewards_credit || "0.00"
      };
  
      setProfileData({
        user: mappedData,
        editable: {
          email: mappedData.email,
          phone: mappedData.phone,
          password: "",
          first_name: mappedData.first_name,
          last_name: mappedData.last_name,
          address: mappedData.address,
          city: mappedData.city,
          state: mappedData.state,
          postal_code: mappedData.postal_code,
          country: mappedData.country
        }
      });
  
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 401) {
        alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    const authData = getAuthData();
    if (!authData) {
      alert("No estás autenticado");
      return;
    }
  
    setIsUpdating(true);

    try {
      const updateData = {
        user_id: authData.userId,
        email: profileData.editable.email,
        phone: profileData.editable.phone,
        ...(profileData.editable.password && { password: profileData.editable.password }),
        first_name: profileData.editable.first_name, 
        last_name: profileData.editable.last_name, 
        address: profileData.editable.address,
        city: profileData.editable.city,
        state: profileData.editable.state,
        postal_code: profileData.editable.postal_code,
        country: profileData.editable.country
      };
  
      const response = await axios.put(
        "http://localhost:5000/api/update-user",
        updateData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'x-tenant-id': authData.tenantId
          }
        }
      );
  
      if (response.data.success) {
        alert("Perfil actualizado correctamente");
        await fetchUserData(); // Refrescar los datos
      } else {
        throw new Error(response.data.message || "Error al actualizar");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert(error.response?.data?.message || "Error al actualizar");
    } finally {
      setIsUpdating(false);
    }
  };

  const sanitizeInput = (name, value) => {
    switch (name) {
      case "email":
        if (value === "") {
            return value;
        }
        const emailCharRegex = /^[a-zA-Z0-9._%+\-@]*$/;
        if (!emailCharRegex.test(value)) {
          return profileData.editable.email;
      }
      return value;
        
      case "phone":
        return /^[0-9+()\s-]*$/.test(value) ? value : profileData.editable.phone;
        
      case "first_name":
      case "last_name":
        return /^[a-zA-ZÀ-ÿ'\-\s]*$/.test(value) ? value : profileData.editable[name];
        
      case "postal_code":
        return /^[a-zA-Z0-9\s-]*$/.test(value) ? value : profileData.editable.postal_code;
        
      case "address":
        return /^[a-zA-Z0-9À-ÿ\s\-\#\,\.]*$/.test(value) ? value : profileData.editable.address;
        
      case "city":
      case "state":
        return /^[a-zA-ZÀ-ÿ\s-]*$/.test(value) ? value : profileData.editable[name];
        
      default:
        return value;
    }
  };

  const isValidEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const handleEmailChange = (e) => {
    const { value } = e.target;
    setNewData(prev => ({ ...prev, email: value }));
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
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(name, value);
    setProfileData(prev => ({
      ...prev,
      editable: {
        ...prev.editable,
        [name]: sanitizedValue
      }
    }));
  };

  useEffect(() => {
    fetchUserData();
    
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

  if (isLoading) {
    return <div className="p-4 text-center">Cargando perfil...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="bg-[#bbccdb] px-4 py-2 rounded-t-md">
        <h2 className="text-xs font-bold text-[#182a39ee]">Summary</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6 bg-gray-50 rounded-b-md">
        <div className="flex flex-col gap-1">
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">First Name</label>
          <input
            type="text"
            name="first_name"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={profileData.editable.first_name}
            onChange={handleChange}
            disabled={profileData.user.role?.toLowerCase() === 'consignor'}
          />

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Email</label>
          <input
            type="email"
            name="email"
            className={`w-full lg:w-60 p-[7px] border rounded-md mb-1 text-xs ${
              emailError ? "border-red-500" : ""
            }`}
            value={profileData.editable.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
          />
          {emailError && <p className="text-red-500 text-xs">{emailError}</p>}

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Username</label>
          <p className="mb-3 text-xs">{profileData.user.username || "N/A"}</p>

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Role</label>
          <p className="mb-3 text-xs">{profileData.user.role}</p>

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Store Credit</label>
          <p className="text-xs">{profileData.user.storeCredit}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Last name</label>
          <input
            type="text"
            name="last_name"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={profileData.editable.last_name}
            onChange={handleChange}
          />

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Phone</label>
          <input
            type="text"
            name="phone"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={profileData.editable.phone}
            onChange={handleChange}
          />

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Password</label>
          <input
            type="password"
            name="password"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={profileData.editable.password}
            onChange={handleChange}
          />

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Consignor Credit</label>
          <p className="mb-3 text-xs">{profileData.user.consignorCredit}</p>

          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Rewards Credit</label>
          <p className="text-xs">{profileData.user.rewardsCredit}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Address</label>
          <input
            type="text"
            name="address"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={profileData.editable.address}
            onChange={handleChange}
          />
            
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">City</label>
          <input
            type="text"
            name="city"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={profileData.editable.city}
            onChange={handleChange}
          />
            
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">State</label>
          <input
            type="text"
            name="state"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={profileData.editable.state}
            onChange={handleChange}
          />
            
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Post Code</label>
          <input
            type="text"
            name="postal_code"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={profileData.editable.postal_code}
            onChange={handleChange}
          />
            
          <label className="block text-xs font-bold text-[#182a39ee] mb-1">Country</label>
          <select
            name="country"
            className="w-full lg:w-60 p-[7px] border rounded-md mb-3 text-xs"
            value={profileData.editable.country}
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
        <button 
          className="bg-[#6eb163] text-white px-4 py-2 rounded hover:bg-[#4e8745] disabled:opacity-50"
          onClick={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <span className="inline-block animate-spin mr-2">↻</span>
              Updating...
            </>
          ) : "Update"}
        </button>
      </div>
    </div>
  );
};

export { Profile };