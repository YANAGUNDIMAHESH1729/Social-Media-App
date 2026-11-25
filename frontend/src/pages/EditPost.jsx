import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function EditPost() {
  const { id } = useParams();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, { withCredentials: true })
      .then(({ data }) => {
        const post = data.posts.find(item => item._id === id);
        if (post) setContent(post.content);
        else navigate("/dashboard");
      })
      .catch(() => navigate("/login"));
  }, [id, navigate]);

  const update = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/update/${id}`,
        { content }, { withCredentials: true });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update your post.");
    }
  };

  return (
    <div className="bg-zinc-900 min-h-screen text-white p-10">
      <h5>Edit your Post</h5>
      <form onSubmit={update}>
      <textarea
        className="border-2 border-zinc-700 bg-transparent p-3 w-1/3"
        value={content}
        required
        onChange={e => setContent(e.target.value)}
      />
      {error && <p role="alert" className="text-red-400">{error}</p>}
      <button
        type="submit"
        className="bg-yellow-500 text-black px-3 py-2 mt-2 rounded-md"
      >
        Update Post
      </button>
      </form>
    </div>
  );
}
