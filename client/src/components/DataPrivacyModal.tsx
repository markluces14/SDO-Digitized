import { useEffect, useState } from "react";

export default function DataPrivacyModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem("privacyAccepted");
      if (!accepted) setOpen(true);
    } catch {
      setOpen(false);
    }
  }, []);

  if (!open) return null;

  const accept = () => {
    localStorage.setItem("privacyAccepted", "1");
    setOpen(false);
  };

  return (
    <div className="privacy-backdrop">
      <div className="privacy-modal">
        <h2>🔒 Data Privacy Notice</h2>
        <p>
          The Schools Division of Roxas City is committed to protecting your
          personal information in accordance with the Data Privacy Act of 2012
          (RA 10173).
        </p>
        <p>
          This system collects only information necessary for personnel records
          and document management. Your data is securely stored and accessed
          only by authorized personnel.
        </p>
        <p>
          By continuing to use this system, you acknowledge and agree to this
          notice.
        </p>
        <button className="btn-primary" onClick={accept}>
          I Understand
        </button>
      </div>
    </div>
  );
}
