import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof ToastPrimitive.Viewport>>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport ref={ref} className={cn('fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:max-w-[420px]', className)} {...props} />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:animate-out data-[swipe=move]:transition-transform data-[swipe=move]:duration-500',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive: 'destructive group border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Toast = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props}>
      <div className="grid gap-1">
        {props.title && <div className="text-sm font-semibold">{props.title}</div>}
        {props.description && <div className="text-sm opacity-90">{props.description}</div>}
      </div>
      <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring group-hover:opacity-100 group-hover:delay-100 group-hover:duration-200">
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof<typeof ToastPrimitive.Action>>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action ref={ref} className={cn('inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary:50 focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50', className)} {...props} />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

const Toaster = React.forwardRef<HTMLDivElement, ToastProps>(({ ...props }, ref) => (
  <ToastProvider>
    <ToastViewport ref={ref} {...props} />
  </ToastProvider>
));
Toaster.displayName = 'Toaster';

export { Toast, ToastAction, Toaster };
