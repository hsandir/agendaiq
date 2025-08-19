"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, User } from "lucide-react";
import { format } from "date-fns";
import { getSafeDate } from '@/lib/utils/safe-date';

interface Comment {
  id: number;
  comment: string;
  created_at: string | Date;  // Support both string and Date
  Staff: {
    User: {
      id: number;
      name: string | null;
      email: string;
    }
    Role?: {
      id: number;
      title: string;
    }
  }
}

interface Props {
  itemId: number;
  comments: Comment[];
  onAddComment: (content: string) => void;
  canComment: boolean;
}

export function AgendaItemComments({ itemId, comments, onAddComment, canComment }: Props) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!String(newComment).trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(String(newComment).trim());
      setNewComment("");
    } catch (error: unknown) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageSquare className="h-4 w-4" />
        <span>Comments ({comments.length})</span>
      </div>

      {/* Add Comment */}
      {canComment && (
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="w-full"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!String(newComment).trim() || isSubmitting}
            >
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-muted rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-sm">
                      {comment.Staff.User.name ?? comment.Staff.User.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(() => {
                        const date = getSafeDate(comment.created_at);
                        return date ? format(date, "MMM d, h:mm a") : 'Unknown time';
                      })()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}