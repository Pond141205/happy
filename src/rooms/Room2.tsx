import ConservatoryShell from './ConservatoryShell';
import BirthdayInstallation from './BirthdayInstallation';
import ForestEnvironment from './ForestEnvironment';
export default function Room2(props: { decorationPath?: string; reduced: boolean; out: boolean }) {
  return <group name="room-2-birthday"><ForestEnvironment /><ConservatoryShell><BirthdayInstallation {...props} /></ConservatoryShell></group>;
}
