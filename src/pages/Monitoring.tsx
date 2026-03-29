export default function Monitoring() {
  const monitorUrl = import.meta.env.DEV
    ? "http://localhost:8000/monitor"
    : "http://195.35.6.222:8000/monitor";

  return (
    <div className="h-full w-full -m-6">
      <iframe
        src={monitorUrl}
        className="w-full h-full border-0"
        style={{ minHeight: "calc(100vh - 64px)" }}
        title="Server Monitor"
      />
    </div>
  );
}
