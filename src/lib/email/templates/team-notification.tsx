import React from 'react';
import { BaseEmailTemplate } from './base';
import { TeamNotificationData } from '../types';

interface TeamNotificationTemplateProps {
  data: TeamNotificationData
}

export function TeamNotificationTemplate({ data }: TeamNotificationTemplateProps) {
  const {
    _teamName,
    _actionType,
    _actor,
    _teamUrl,
    _message,
    _details
  } = data;

  const getActionIcon = () => {
    switch (actionType) {
      case 'created': return '🎉';
      case 'updated': return '✏️';
      case 'member_added': return '👋';
      case 'member_removed': return '👋';
      case 'role_changed': return '🔄';
      default: return '📝'
    }
  };

  const getActionTitle = () => {
    switch (actionType) {
      case 'created': return `Team "${teamName}" has been created`;
      case 'updated': return `Team "${teamName}" has been updated`;
      case 'member_added': return `You have been added to team "${teamName}"`;
      case 'member_removed': return `You have been removed from team "${teamName}"`;
      case 'role_changed': return `Your role in team "${teamName}" has changed`;
      default: return `Update for team "${teamName}"`;
    }
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'created':
        return `${actor.name} has created a new team. You can now collaborate with your team members.`;
      case 'updated':
        return `${actor.name} has made changes to the team settings.`;
      case 'member_added':
        return `${actor.name} has added you as a team member. Welcome to the team!`;
      case 'member_removed':
        return `${actor.name} has removed you from this team.`;
      case 'role_changed':
        return `${actor.name} has updated your role in this team.`;
      default:
        return `${actor.name} has made changes to this team.`;
    }
  };

  return (
    <BaseEmailTemplate
      title={`Team Update: ${teamName}`}
      previewText={getActionTitle()}
    >
      <h2 style={{ color: '#374151', marginTop: 0 }}>
        {getActionIcon()} Team Update
      </h2>
      
      <div className="highlight">
        <h3 style={{ color: '#1f2937', marginTop: 0, marginBottom: '8px' }}>
          {getActionTitle()}
        </h3>
        <p style={{ color: '#6b7280', margin: 0 }}>
          {getActionDescription()}
        </p>
      </div>

      {message && (
        <div style={{ margin: '20px 0' }}>
          <h4 style={{ color: '#374151', marginBottom: '8px' }}>Message:</h4>
          <p style={{ 
            color: '#6b7280', 
            backgroundColor: '#f8fafc', 
            padding: '16px', 
            borderRadius: '6px',
            fontStyle: 'italic',
            margin: 0
          }}>
            "{message}"
          </p>
        </div>
      )}

      {details && Object.keys(details).length > 0 && (
        <div style={{ margin: '24px 0' }}>
          <h4 style={{ color: '#374151', marginBottom: '12px' }}>Details:</h4>
          <div className="meeting-details">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="detail-row">
                <span className="detail-label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                <span className="detail-value">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ margin: '24px 0' }}>
        <div className="detail-row">
          <span className="detail-label">👤 Action by:</span>
          <span className="detail-value">{actor.name} ({actor.email})</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">🕐 Time:</span>
          <span className="detail-value">{new Date().toLocaleString('tr-TR')}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={teamUrl} className="btn">
          🏢 View Team
        </a>
      </div>

      {actionType === 'member_added' && (
        <div className="highlight">
          <p style={{ margin: '0', fontSize: '14px' }}>
            <strong>🚀 Getting Started:</strong> Visit the team page to see current projects, 
            upcoming meetings, and connect with your new teammates.
          </p>
        </div>
      )}

      {actionType === 'role_changed' && details?.newRole && (
        <div className="highlight">
          <p style={{ margin: '0', fontSize: '14px' }}>
            <strong>🎯 Your New Role:</strong> You are now a <strong>{details.newRole}</strong> in this team. 
            Check the team page to see your updated permissions and responsibilities.
          </p>
        </div>
      )}

      <p style={{ marginTop: '24px', color: '#6b7280', fontSize: '14px' }}>
        Questions about this team update? Contact {actor.name} at {actor.email}.
      </p>
    </BaseEmailTemplate>
  );
}