import { useEffect, useState } from "react";
import apiClient from "./api/client";

export default function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    apiClient
      .get("/health")
      .then((res) => setStatus(res.data.message))
      .catch(() => setStatus("Could not reach backend"));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>FoodBridge</h1>
      <p>Backend says: <strong>{status}</strong></p>
    </div>
  );
}
