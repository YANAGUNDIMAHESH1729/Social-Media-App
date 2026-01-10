import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function EditPost() {
  const { id } = useParams();
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const update = async () => {
    await axios.put(`${import.meta.env.VITE_API_URL}/api/update/${id}`,
      { content },
      { withCredentials: true }
    );
    navigate("/dashboard");
  };

  return (
    <div className="bg-zinc-900 min-h-screen text-white p-10">
      <h5>Edit your Post</h5>
      <textarea
        className="border-2 border-zinc-700 bg-transparent p-3 w-1/3"
        onChange={e => setContent(e.target.value)}
      />
      <button
        onClick={update}
        className="bg-yellow-500 text-black px-3 py-2 mt-2 rounded-md"
      >
        Update Post
      </button>
    </div>
  );
}