import type { LucideIcon, LucideProps } from 'lucide-react-native';

/* Minimal Lucide wrapper (upstream Reusables uses cssInterop for
 * className support, which doesn't typecheck against the installed
 * lucide-react-native 1.46.0 — so this pilot version passes explicit
 * size/color props only. Dexter default icon color is ink black. */
type IconProps = LucideProps & {
  as: LucideIcon;
} & React.RefAttributes<LucideIcon>;

function Icon({ as: IconComponent, size = 18, color = '#000000', ...props }: IconProps) {
  return <IconComponent size={size} color={color} {...props} />;
}

export { Icon };
