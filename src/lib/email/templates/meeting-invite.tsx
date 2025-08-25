import React from 'react';
import { BaseEmailTemplate } from './base';
import { MeetingInviteData } from '../types';

interface MeetingInviteTemplateProps {
  data: MeetingInviteData
}

export function MeetingInviteTemplate({ data }: MeetingInviteTemplateProps) {
  const {
    _meetingTitle,
    _meetingDescription,
    _startTime,
    _endTime,
    _location,
    _organizer,
    _attendees,
    _meetingUrl,
    _agendaItems
  } = data;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} dakika`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours} saat ${mins} dakika` : `${hours} saat`;
    }
  };

  return (
    <BaseEmailTemplate
      title={`Meeting Invite: ${meetingTitle}`}
      previewText={`You're invited to "${meetingTitle}" on ${formatDateTime(startTime)}`}
    >
      <h2 style={{ color: '#374151', marginTop: 0 }}>
        📅 Meeting Invitation
      </h2>
      
      <p style={{ fontSize: '16px', marginBottom: '24px' }}>
        You have been invited to attend the following meeting:
      </p>

      <div className="meeting-details">
        <h3 style={{ color: '#1f2937', marginBottom: '16px' }}>
          {meetingTitle}
        </h3>
        
        {meetingDescription && (
          <p style={{ color: '#6b7280', marginBottom: '16px', fontStyle: 'italic' }}>
            {meetingDescription}
          </p>
        )}

        <div className="detail-row">
          <span className="detail-label">📅 Date:</span>
          <span className="detail-value">{formatDateTime(startTime)}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">⏱️ Duration:</span>
          <span className="detail-value">{getDuration()}</span>
        </div>
        
        {location && (
          <div className="detail-row">
            <span className="detail-label">📍 Location:</span>
            <span className="detail-value">{location}</span>
          </div>
        )}
        
        <div className="detail-row">
          <span className="detail-label">👤 Organizer:</span>
          <span className="detail-value">{organizer.name} ({organizer.email})</span>
        </div>
      </div>

      {agendaItems && agendaItems.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ color: '#374151', marginBottom: '16px' }}>
            📋 Agenda Items
          </h3>
          <ul style={{ paddingLeft: '20px', color: '#6b7280' }}>
            {agendaItems.map((item, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                <strong>{item.title}</strong>
                {item.description && (
                  <span style={{ color: '#9ca3af' }}> - {item.description}</span>
                )}
                {item.duration && (
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}> ({item.duration} min)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {attendees.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ color: '#374151', marginBottom: '16px' }}>
            👥 Attendees ({attendees.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {attendees.map((attendee, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#374151'
                }}
              >
                {attendee.name}
                {attendee.role && <span style={{ color: '#9ca3af' }}> ({attendee.role})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {meetingUrl && (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a href={meetingUrl} className="btn">
            📺 Join Meeting
          </a>
        </div>
      )}

      <div className="highlight">
        <p style={{ margin: '0', fontSize: '14px' }}>
          <strong>💡 Tip:</strong> Add this meeting to your calendar and prepare any materials mentioned in the agenda items above.
        </p>
      </div>

      <p style={{ marginTop: '24px', color: '#6b7280', fontSize: '14px' }}>
        If you cannot attend this meeting, please contact the organizer as soon as possible.
      </p>
    </BaseEmailTemplate>
  );
}