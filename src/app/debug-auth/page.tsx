import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { getCurrentUser } from '@/lib/auth/auth-utils';

export default async function DebugAuthPage() {
  const session = await getServerSession(authOptions);
  const user = await getCurrentUser();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Raw Session:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Processed User:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 