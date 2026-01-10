import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect( () => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
      withCredentials: true
    })
    .then(res => setUser(res.data))
    .catch(() => navigate("/login"));
  }, []);

  const createPost = async (e) => {
    e.preventDefault();
    const res=await axios.post(`${import.meta.env.VITE_API_URL}/api/post`,
      { content },
      { withCredentials: true }
    );
     setUser(prev => ({...prev, posts: [res.data, ...prev.posts]}));

  // clear textarea
      setContent("");
  };

  const toggleLike = async (id) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/like/${id}`, {}, {
      withCredentials: true
    });

    setUser(prev => ({
      ...prev,
      posts: prev.posts.map(p =>
        p._id === id ? { ...p, likes: res.data.likes } : p
      )
    }));
  };

  const deletePost = async (id) => {
      if (!confirm("Are you sure you want to delete this post?")) return;
  await axios.delete(`${import.meta.env.VITE_API_URL}/api/post/${id}`, {
    withCredentials: true
  });

  setUser(prev => ({
    ...prev,
    posts: prev.posts.filter(p => p._id !== id)
  }));
};


  if (!user) return <p>Loading...</p>;

  return (
    <div className="bg-zinc-900 min-h-screen text-white p-10">
      <button
        onClick={() => axios.get(`${import.meta.env.VITE_API_URL}/api/logout`, { withCredentials: true }).then(() => navigate("/login"))}
        className="bg-red-500 px-3 py-2 rounded-md float-right cursor-pointer"
      >
        Logout
      </button>

      <div className="flex items-center gap-3 mt-10">
        <img
          src={`${import.meta.env.VITE_API_URL}/uploads/${user.profilepic}`}
          className="w-10 h-10 rounded-md"
        />
        <h3 className="text-3xl">Hello {user.name}</h3>
      </div>

      <textarea
        className="border-2 border-zinc-700 bg-transparent p-3 mt-5 w-1/3  outline-none"
        placeholder="what is going on"
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      <button
        onClick={createPost}
        className="bg-blue-500 px-3 py-2 block mt-2 rounded-md cursor-pointer"
      >
        Create Post
      </button>
      <input
         type="text"
         placeholder="Search posts..."
         value={search}
         onChange={(e) => setSearch(e.target.value)}
         className="bg-zinc-800 border border-zinc-700 p-2 mt-4 rounded-md w-1/3 outline-none"
      />

      <h3 className="mt-10 text-zinc-400">Your Posts</h3>

    {user.posts
    .filter(post =>
    post.content.toLowerCase().includes(search.toLowerCase())
    )
    .map(post => (
      <div>
        <div key={post._id} className="border border-zinc-700 p-5 mt-4 w-1/3">
          <p>{post.content}</p>
          <small>{post.likes.length} likes</small>
          <div className="flex gap-4 mt-2">
            <button className="cursor-pointer" onClick={() => toggleLike(post._id)}>
              {post.likes.includes(user._id) ? "Unlike" : "Like"}
            </button>
            <button className="cursor-pointer" onClick={() => navigate(`/edit/${post._id}`)}>Edit</button>
          </div>
        </div>
          <button onClick={() => deletePost(post._id)} className="text-red-400 ml-100 cursor-pointer">
            Delete
          </button>
      </div>

      ))}
    </div>
  );
}