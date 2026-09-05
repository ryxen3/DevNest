import { Outlet } from "react-router";
import "./Home.css";
import Navbar from "./components/Navbar";

const Home = () => {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
};

export default Home;
