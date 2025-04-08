import React, { useState, useEffect } from "react";
import "./styles.css";

function App() {
  const [urls, setUrls] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [inputUrl, setInputUrl] = useState("");

  const intervalTime = 5 * 60 * 1000; 

  const statusColors = {
    "รอรับเรื่อง": "#f44336", // red
    "รับเรื่อง": "#ffeb3b", // yellow
    "ส่งต่อ(ใหม่)": "#2196f3", // blue
    "กำลังดำเนินการ": "#ff9800", // orange
    "เสร็จสิ้น": "#4caf50", // green
  };

  const extractTicketID = (inputUrl) => {
    const urlParams = new URLSearchParams(inputUrl.split("?")[1]);
    return urlParams.get("ticketID");
  };

  const fetchStatus = async (ticketID) => {
    try {
      const response = await fetch(
        `https://publicapi.traffy.in.th/teamchadchart-stat-api/geojson/v1?text=${ticketID}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      const matched = data.features.find(f => f.properties.ticket_id === ticketID);
      return matched ? matched.properties.state : null;
    } catch (error) {
      console.error("เกิดข้อผิดพลาด:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    const ticketID = extractTicketID(inputUrl);

    if (!ticketID) {
      alert("กรุณากรอก URL ที่ถูกต้อง");
      return;
    }

    if (urls.includes(inputUrl)) {
      alert("URL นี้ถูกเพิ่มแล้ว!");
      return;
    }

    setUrls((prev) => [...prev, inputUrl]);
    setStatuses((prev) => [...prev, "กำลังโหลด..."]);

    const status = await fetchStatus(ticketID);

    if (status) {
      setStatuses((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = status;
        return updated;
      });
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      urls.forEach(async (url, index) => {
        const ticketID = extractTicketID(url);
        if (!ticketID) return;

        const newStatus = await fetchStatus(ticketID);

        if (newStatus && newStatus !== statuses[index]) {
          setNotifications((prev) => [
            ...prev,
            { ticketID, oldStatus: statuses[index], newStatus },
          ]);
        }

        setStatuses((prev) => {
          const updated = [...prev];
          updated[index] = newStatus || prev[index];
          return updated;
        });
      });
    }, intervalTime);

    return () => clearInterval(intervalId);
  }, [urls, statuses]);

  return (
    <div className="container">
      <div className="left-container">
        <h1>🧀 Fondue Case Tracker</h1>
        <input
          type="text"
          placeholder="ป้อน URL ของ Fondue Case"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
        />
        <button onClick={handleSubmit}>ติดตามเคส</button>

        <div className="case-list">
          {urls.map((url, index) => {
            const ticketID = extractTicketID(url);
            const status = statuses[index] || "กำลังโหลด...";
            const color = statusColors[status] || "#ccc";
            return (
              <div
                className="case-item"
                key={index}
                style={{ backgroundColor: color }}
              >
                <strong>เคส {ticketID}</strong>: {status}
              </div>
            );
          })}
        </div>
      </div>

      <div className="right-container">
        <h2>📢 การแจ้งเตือน</h2>
        <ul className="notification-list">
          {notifications.map((n, i) => (
            <li key={i}>
              <span role="img" aria-label="warning">
                ⚠️
              </span>{" "}
              เคส {n.ticketID} เปลี่ยนสถานะ: "{n.oldStatus}" → "{n.newStatus}"
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
