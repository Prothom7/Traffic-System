"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getValidAuthTokenClient } from "@/helpers/jwtClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [canAccess, setCanAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const token = getValidAuthTokenClient();
      if (!token) {
        router.push("/authentication/signin");
        return;
      }

      try {
        const response = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (!data?.success || !data?.data?.user?.isAdmin) {
          router.push("/dashboard");
          return;
        }

        setCanAccess(true);
      } catch (error) {
        router.push("/dashboard");
      } finally {
        setChecking(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#e2e8f0",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        Verifying admin access...
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return <>{children}</>;
}