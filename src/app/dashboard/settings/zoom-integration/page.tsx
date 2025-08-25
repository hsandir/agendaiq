import React from 'react';

export default function ZoomIntegrationSettings() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Zoom Integration Settings</h1>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Zoom Account Connection</h2>
        <button className="px-4 py-2 bg-primary text-foreground rounded">Connect Zoom Account</button>
        <div className="mt-2 text-sm text-muted-foreground">Status: Not Connected</div>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">API Credentials</h2>
        <input type="text" placeholder="API Key" className="input input-bordered w-full mb-2" />
        <input type="password" placeholder="API Secret" className="input input-bordered w-full mb-2" />
        <button className="px-4 py-2 bg-background text-foreground rounded">Save Credentials</button>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Organization Preferences</h2>
        <label className="block mb-2">Default Meeting Duration (minutes):
          <input type="number" className="input input-bordered w-full" defaultValue={30} />
        </label>
        <label className="block mb-2">Default Host:
          <input type="text" className="input input-bordered w-full" placeholder="e.g. admin@school.edu" />
        </label>
        <label className="block mb-2">
          <input type="checkbox" className="mr-2" />
          Automatic Meeting Recording
        </label>
        <button className="px-4 py-2 bg-green-600 text-foreground rounded mt-2">Save Preferences</button>
      </section>
    </div>
  )
} 