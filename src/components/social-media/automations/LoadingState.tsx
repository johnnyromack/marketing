import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-2/5 mb-2" />
                <Skeleton className="h-3.5 w-full mb-1" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
