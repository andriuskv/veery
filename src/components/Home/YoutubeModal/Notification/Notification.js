import { useState, useEffect } from "react";
import { classNames } from "../../../../utils";
import Icon from "components/Icon";
import "./notification.css";

export default function Notification({ notification, dismiss }) {
  const [state, setState] = useState(notification);
  const type = "negative";

  useEffect(() => {
    if (!state.flashing && state !== notification) {
      if (state.value !== notification.value) {
        setState(notification);
        return;
      }
      setState({ ...state, flashing: true });

      setTimeout(() => {
        setState(notification);
      }, 640);
    }
  }, [state, notification]);

  return (
    <div className={classNames("notification", type, state.flashing ? "flash" : "")}>
      <Icon id="circle-close" className="notification-icon"/>
      <span className="notification-text">{state.value}</span>
      <button type="button" className="btn icon-btn notification-dismiss-btn" onClick={dismiss} title="Dismiss">
        <Icon id="close" className="notification-dismiss-btn-icon"/>
      </button>
    </div>
  );
}
