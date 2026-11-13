import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-frame">
      <Sidebar />
      <main className="app-main training-main">{children}</main>
    </div>
  );
}
