import React from 'react';

export default function MeetingHelpDocumentation() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Meeting Help & Documentation</h1>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">FAQ</h2>
        <ul className="list-disc pl-6">
          <li>How do I connect my Zoom account?</li>
          <li>How do I schedule a staff meeting?</li>
          <li>How do I join a Zoom meeting from the dashboard?</li>
          <li>What if I have trouble connecting to Zoom?</li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting</h2>
        <ul className="list-disc pl-6">
          <li>Ensure your Zoom account is connected in the settings.</li>
          <li>Check your internet connection.</li>
          <li>Contact your admin if you see access errors.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Support</h2>
        <p>For further assistance, contact <a href="mailto:support@school.edu" className="text-blue-600 underline">support@school.edu</a>.</p>
      </section>
    </div>
  );
} 