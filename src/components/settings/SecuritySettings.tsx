"use client";

import { useState, useEffect } from "react";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { Shield, Smartphone, AlertTriangle } from "lucide-react";

interface Device {
  id: number;
  device_name: string;
  device_type: string;
  device_os: string;
  browser: string;
  ip_address: string;
  last_active: string;
  is_trusted: boolean;
}

export function SecuritySettings({ user }: { user: any }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices");
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const trustDevice = async (deviceId: number, trust: boolean) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_trusted: trust })
      });

      if (response.ok) {
        fetchDevices();
      }
    } catch (error) {
      console.error("Failed to update device:", error);
    }
  };

  const removeDevice = async (deviceId: number) => {
    if (!confirm("Are you sure you want to remove this device?")) return;

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        fetchDevices();
      }
    } catch (error) {
      console.error("Failed to remove device:", error);
    }
  };

  const disable2FA = async () => {
    if (!twoFactorCode) return;

    setIsDisabling2FA(true);
    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: twoFactorCode })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to disable 2FA");
      }
    } catch (error) {
      console.error("Failed to disable 2FA:", error);
    } finally {
      setIsDisabling2FA(false);
      setTwoFactorCode("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Two-Factor Authentication Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
        </div>

        {user.two_factor_enabled ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Two-factor authentication is currently enabled for your account.
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Enabled
              </span>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Disable 2FA</h3>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter 2FA code"
                  maxLength={6}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={disable2FA}
                  disabled={isDisabling2FA || twoFactorCode.length !== 6}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isDisabling2FA ? "Disabling..." : "Disable 2FA"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {show2FASetup ? (
              <TwoFactorSetup />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enhance your account security by enabling two-factor authentication.
                </p>
                <button
                  onClick={() => setShow2FASetup(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Enable 2FA
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Device Management Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center mb-4">
          <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold">Device Management</h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading devices...</p>
        ) : devices.length === 0 ? (
          <p className="text-sm text-gray-500">No devices registered yet.</p>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{device.device_name}</h3>
                    <div className="mt-1 text-sm text-gray-500 space-y-1">
                      <p>Type: {device.device_type} • OS: {device.device_os} • Browser: {device.browser}</p>
                      <p>IP: {device.ip_address}</p>
                      <p>Last active: {new Date(device.last_active).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {device.is_trusted ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Trusted
                      </span>
                    ) : (
                      <button
                        onClick={() => trustDevice(device.id, true)}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                      >
                        Trust
                      </button>
                    )}
                    <button
                      onClick={() => removeDevice(device.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>Trusted devices won't require 2FA verification when signing in.</p>
        </div>
      </section>

      {/* Security Notifications */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Security Notifications</h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm">Login notifications</span>
            <input
              type="checkbox"
              checked={user.login_notifications_enabled}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              disabled
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-sm">Suspicious activity alerts</span>
            <input
              type="checkbox"
              checked={user.suspicious_alerts_enabled}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              disabled
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-sm">Remember trusted devices</span>
            <input
              type="checkbox"
              checked={user.remember_devices_enabled}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              disabled
            />
          </label>
        </div>
      </section>
    </div>
  );
}