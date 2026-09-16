import { cn } from '@/src/lib/utils';
import { Platform, TextInput } from 'react-native';

/* Dexter-tuned Reusables input: sunken secondary surface + full-pill
 * radius per DESIGN.md §3.5 (upstream is rounded-md / h-10). */
function Input({ className, ...props }: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        'border-border bg-secondary text-foreground flex min-h-[48px] w-full min-w-0 flex-row items-center rounded-full border px-5 py-3 text-base leading-5 shadow-sm shadow-black/5',
        props.editable === false &&
        cn(
          'opacity-50',
          Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
        ),
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 aria-invalid:border-destructive'
          ),
          native: 'placeholder:text-muted-foreground/50',
        }),
        className
      )}
      {...props}
    />
  );
}

export { Input };
