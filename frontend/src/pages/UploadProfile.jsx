import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UploadProfile() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const upload = async (e) => {
    if (!e.target.files[0]) return;
    const formData = new FormData();
    formData.append("image", e.target.files[0]);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, formData, {
        withCredentials: true
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload the image.");
    }
  };

  return (
    <div className="bg-zinc-900 min-h-screen text-white p-10">
      <h3 className="text-3xl mb-5">Upload Profile Picture</h3>
      <input className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
         file:bg-blue-600 file:text-white file:cursor-pointer
         text-sm text-zinc-300 cursor-pointer" type="file" accept="image/*" onChange={upload} />
      {error && <p role="alert" className="text-red-400 mt-3">{error}</p>}
    </div>
  );
}
