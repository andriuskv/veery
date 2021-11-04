import { useNotification } from "contexts/notification";
import "./notification.css";

export default function Notification({ notifications }) {
  const { dismissNotification } = useNotification();

  return (
    <div className="notifications">
      {notifications.map((notification, i) => (
        <div className={`notification${notification.hidding ? " hidding" : ""}`} key={notification.id}>
          <p>{notification.value}</p>
          <div className="notification-bottom">
            <button className="btn text-btn" onClick={() => dismissNotification(notification.id, i)}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}
