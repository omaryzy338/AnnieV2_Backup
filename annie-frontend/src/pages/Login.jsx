import React, { useState } from "react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/auth/login", form);
      const { token } = res.data;
      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="container" style={{ padding: "40px 0" }}>
      <h2>Iniciar sesión</h2>
      {error && <p className="text-danger">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-success">
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;
