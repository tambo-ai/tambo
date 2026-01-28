'use client';

import { useTamboComponentState, useTamboStreamingProps } from '@tambo-ai/react';
import { User, Mail, Building, FileText } from 'lucide-react';
import { ContactCardProps, ContactCardPropsSchema } from './schema';

export default function ContactCard(props: ContactCardProps) {
  const [state] = useTamboComponentState(props);
  const streamingProps = useTamboStreamingProps(ContactCardPropsSchema);

  const currentProps = { ...state, ...streamingProps };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 max-w-md">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <User className="h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{currentProps.name || 'Loading...'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Mail className="h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900">{currentProps.email || 'Loading...'}</p>
          </div>
        </div>

        {currentProps.company && (
          <div className="flex items-center space-x-3">
            <Building className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Company</p>
              <p className="text-gray-900">{currentProps.company}</p>
            </div>
          </div>
        )}

        {currentProps.notes && (
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-gray-900 text-sm">{currentProps.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { ContactCardPropsSchema };
