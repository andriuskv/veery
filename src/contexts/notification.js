import { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { getRandomString } from "../utils";

const NotificationContext = createContext();

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const value = useMemo(() => ({ notifications, showNotification, dismissNotification }), [notifications]);
  const timeoutId = useRef(0);
  const addRef = useRef(null);

  useEffect(() => {
    addRef.current = add;
  });

  useEffect(() => {
    clearTimeout(timeoutId.current);

    window.addEventListener("notification", handleNotification);

    // Dismiss oldest notification every 5 seconds
    if (notifications.length) {
      timeoutId.current = setTimeout(() => {
        hide(0);

        setTimeout(() => {
          notifications.shift();
          setNotifications([...notifications]);
        }, 400);
      }, 5000);
    }

    return () => {
      window.removeEventListener("notification", handleNotification);
    };
  }, [notifications]);

  function handleNotification({ detail }) {
    showNotification(detail);
  }

  function showNotification(notification) {
    notification.id = getRandomString();

    addRef.current(notification);
    return notification.id;
  }

  function add(notification) {
    const end = notifications.length + 1;
    const start = end - 6 < 0 ? 0 : end - 6;

    notifications.push(notification);
    setNotifications([...notifications.slice(start, end)]);
  }

  function dismissNotification(id) {
    const index = notifications.findIndex(n => n.id === id);

    hide(index);

    setTimeout(() => {
      notifications.splice(index, 1);
      setNotifications([...notifications]);
    }, 400);
  }

  function hide(index) {
    notifications[index].hidding = true;
    setNotifications([...notifications]);
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

function useNotification() {
  return useContext(NotificationContext);
}

export {
  NotificationProvider,
  useNotification
};
