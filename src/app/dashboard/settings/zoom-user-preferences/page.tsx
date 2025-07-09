import React from 'react';

export default function ZoomUserPreferences() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Zoom User Preferences</h1>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Personal Zoom Account</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Connect My Zoom Account</button>
        <div className="mt-2 text-sm text-gray-600">Status: Not Connected</div>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Notification Preferences</h2>
        <label className="block mb-2">
          <input type="checkbox" className="mr-2" />
          Email Reminders
        </label>
        <label className="block mb-2">
          <input type="checkbox" className="mr-2" />
          SMS Reminders
        </label>
        <label className="block mb-2">
          <input type="checkbox" className="mr-2" />
          Calendar Integration
        </label>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Default Meeting Settings</h2>
        <label className="block mb-2">Preferred Meeting Duration (minutes):
          <input type="number" className="input input-bordered w-full" defaultValue={30} />
        </label>
        <label className="block mb-2">
          <input type="checkbox" className="mr-2" />
          Auto-mute on Join
        </label>
        <label className="block mb-2">
          <input type="checkbox" className="mr-2" />
          Video On by Default
        </label>
        <button className="px-4 py-2 bg-green-600 text-white rounded mt-2">Save Preferences</button>
      </section>
    </div>
  );
} 