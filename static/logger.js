const logs = document.getElementById("logs");

Object.keys(console).forEach((key) => {
  if (typeof console[key] !== "function") return;

  const call = console[key];
  console[key] = (...args) => {
    const pre = document.createElement("pre");
    pre.classList.add(key);

    const formatted = args.map((arg) => {
      if (typeof arg === "object" && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2); // pretty-print
        } catch (e) {
          return "[object with circular references]";
        }
      }
      return String(arg);
    });

    pre.textContent = formatted.join(" ") + "\n";

    // scroll
    logs.appendChild(pre);
    logs.scrollTop = logs.scrollHeight;

    call(...args);
  };
});

window.onerror = (message, source, lineno, colno, error) => {
  console.error(`${message}\n${source}:${lineno}:${colno}\n${error}`);
};
