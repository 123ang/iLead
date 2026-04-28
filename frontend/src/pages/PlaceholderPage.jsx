import React from "react";
import { Card } from "../components/ui/Card.jsx";

export default function PlaceholderPage({ title }) {
  return (
    <Card title={title}>
      <p className="text-slate-600">
        Scaffold page ready. Next step: connect forms, filters, uploads, exports
        and role-specific workflows.
      </p>
    </Card>
  );
}
