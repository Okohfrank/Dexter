import { Text, TextClassContext } from '@/src/components/rnr/text';
import { cn } from '@/src/lib/utils';
import { View } from 'react-native';

/* Dexter-tuned Reusables card: radius-md (20px) + space-5 padding
 * per DESIGN.md §3.2 (upstream is rounded-xl / gap-6 / py-6). */
function Card({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        className={cn(
          'bg-card border-border flex flex-col gap-4 rounded-[20px] border p-5 shadow-sm shadow-black/5',
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return (
    <Text
      role="heading"
      aria-level={3}
      className={cn('font-semibold leading-none', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return <Text className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-row items-center', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
