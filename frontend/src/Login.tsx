import axios from "axios";
import React from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router";
import { login } from "./features/slices/authReducer";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add your login logic here
    try {
      const { data } = await axios.post("http://localhost:3000/auth/login", {
        email,
        password,
      });
      console.log("Login successful", data);
      dispatch(login(data));
      navigate("/forums");
    } catch (error) {
      console.error("Error submitting form", error);
    }
  };
  return (
    <div className="login">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
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
          Don't have an account? <Link to={"/signup"}>Signup</Link>
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
