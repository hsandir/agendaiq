#!/bin/bash

echo "Fixing Meeting relation references to match database schema..."

# Find and fix Meeting relations
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "Meeting:" {} \; | while read -r file; do
  echo "Processing: $file"
  
  # Fix Meeting: to meeting: in include statements
  sed -i '' 's/Meeting:/meeting:/g' "$file"
  
  # Fix .Meeting. to .meeting.
  sed -i '' 's/\.Meeting\./\.meeting\./g' "$file"
  
  # Fix other PascalCase relations that might have been missed
  sed -i '' 's/MeetingAttendee:/meeting_attendee:/g' "$file"
  sed -i '' 's/MeetingAgendaItems:/meeting_agenda_items:/g' "$file"
  sed -i '' 's/MeetingActionItems:/meeting_action_items:/g' "$file"
  sed -i '' 's/MeetingNote:/meeting_notes:/g' "$file"
  sed -i '' 's/ParentMeeting:/parent_meeting:/g' "$file"
  sed -i '' 's/ContinuationMeetings:/continuation_meetings:/g' "$file"
  sed -i '' 's/ResponsibleStaff:/responsible_staff:/g' "$file"
  sed -i '' 's/AgendaItem:/agenda_item:/g' "$file"
  sed -i '' 's/AssignedTo:/assigned_to:/g' "$file"
done

echo "Done! Fixed Meeting and other relation references"