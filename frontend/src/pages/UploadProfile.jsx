import axios from "axios";

export default function UploadProfile() {
  // Use environment variable for backend URL
  const API = import.meta.env.VITE_API_URL;

  const upload = async (e) => {
    const formData = new FormData();
    formData.append("image", e.target.files[0]);

    await axios.post(`${API}/api/upload`, formData, {
      withCredentials: true // important for cookie
    });
  };

  return (
    <div className="bg-zinc-900 min-h-screen text-white p-10">
      <h3 className="text-3xl mb-5">Upload Profile Picture</h3>
      <input
        type="file"
        onChange={upload}
        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                   file:bg-blue-600 file:text-white file:cursor-pointer
                   text-sm text-zinc-300 cursor-pointer"
      />
    </div>
  );
}
