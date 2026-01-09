import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Get backend URL from frontend environment variable
  const API = import.meta.env.VITE_API_URL;

  const submit = async (e) => {
    e.preventDefault();

    await axios.post(
      `${API}/api/login`,
      { email, password },
      { withCredentials: true }  // important for cookie
    );

    navigate("/dashboard");
  };

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white p-10">
      <h3 className="text-3xl mb-5">Login</h3>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="px-3 py-2 bg-transparent border-2 border-zinc-700 rounded-md outline-none"
          placeholder="email"
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="px-3 py-2 bg-transparent border-2 border-zinc-700 rounded-md outline-none"
          placeholder="password"
          onChange={e => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 px-5 py-2 rounded-md cursor-pointer">Login</button>
      </form>
    </div>
  );
}
