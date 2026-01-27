type EmailPreviewProps = {
  to: string;
  subject: string;
  body: string;
};

export function EmailPreview({ to, subject, body }: EmailPreviewProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      <div className="text-sm text-gray-500">
        AI-generated email preview
      </div>

      <div>
        <p className="text-sm">
          <strong>To:</strong> {to}
        </p>
        <p className="text-sm">
          <strong>Subject:</strong> {subject}
        </p>
      </div>

      <div className="border-t pt-3 whitespace-pre-line text-gray-800">
        {body}
      </div>

      <div className="text-xs text-gray-400">
        Review this email before sending
      </div>
    </div>
  );
}
