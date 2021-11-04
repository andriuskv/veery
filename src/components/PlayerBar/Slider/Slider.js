import "./slider.css";

export default function Slider({ inert, element, className, progress, min, now, max, nowText, label, labelText, pointerDownHandler, keyDownHandler }) {
  if (inert) {
    return (
      <div className="slider-bar-container">
        <div className="slider-bar">
          <div className="slider-bar-inner"></div>
        </div>
      </div>
    );
  }
  return (
    <div className={`slider-bar-container${className ? ` ${className}` : ""}`}>
      <div className="slider-bar" ref={element} onPointerDown={pointerDownHandler}
        onKeyDown={keyDownHandler} role="slider" tabIndex="0" aria-label={labelText}
        aria-valuemin={min} aria-valuenow={now} aria-valuemax={max} aria-valuetext={nowText}>
        <div className="slider-bar-inner" style={{ "--progress": progress }}>
          <div className="slider-bar-elapsed"></div>
          <div className="slider-bar-thumb"></div>
        </div>
      </div>
      {label ? <div className="slider-label" style={{ "--progress": label.progress }}>{label.text}</div> : null}
    </div>
  );
}
