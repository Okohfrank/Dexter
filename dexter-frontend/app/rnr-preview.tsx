import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/rnr/avatar';
import { Button } from '@/src/components/rnr/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/rnr/card';
import { Icon } from '@/src/components/rnr/icon';
import { Input } from '@/src/components/rnr/input';
import { Text } from '@/src/components/rnr/text';
import { ArrowRight } from 'lucide-react-native';

/* Dev-only pilot screen for the React Native Reusables foundation.
 * Not linked from any nav — open via /rnr-preview.
 * Proves RNR primitives render in the Dexter monochrome theme. */
export default function RnrPreviewScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'RNR Pilot', headerShown: true }} />
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 48, gap: 12 }}>
        <Text className="font-display text-2xl text-foreground">Dexter v2 pilot</Text>
        <Text className="text-sm text-muted-foreground">
          Dark-first theme on RNR primitives. Legacy screens are untouched.
        </Text>

        <Card>
          <CardHeader>
            <CardTitle>Card + Button</CardTitle>
            <CardDescription>radius-md, space-5 padding per DESIGN.md §3.2</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Button>
              <Text>Primary (black pill)</Text>
            </Button>
            <Button variant="secondary">
              <Text>Secondary</Text>
            </Button>
            <Button variant="outline">
              <Text>Outline</Text>
            </Button>
            <Button variant="ghost">
              <Text>Ghost</Text>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Sunken pill per DESIGN.md §3.5</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Input placeholder="Ask Dexter anything" />
            <Input placeholder="Disabled" editable={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avatar + Icon</CardTitle>
          </CardHeader>
          <CardContent className="flex-row items-center gap-3">
            <Avatar alt="Dexter">
              <AvatarImage source={{ uri: 'https://github.com/shadcn.png' }} />
              <AvatarFallback>
                <Text>DX</Text>
              </AvatarFallback>
            </Avatar>
            <View className="size-11 items-center justify-center rounded-full bg-secondary">
              <Icon as={ArrowRight} size={18} />
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
