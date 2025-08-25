import React from 'react';

interface BaseEmailTemplateProps {
  children: React.ReactNode;
  title?: string;
  previewText?: string;
}

export function BaseEmailTemplate({ 
  children, 
  title = "AgendaIQ", 
  previewText 
}: BaseEmailTemplateProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 32px 24px;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            margin: 16px 0;
            text-align: center;
          }
          .btn:hover {
            opacity: 0.9;
          }
          .highlight {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
          }
          .meeting-details {
            background-color: #f8fafc;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .meeting-details h3 {
            margin-top: 0;
            color: #374151;
          }
          .detail-row {
            display: flex;
            margin: 8px 0;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
            width: 100px;
            flex-shrink: 0;
          }
          .detail-value {
            color: #6b7280;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .content {
              padding: 24px 16px;
            }
            .header {
              padding: 24px 16px;
            }
            .detail-row {
              flex-direction: column;
            }
            .detail-label {
              width: auto;
              margin-bottom: 4px;
            }
          }
        `}</style>
      </head>
      <body>
        {previewText && (
          <div style={{ display: 'none', fontSize: '1px', color: '#ffffff', lineHeight: '1px', maxHeight: '0px', maxWidth: '0px', opacity: 0, overflow: 'hidden' }}>
            {previewText}
          </div>
        )}
        <div className="container">
          <div className="header">
            <h1>AgendaIQ</h1>
          </div>
          <div className="content">
            {children}
          </div>
          <div className="footer">
            <p>
              © {new Date().getFullYear()} AgendaIQ. All rights reserved.
              <br />
              This email was sent from an automated system. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}