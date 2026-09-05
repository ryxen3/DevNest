import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import "./Signup.css";

const Signup = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add your signup logic here
    try {
      const { data } = await axios.post("http://localhost:3000/auth/signup", {
        username,
        email,
        password,
      });
      navigate("/");
      console.log("Signup successful", data);
    } catch (error) {
      console.error("Error submitting form", error);
    }
  };
  return (
    <div className="signup">
      <h1>Signup</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          Have an account already? <Link to={"/"}>Signin</Link>
        </div>
        <button type="submit">Signup</button>
      </form>
    </div>
  );
};

export default Signup;
