import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    age: ""
  });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, form, {
        withCredentials: true
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create your account.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white p-10">
      <h3 className="text-3xl mb-5">Create Account</h3>
      <form onSubmit={submit} className="space-y-3">
        {Object.keys(form).map(key => (
          <input
            key={key}
            placeholder={key}
            type={key === "password" ? "password" : key === "email" ? "email" : key === "age" ? "number" : "text"}
            required
            min={key === "age" ? 1 : undefined}
            value={form[key]}
            className="px-3 py-2 bg-transparent border-2 border-zinc-700 rounded-md block outline-none"
            onChange={e => setForm({ ...form, [key]: e.target.value })}
          />
        ))}
        <button className="bg-blue-500 px-5 py-2 rounded-md cursor-pointer">
          Create Account
        </button>
        {error && <p role="alert" className="text-red-400">{error}</p>}
      </form>
    </div>
  );
}
