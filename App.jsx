import { useState, useEffect } from "react";
import Home from "./Home.jsx";
import Catalog from "./Catalog.jsx";
import Admin from "./Admin.jsx";

function readRoute() {
  const hash = window.location.hash.replace("#", "");
  if (hash === "catalogo") return "catalogo";
  if (hash === "admin") return "admin";
  return "home";
}

export default function App() {
  const [route, setRoute] = useState(readRoute());

  useEffect(() => {
    function onHashChange() {
      setRoute(readRoute());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(nextRoute) {
    window.location.hash = nextRoute === "home" ? "" : nextRoute;
    setRoute(nextRoute);
  }

  if (route === "catalogo") return <Catalog navigate={navigate} />;
  if (route === "admin") return <Admin navigate={navigate} />;
  return <Home navigate={navigate} />;
}
