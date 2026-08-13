import { useEffect, useMemo, useRef, useState } from "react";

const wheelColors = ["#3174d4", "#e25b57", "#f2b84b", "#55b37d", "#8b6fc7"];
const minimumSpinDuration = 7000;
const spinDurationRange = 1800;

function randomIndex(length) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % length;
}

function randomUnit() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 0xffffffff;
}

export default function SpinWheel({ options, buttonLabel, resultButtonLabel = "Confirm result", disabled, continueAfterResult = false, renderOption, onResult }) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDuration, setSpinDuration] = useState(minimumSpinDuration);
  const [spinMessage, setSpinMessage] = useState("");
  const [displayOptions, setDisplayOptions] = useState(options);
  const [landedResult, setLandedResult] = useState("");
  const resultTimer = useRef(null);
  const messageTimers = useRef([]);
  const background = useMemo(() => {
    if (!displayOptions.length) return "var(--soft)";
    const slice = 100 / displayOptions.length;
    return `conic-gradient(${displayOptions.map((_, index) => `${wheelColors[index % wheelColors.length]} ${index * slice}% ${(index + 1) * slice}%`).join(", ")})`;
  }, [displayOptions]);

  useEffect(() => () => {
    window.clearTimeout(resultTimer.current);
    messageTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!isSpinning && !landedResult) setDisplayOptions(options);
  }, [isSpinning, landedResult, options]);

  function startSpin(spinOptions) {
    if (!spinOptions.length) return;
    const index = randomIndex(spinOptions.length);
    const sliceAngle = 360 / spinOptions.length;
    const safeOffset = (randomUnit() - 0.5) * sliceAngle * 0.7;
    const targetAngle = 360 - ((index + 0.5) * sliceAngle + safeOffset);
    const duration = minimumSpinDuration + Math.round(randomUnit() * spinDurationRange);
    const fullTurns = 8 + randomIndex(3);
    const nextRotation = rotation + fullTurns * 360 + ((targetAngle - (rotation % 360) + 360) % 360);
    const result = spinOptions[index];

    messageTimers.current.forEach(window.clearTimeout);
    setDisplayOptions(spinOptions);
    setIsSpinning(true);
    setSpinDuration(duration);
    setSpinMessage("Building momentum...");
    setRotation(nextRotation);
    messageTimers.current = [
      window.setTimeout(() => setSpinMessage("The wheel is deciding..."), duration * 0.42),
      window.setTimeout(() => setSpinMessage("Almost there..."), duration * 0.73),
      window.setTimeout(() => setSpinMessage("Hold on..."), duration * 0.9),
    ];
    resultTimer.current = window.setTimeout(() => {
      setIsSpinning(false);
      setSpinMessage("");
      setLandedResult(result);
    }, duration);
  }

  function spin() {
    if (isSpinning) return;

    if (landedResult) {
      const confirmedResult = landedResult;
      const remainingOptions = displayOptions.filter((option) => option !== confirmedResult);
      setLandedResult("");
      onResult(confirmedResult);
      if (continueAfterResult) startSpin(remainingOptions);
      return;
    }

    if (disabled || !options.length) return;
    startSpin(options);
  }

  return (
    <div className={"spin-wheel-control" + (isSpinning ? " is-spinning" : "") + (landedResult ? " has-result" : "")}>
      <div className="spin-wheel-pointer" aria-hidden="true" />
      <div
        className="spin-wheel"
        style={{ background, transform: `rotate(${rotation}deg)`, "--spin-duration": `${spinDuration}ms` }}
        aria-hidden="true"
      >
        {displayOptions.map((option, index) => {
          const angle = (index + 0.5) * (360 / displayOptions.length);
          const labelRadius = renderOption ? 66 : 92;
          return (
            <span
              className={"spin-wheel-label " + (renderOption ? "custom-option" : "")}
              key={option}
              style={{ transform: `rotate(${angle}deg) translateY(-${labelRadius}px) rotate(${-angle - rotation}deg)`, "--spin-duration": `${spinDuration}ms` }}
            >
              {renderOption ? renderOption(option) : option}
            </span>
          );
        })}
      </div>
      <div className="spin-wheel-result" aria-live="polite">{landedResult || spinMessage || "\u00a0"}</div>
      <button className="primary-btn spin-wheel-button" type="button" disabled={!landedResult && (disabled || isSpinning || !options.length)} onClick={spin}>
        {isSpinning ? "Spinning..." : landedResult ? (continueAfterResult ? "Spin again" : resultButtonLabel) : buttonLabel}
      </button>
    </div>
  );
}
