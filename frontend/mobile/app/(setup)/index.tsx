import { Redirect } from 'expo-router';

export default function SetupIndex() {
  return <Redirect href="/(setup)/step-1" />;
}
