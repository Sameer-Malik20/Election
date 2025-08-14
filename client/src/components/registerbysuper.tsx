import { useState } from "react";

export default function CreateAdmin() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          password: formData.password,
          role: "admin",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create admin");
      }

      setSuccess("✅ Admin account created successfully");
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          Create New Admin
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-3 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-3 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "name", type: "text", placeholder: "Full Name" },
            { name: "email", type: "email", placeholder: "Email Address" },
            { name: "phone", type: "text", placeholder: "Phone Number" },
            { name: "address", type: "text", placeholder: "Address" },
            { name: "password", type: "password", placeholder: "Password" },
            {
              name: "confirmPassword",
              type: "password",
              placeholder: "Confirm Password",
            },
          ].map((input) => (
            <input
              key={input.name}
              name={input.name}
              type={input.type}
              placeholder={input.placeholder}
              value={(formData as any)[input.name]}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              required
              minLength={
                input.name === "password" || input.name === "confirmPassword"
                  ? 8
                  : undefined
              }
            />
          ))}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium transition ${
              isLoading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isLoading ? "Creating..." : "Create Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
