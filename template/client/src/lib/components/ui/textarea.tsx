import * as React from 'react';
import { cn } from '@/lib/utils/cn.util';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-control border border-input bg-muted px-3 py-2 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:bg-destructive-soft md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
